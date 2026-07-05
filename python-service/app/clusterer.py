import logging
from typing import List, Dict, Any, Set
from collections import Counter
from datetime import datetime
import uuid
import time
import re

from .config import Config
from .db import db
from .utils import get_stopwords

logger = logging.getLogger(__name__)

def calculate_overlap(keywords1: List[str], keywords2: List[str]) -> int:
    """
    Calculate the number of overlapping keywords between two articles.
    """
    if not keywords1 or not keywords2:
        return 0
    set1 = set(keywords1)
    set2 = set(keywords2)
    return len(set1 & set2)

def generate_cluster_label(articles: List[Dict[str, Any]]) -> str:
    """
    Generate a label for a cluster based on most common keywords.
    """
    if not articles:
        return "Untitled Cluster"
    
    # Count keyword frequency across all articles in cluster
    keyword_counter = Counter()
    for article in articles:
        if 'keywords' in article and article['keywords']:
            keyword_counter.update(article['keywords'])
    
    # Get top keywords (excluding very common ones)
    top_keywords = [kw for kw, _ in keyword_counter.most_common(5) if len(kw) > 2]
    
    if top_keywords:
        # Take top 2-3 keywords as label
        label = ' '.join(top_keywords[:3])
        # Capitalize first letter of each word
        label = ' '.join(word.capitalize() for word in label.split())
        return label
    else:
        # Fallback: use first article's title
        return articles[0].get('title', 'Untitled Cluster')[:50]

def cluster_articles(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cluster articles using keyword overlap approach.
    Returns list of cluster objects with metadata.
    """
    if not articles:
        logger.info("No articles to cluster")
        return []
    
    logger.info(f"Starting clustering for {len(articles)} articles")
    threshold = Config.CLUSTER_THRESHOLD
    
    clusters = []
    processed_articles = []
    
    # Process each article
    for article in articles:
        article_keywords = set(article.get('keywords', []))
        
        # If article has no keywords, skip it
        if not article_keywords:
            logger.debug(f"Skipping article with no keywords: {article.get('title', '')[:30]}")
            continue
        
        # Try to find matching cluster
        matched = False
        for cluster in clusters:
            # Check overlap with cluster's combined keywords
            cluster_keywords = set()
            for cluster_article in cluster['articles']:
                cluster_keywords.update(cluster_article.get('keywords', []))
            
            overlap = len(article_keywords & cluster_keywords)
            
            if overlap >= threshold:
                # Add to existing cluster
                cluster['articles'].append(article)
                cluster['keyword_set'].update(article_keywords)
                
                # Update time range
                pub_time = article.get('published_at')
                if pub_time:
                    if not cluster['start_time'] or pub_time < cluster['start_time']:
                        cluster['start_time'] = pub_time
                    if not cluster['end_time'] or pub_time > cluster['end_time']:
                        cluster['end_time'] = pub_time
                
                matched = True
                article['cluster_id'] = cluster['cluster_id']
                processed_articles.append(article)
                logger.debug(f"Article matched to cluster: {article.get('title', '')[:30]}")
                break
        
        # If no match, create new cluster
        if not matched:
            cluster_id = str(uuid.uuid4())
            new_cluster = {
                'cluster_id': cluster_id,
                'articles': [article],
                'keyword_set': set(article_keywords),  # Keep as set for processing
                'start_time': article.get('published_at'),
                'end_time': article.get('published_at'),
                'created_at': datetime.utcnow()
            }
            clusters.append(new_cluster)
            article['cluster_id'] = cluster_id
            processed_articles.append(article)
            logger.debug(f"Created new cluster: {cluster_id[:8]}")
    
    # Update articles in database with cluster_id
    for article in processed_articles:
        db.articles.update_one(
            {'_id': article['_id']},
            {'$set': {'cluster_id': article['cluster_id']}}
        )
    
    # Generate labels and save clusters to database
    saved_clusters = []
    for cluster in clusters:
        if not cluster['articles']:
            continue
        
        # Generate label
        label = generate_cluster_label(cluster['articles'])
        
        # Convert keyword_set (set) to list for MongoDB
        keywords_list = list(cluster['keyword_set'])[:20]
        
        # Create cluster document for database
        cluster_doc = {
            'cluster_id': cluster['cluster_id'],
            'label': label,
            'article_ids': [str(article['_id']) for article in cluster['articles']],
            'article_count': len(cluster['articles']),
            'start_time': cluster['start_time'],
            'end_time': cluster['end_time'],
            'keywords': keywords_list,  # Converted to list
            'created_at': datetime.utcnow(),
            'sources': list(set([article.get('source', 'Unknown') for article in cluster['articles']]))
        }
        
        # Save to database
        try:
            result = db.clusters.insert_one(cluster_doc)
            cluster_doc['_id'] = result.inserted_id
            
            # Update articles with cluster reference
            for article in cluster['articles']:
                db.articles.update_one(
                    {'_id': article['_id']},
                    {'$set': {'cluster_ref_id': result.inserted_id}}
                )
            
            saved_clusters.append(cluster_doc)
            logger.info(f"Saved cluster: {label} ({len(cluster['articles'])} articles)")
        except Exception as e:
            logger.error(f"Error saving cluster: {e}")
    
    logger.info(f"Clustering complete: {len(saved_clusters)} clusters created")
    return saved_clusters