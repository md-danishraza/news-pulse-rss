import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "news_pulse")

def reset_database():
    """
    Clears out old dirty articles, clusters, and job records 
    to prepare for a fresh, clean run of the pipeline.
    """
    print(f"Connecting to MongoDB at: {MONGODB_URI}")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    # List collections to clear
    collections = ["articles", "clusters", "jobs"]
    
    print("\n--- WARNING ---")
    print(f"This will delete all data in the following collections: {collections}")
    confirm = input("Are you sure you want to proceed? (y/N): ").strip().lower()
    
    if confirm != 'y':
        print("Reset aborted.")
        sys.exit(0)
        
    for col in collections:
        count = db[col].count_documents({})
        db[col].delete_many({})
        print(f"Cleared {count} documents from '{col}' collection.")
        
    print("\nDatabase reset complete! Your next scrape run will be completely clean.")

if __name__ == "__main__":
    reset_database()