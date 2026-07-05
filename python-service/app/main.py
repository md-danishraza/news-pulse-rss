from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from .db import db
from .config import Config
from .scraper import scrape_all_sources
from .clusterer import cluster_articles

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="News Pulse Scraper Service",
    description="Scrapes RSS feeds and clusters news articles",
    version="1.0.0"
)

# CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_pipeline(job_id: str):
    """Background task to run the full pipeline."""
    try:
        # Update status to running
        db.jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "running", "started_at": datetime.utcnow()}}
        )
        
        logger.info(f"Starting pipeline for job {job_id}")
        
        # Scrape articles
        articles = scrape_all_sources()
        logger.info(f"Scraped {len(articles)} articles")
        
        # Cluster articles
        clusters = cluster_articles(articles)
        logger.info(f"Created {len(clusters)} clusters")
        
        # Update job with completion status
        db.jobs.update_one(
            {"job_id": job_id},
            {"$set": {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "counts": {
                    "articles_scraped": len(articles),
                    "clusters_created": len(clusters)
                }
            }}
        )
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        db.jobs.update_one(
            {"job_id": job_id},
            {"$set": {
                "status": "failed",
                "completed_at": datetime.utcnow(),
                "error": str(e)
            }}
        )

@app.get("/")
async def root():
    return {
        "service": "News Pulse Scraper",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/scrape")
async def trigger_scrape(background_tasks: BackgroundTasks):
    """Trigger a new scraping and clustering job."""
    job_id = str(uuid.uuid4())
    
    # Create job record
    db.jobs.insert_one({
        "job_id": job_id,
        "status": "pending",
        "started_at": datetime.utcnow(),
        "completed_at": None,
        "error": None,
        "counts": None
    })
    
    # Run pipeline in background
    background_tasks.add_task(run_pipeline, job_id)
    
    return {
        "job_id": job_id,
        "status": "pending",
        "message": "Scraping job started"
    }

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get status of a job."""
    job = db.jobs.find_one({"job_id": job_id})
    if not job:
        return {"error": "Job not found", "status": 404}, 404
    
    # Convert ObjectId to string for JSON response
    job['_id'] = str(job['_id'])
    return job

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=Config.PYTHON_PORT,
        reload=True
    )