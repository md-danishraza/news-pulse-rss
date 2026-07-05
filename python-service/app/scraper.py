import logging
import feedparser
import time
from typing import List, Dict, Any
from datetime import datetime

from .config import Config
from .db import db
from .utils import (
    normalize_url,
    generate_article_hash,
    parse_date,
    get_stopwords,
    extract_keywords,
    strip_html
)

logger = logging.getLogger(__name__)


def fetch_rss_feed(url: str) -> List[Dict[str, Any]]:
    """
    Fetch and parse an RSS feed.
    Returns list of article entries from the feed.
    """
    try:
        logger.info(f"Fetching RSS feed: {url}")
        feed = feedparser.parse(url)

        if feed.bozo:  # Check for parsing errors
            logger.warning(f"Feed parsing error for {url}: {feed.bozo_exception}")

        articles = []
        for entry in feed.entries[:20]:  # Limit to 20 per feed to avoid overload
            # Normalize field names
            article = {
                'title': entry.get('title', ''),
                'summary': entry.get('summary', entry.get('description', '')),
                'url': entry.get('link', ''),
                'source': feed.feed.get('title', 'Unknown').split(' - ')[0],  # Strip trailing titles
                'published_at': parse_date(entry.get('published', entry.get('pubDate'))),
                'author': entry.get('author', ''),
                'categories': [tag.term for tag in entry.get('tags', [])] if 'tags' in entry else []
            }

            # Try to get content:encoded if available (full content)
            if 'content' in entry and entry.content:
                article['full_content'] = entry.content[0].value
            elif 'summary' in entry:
                article['full_content'] = entry.summary
            else:
                article['full_content'] = article['summary']

            articles.append(article)

        logger.info(f"Found {len(articles)} articles from {url}")
        return articles

    except Exception as e:
        logger.error(f"Error fetching RSS feed {url}: {e}")
        return []


def extract_full_article(url: str, fallback_text: str = '') -> str:
    """
    Extract full article text using newspaper3k.
    Returns full text or fallback if extraction fails.
    """
    if not url:
        return fallback_text

    try:
        from newspaper import Article
        article = Article(url)
        article.download()
        article.parse()

        # If newspaper3k extracted text, use it
        if article.text and len(article.text) > 100:
            return article.text
        else:
            return fallback_text

    except Exception as e:
        logger.warning(f"Failed to extract full article from {url}: {e}")
        return fallback_text


def scrape_all_sources() -> List[Dict[str, Any]]:
    """
    Scrape all configured RSS sources and return list of article dicts.
    """
    all_articles = []
    stopwords = get_stopwords()

    for feed_url in Config.RSS_SOURCES:
        try:
            # Fetch articles from RSS
            feed_articles = fetch_rss_feed(feed_url)

            for article_data in feed_articles:
                # Normalize URL for deduplication
                normalized_url = normalize_url(article_data['url'])

                # Check if article already exists
                existing = db.articles.find_one({'normalized_url': normalized_url})
                if existing:
                    logger.debug(f"Skipping duplicate: {article_data['title']}")
                    continue

                # Generate article hash for additional deduplication
                article_hash = generate_article_hash(normalized_url, article_data['title'])

                # Extract full text
                full_text = extract_full_article(article_data['url'], article_data.get('full_content', ''))

                # Sanitize components and extract keywords
                clean_title = strip_html(article_data['title'])
                clean_summary = strip_html(article_data.get('summary', ''))
                combined_text = f"{clean_title} {clean_summary}"
                keywords = extract_keywords(combined_text, stopwords)

                # Prepare article for storage
                article = {
                    'title': clean_title,
                    'summary': clean_summary,
                    'full_text': strip_html(full_text),
                    'url': article_data['url'],
                    'normalized_url': normalized_url,
                    'article_hash': article_hash,
                    'source': article_data.get('source', 'Unknown'),
                    'published_at': article_data['published_at'],
                    'author': article_data.get('author', ''),
                    'categories': article_data.get('categories', []),
                    'keywords': keywords,  # Clean keyword list
                    'scraped_at': datetime.utcnow(),
                    'cluster_id': None  # Will be assigned during clustering
                }

                # Store in database
                result = db.articles.insert_one(article)
                article['_id'] = result.inserted_id

                all_articles.append(article)
                logger.info(f"Stored article: {article['title'][:50]}...")

                # Be polite to servers
                time.sleep(0.5)

        except Exception as e:
            logger.error(f"Error processing feed {feed_url}: {e}")
            continue

    logger.info(f"Total new articles scraped: {len(all_articles)}")
    return all_articles
