import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'news_pulse')
    
    # RSS Sources
    rss_sources_str = os.getenv('RSS_SOURCES', '')
    RSS_SOURCES = [s.strip() for s in rss_sources_str.split(',') if s.strip()]
    if not RSS_SOURCES:
        RSS_SOURCES = [
            'http://feeds.bbci.co.uk/news/rss.xml',
            'https://feeds.npr.org/1001/rss.xml',
            'https://www.theguardian.com/world/rss'
        ]
    
    # Clustering parameters
    CLUSTER_THRESHOLD = int(os.getenv('CLUSTER_THRESHOLD', 3))
    MIN_WORD_LENGTH = int(os.getenv('MIN_WORD_LENGTH', 3))
    
    # Service settings
    PYTHON_PORT = int(os.getenv('PYTHON_PORT', 8000))