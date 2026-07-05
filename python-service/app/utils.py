from urllib.parse import urlparse, urlunparse
import re
import hashlib
from datetime import datetime
import logging
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Lazy initialization flag for NLTK downloader
_nltk_initialized = False


def _init_nltk():
    """Silently ensure required NLTK datasets are downloaded and ready."""
    global _nltk_initialized
    if _nltk_initialized:
        return
    try:
        import nltk
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)
        try:
            nltk.data.find('taggers/averaged_perceptron_tagger')
        except LookupError:
            nltk.download('averaged_perceptron_tagger', quiet=True)
        _nltk_initialized = True
    except Exception as e:
        logger.warning(f"Fail-safe warning: NLTK lazy-load skipped or failed. {e}")


def normalize_url(url: str) -> str:
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


def strip_html(text: str) -> str:
    """
    Remove HTML tags, links, and formatting cleanly using BeautifulSoup.
    """
    if not text:
        return ""
    try:
        # Use built-in html.parser which is secure and fast
        soup = BeautifulSoup(text, "html.parser")
        return soup.get_text(separator=" ")
    except Exception:
        # Fallback regex if BS4 fails
        return re.sub(r'<[^>]*>', ' ', text)


def extract_keywords(text: str, stopwords: set, min_word_length: int = 3) -> list:
    """
    Extract meaningful keywords from text.
    Uses HTML cleaning, expanded stopwords, and fail-safe POS-tag filtering
    to keep only nouns and adjectives, completely filtering out messy verbs/adverbs.
    """
    if not text:
        return []

    # Clean HTML first
    text_clean = strip_html(text)

    # Convert to lowercase and strip non-alphabetic chars
    text_clean = text_clean.lower()
    text_clean = re.sub(r'[^a-z\s]', ' ', text_clean)

    words = text_clean.split()

    # Fail-safe Part-of-Speech Tagging
    keep_words = []
    _init_nltk()
    try:
        import nltk
        tagged = nltk.pos_tag(words)
        # Keep only Nouns (NN, NNS, NNP, NNPS) and Adjectives (JJ, JJR, JJS)
        for word, tag in tagged:
            if tag.startswith('NN') or tag.startswith('JJ'):
                keep_words.append(word)
    except Exception as e:
        logger.debug(f"POS tagging fallback triggered: {e}")
        keep_words = words

    # Filter by size and stopword lists
    keywords = set()
    for word in keep_words:
        if len(word) >= min_word_length and word not in stopwords:
            if word.isalpha():
                keywords.add(word)

    return list(keywords)


def generate_article_hash(normalized_url: str, title: str) -> str:
    """Generate unique hash for deduplication."""
    if not normalized_url or not title:
        return hashlib.md5(f"{normalized_url}|{title}".encode('utf-8')).hexdigest()
    content = f"{normalized_url}|{title}".encode('utf-8')
    return hashlib.md5(content).hexdigest()


def parse_date(date_str: str):
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
    except Exception:
        # If all else fails, use current time
        logger.warning(f"Could not parse date: {date_str}")
        return datetime.utcnow()


def get_stopwords() -> set:
    """Get expanded stopword list merging NLTK and common news/web boilerplate."""
    base_stopwords = set()
    try:
        _init_nltk()
        from nltk.corpus import stopwords as nltk_stopwords
        base_stopwords = set(nltk_stopwords.words('english'))
    except Exception:
        # Static fallback list if NLTK is entirely missing
        base_stopwords = {
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

    # Expanded news-specific boilerplate keywords to ignore
    news_boilerplate = {
        'com', 'org', 'net', 'http', 'https', 'www', 'html', 'href', 'url', 'link',
        'image', 'photo', 'video', 'audio', 'media', 'click', 'subscribe', 'read',
        'more', 'share', 'twitter', 'facebook', 'instagram', 'youtube', 'guardian',
        'bbc', 'npr', 'reuters', 'ap', 'afp', 'cnn', 'fox', 'nbc', 'cbs', 'news',
        'said', 'says', 'would', 'could', 'told', 'also', 'one', 'two', 'new', 'year',
        'years', 'day', 'days', 'week', 'month', 'today', 'yesterday', 'tomorrow',
        'first', 'last', 'next', 'many', 'much', 'some', 'any', 'every', 'all',
        'imminently', 'mean', 'attend', 'place', 'former', 'report', 'reported',
        'breaking', 'update', 'caption', 'target', 'blank', 'newsletter', 'advertisement',
        'copyright', 'reserved', 'rights', 'associated', 'press', 'feed', 'rss', 'post',
        'published', 'minutes', 'hours', 'ago', 'read-more', 'continue', 'story', 'ad'
    }

    return base_stopwords.union(news_boilerplate)
