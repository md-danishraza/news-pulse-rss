from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging
from .config import Config

logger = logging.getLogger(__name__)

class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        try:
            self.client = MongoClient(Config.MONGODB_URI)
            self.client.admin.command('ping')
            self.db = self.client[Config.DATABASE_NAME]
            
            # Collections
            self.articles = self.db.articles
            self.clusters = self.db.clusters
            self.jobs = self.db.jobs
            
            # Create indexes
            self.articles.create_index('normalized_url', unique=True)
            self.articles.create_index('published_at')
            self.articles.create_index('cluster_id')
            self.clusters.create_index('job_id')
            self.jobs.create_index('job_id', unique=True)
            
            logger.info("Successfully connected to MongoDB")
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def get_db(self):
        return self.db

# Singleton instance
db = Database()