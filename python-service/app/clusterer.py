import logging
from typing import List, Dict, Any
from collections import Counter
from datetime import datetime
import uuid
import re

from .config import Config
from .db import db

logger = logging.getLogger(__name__)


def calculate_overlap(keywords1: List[str], keywords2: List[str]) -> int:
    """
    Calculate the number of overlapping keywords between two lists.
    """
    if not keywords1 or not keywords2:
        return 0
    set1 = set(keywords1)
    set2 = set(keywords2)
    return len(set1 & set2)


def generate_cluster_label(articles: List[Dict[str, Any]]) -> str:
    """
    Generate a label for a cluster based on the most common keywords.
    """
    if not articles:
        return "Untitled Topic"

    # Count keyword frequency across all articles in cluster
    keyword_counter = Counter()
    for article in articles:
        if 'keywords' in article and article['keywords']:
            keyword_counter.update(article['keywords'])

    # Get top keywords
    top_keywords = [kw for kw, _ in keyword_counter.most_common(10) if len(kw) > 2]

    if top_keywords:
        # Take top 3 keywords as the label
        label = ' '.join(top_keywords[:3])
        label = ' '.join(word.capitalize() for word in label.split())
        return label
    else:
        # Fallback to the first article title truncated gracefully
        title = articles[0].get('title', 'Untitled Topic')
        title_words = re.sub(r'[^a-zA-Z\s]', '', title).split()
        return ' '.join(title_words[:4]).title() if title_words else "Untitled Topic"


def cluster_articles(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cluster articles using a Seed-Based Keyword Overlap approach.
    Comparing incoming articles with the 'seed' (first) article of a cluster
    completely prevents "cluster drift" and makes topics highly coherent.
    """
    if not articles:
        logger.info("No articles to cluster")
        return []

    logger.info(f"Starting clustering for {len(articles)} articles")
    threshold = Config.CLUSTER_THRESHOLD

    clusters = []
    processed_articles = []

    for article in articles:
        article_keywords = set(article.get('keywords', []))

        if not article_keywords:
            logger.debug(f"Skipping article with no keywords: {article.get('title', '')[:30]}")
            continue

        # Try to find a matching cluster
        matched = False
        for cluster in clusters:
            # Seed protection: Compare only with the seed (original) article of the cluster
            seed_article = cluster['articles'][0]
            seed_keywords = set(seed_article.get('keywords', []))

            overlap = len(article_keywords & seed_keywords)

            if overlap >= threshold:
                cluster['articles'].append(article)
                cluster['keyword_set'].update(article_keywords)

                # Update time bounds
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

        # If no cluster matched, establish a new cluster with this article as seed
        if not matched:
            cluster_id = str(uuid.uuid4())
            new_cluster = {
                'cluster_id': cluster_id,
                'articles': [article],
                'keyword_set': set(article_keywords),
                'start_time': article.get('published_at'),
                'end_time': article.get('published_at'),
                'created_at': datetime.utcnow()
            }
            clusters.append(new_cluster)
            article['cluster_id'] = cluster_id
            processed_articles.append(article)
            logger.debug(f"Created new cluster: {cluster_id[:8]}")

    # Save the references in the database
    for article in processed_articles:
        db.articles.update_one(
            {'_id': article['_id']},
            {'$set': {'cluster_id': article['cluster_id']}}
        )

    saved_clusters = []
    for cluster in clusters:
        if not cluster['articles']:
            continue

        label = generate_cluster_label(cluster['articles'])
        keywords_list = list(cluster['keyword_set'])[:20]

        cluster_doc = {
            'cluster_id': cluster['cluster_id'],
            'label': label,
            'article_ids': [str(art['_id']) for art in cluster['articles']],
            'article_count': len(cluster['articles']),
            'start_time': cluster['start_time'],
            'end_time': cluster['end_time'],
            'keywords': keywords_list,
            'created_at': datetime.utcnow(),
            'sources': list(set([art.get('source', 'Unknown') for art in cluster['articles']]))
        }

        try:
            result = db.clusters.insert_one(cluster_doc)
            cluster_doc['_id'] = result.inserted_id

            for art in cluster['articles']:
                db.articles.update_one(
                    {'_id': art['_id']},
                    {'$set': {'cluster_ref_id': result.inserted_id}}
                )

            saved_clusters.append(cluster_doc)
            logger.info(f"Saved cluster: {label} ({len(cluster['articles'])} articles)")
        except Exception as e:
            logger.error(f"Error saving cluster document: {e}")

    logger.info(f"Clustering complete: {len(saved_clusters)} clusters created")
    return saved_clusters
