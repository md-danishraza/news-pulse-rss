from urllib.parse import urlparse, urlunparse, parse_qs
import re
import hashlib
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def normalize_url(url):
    """
    Normalize URL by removing tracking parameters and standardizing format.
    Example: site.com/news/1?utm_source=rss -> site.com/news/1
    """
    if not url:
        return ""
    
    try:
        parsed = urlparse(url)
        # Remove query parameters and fragments
        cleaned = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            '',  # params
            '',  # query
            ''   # fragment
        ))
        # Remove trailing slash
        if cleaned.endswith('/'):
            cleaned = cleaned[:-1]
        return cleaned.lower()
    except Exception as e:
        logger.warning(f"Failed to normalize URL {url}: {e}")
        return url

def extract_keywords(text, stopwords, min_word_length=3):
    """
    Extract meaningful keywords from text.
    Returns a LIST (not set) for MongoDB compatibility.
    """
    if not text:
        return []
    
    # Convert to lowercase and remove punctuation
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Split into words
    words = text.split()
    
    # Filter: length check, stopwords, and alphanumeric only
    keywords = set()
    for word in words:
        if len(word) >= min_word_length and word not in stopwords:
            # Keep only alphabetic characters
            clean_word = re.sub(r'[^a-z]', '', word)
            if clean_word and len(clean_word) >= min_word_length:
                keywords.add(clean_word)
    
    # Return as list for MongoDB compatibility
    return list(keywords)

def generate_article_hash(normalized_url, title):
    """Generate unique hash for deduplication."""
    if not normalized_url or not title:
        return hashlib.md5(f"{normalized_url}|{title}".encode('utf-8')).hexdigest()
    content = f"{normalized_url}|{title}".encode('utf-8')
    return hashlib.md5(content).hexdigest()

def parse_date(date_str):
    """Parse RSS date formats robustly."""
    if not date_str:
        return datetime.utcnow()
    
    # Try common formats using dateparser if available
    try:
        import dateparser
        parsed = dateparser.parse(str(date_str))
        if parsed:
            return parsed
    except ImportError:
        pass
    
    # Fallback: try to parse with dateutil
    try:
        from dateutil import parser
        return parser.parse(str(date_str))
    except:
        # If all else fails, use current time
        logger.warning(f"Could not parse date: {date_str}")
        return datetime.utcnow()

def get_stopwords():
    """Get stopword list - can use NLTK or a predefined list."""
    try:
        import nltk
        from nltk.corpus import stopwords
        # Try to download if not already available
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('stopwords', quiet=True)
        return set(stopwords.words('english'))
    except:
        # Fallback common stopwords
        return {
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
            'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
            'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
            'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
            'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
            'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
            'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
            'give', 'day', 'most', 'us'
        }