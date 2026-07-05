# News Pulse - Topic Clustered News Timeline

## Architecture Overview

A full-stack application that aggregates news from multiple RSS feeds, groups related articles into topic clusters, and visualizes them on an interactive timeline.

**Tech Stack:**

- **Scraper/Clusterer**: Python + FastAPI + newspaper3k + MongoDB
- **Backend API**: Node.js + Express
- **Frontend**: Next.js + React + Tailwind CSS
- **Database**: MongoDB Atlas
- **Deployment**: Python/Node.js on Render, Frontend on Vercel

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB Atlas account (free tier)

### Environment Setup

1. Copy `.env.example` to `.env` in each service directory
2. Fill in the required environment variables

### Running Locally

1. **Python Service** (Port 8000)

```bash
cd python-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

2. **Backend API** (Port 5000)

```bash
cd backend
npm install
npm run dev
```

3. **Frontend\*** (Port 3000)

```bash
cd frontend
npm install
npm run dev
```

### Topic Grouping Approach

## Topic Grouping Approach

**Method**: Keyword/word-overlap grouping (Option A)

**How it works**:

1. Extract meaningful keywords from article title and summary
2. Remove stopwords and short words (< 3 characters)
3. Count shared keywords between articles
4. Group articles with 3+ shared keywords into clusters
5. Generate cluster labels from most common keywords

**Threshold**: 3 shared keywords
**Stopwords**: NLTK standard stopword list (with fallback)

**Limitations**:

- Doesn't handle synonyms or related words (e.g., "car" and "automobile")
- May miss connections if articles use different terms for same topic
- Works best for breaking news where language is consistent

### Live URLs

Frontend: [URL]
Backend API: [URL]
Python Service: [URL]

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│                    http://localhost:3000                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Interactive Timeline Visualization                   │   │
│  │  • Cluster Detail Modal                                │   │
│  │  • Source Filtering                                    │   │
│  │  • Real-time Updates                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (Node.js)                      │
│                    http://localhost:5000                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • REST API Endpoints                                   │   │
│  │  • Database Connection                                  │   │
│  │  • Service Orchestration                                │   │
│  └─────────────────────────────────────────────────────────┘   │
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Python Microservice (FastAPI)                │
│                    http://localhost:8000                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • RSS Feed Scraper                                     │   │
│  │  • Full Article Extraction (newspaper3k)                │   │
│  │  • Keyword Extraction & Clustering                      │   │
│  │  • Job Status Management                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                            │
│                      (Cloud Database)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • articles Collection                                   │   │
│  │  • clusters Collection                                   │   │
│  │  • jobs Collection                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component         | Technology                                   | Purpose                                           |
| ----------------- | -------------------------------------------- | ------------------------------------------------- |
| Frontend          | Next.js 14 + React + Tailwind CSS            | Interactive timeline UI with animations           |
| Backend API       | Node.js + Express                            | REST API serving clusters and articles            |
| Scraper/Clusterer | Python + FastAPI                             | RSS ingestion, article extraction, and clustering |
| Database          | MongoDB Atlas                                | Document storage for articles, clusters, and jobs |
| Deployment        | Vercel (Frontend), Render (Backend & Python) | Live hosting                                      |
| Animations        | Framer Motion                                | Smooth UI transitions                             |
| Styling           | Tailwind CSS + Glass-morphism                | Modern, professional design                       |

### Backend API (Node.js)

#### Features

- **RESTful Endpoints**: Clean API design with proper HTTP methods and status codes
- **Database Integration**: MongoDB connection with connection pooling and error handling
- **Service Orchestration**: Proxy calls to Python microservice for scraping
- **Environment Configuration**: All sensitive data managed via environment variables
- **Error Handling**: Comprehensive try/catch with appropriate 400/404/500 responses
- **CORS Support**: Configured for cross-origin requests from frontend
- **Health Checks**: `/health` endpoint for monitoring service status

#### API Endpoints

| Endpoint                    | Method | Description                                                              |
| --------------------------- | ------ | ------------------------------------------------------------------------ |
| `/api/clusters`             | GET    | List all topic clusters with metadata (label, article count, time range) |
| `/api/clusters/:id`         | GET    | Full cluster details with all articles sorted chronologically            |
| `/api/timeline`             | GET    | Timeline-formatted clusters with start/end times and intensity metric    |
| `/api/sources`              | GET    | List of distinct news sources for filtering                              |
| `/api/ingest/trigger`       | POST   | Trigger the Python scraping pipeline, returns job ID                     |
| `/api/ingest/status/:jobId` | GET    | Poll job status (pending, running, completed, failed)                    |
| `/health`                   | GET    | Service health check with database verification                          |

#### Project Structure

```
backend/
├── src/
│   ├── app.js              # Express server setup
│   ├── db.js               # MongoDB connection pool
│   ├── routes/
│   │   ├── clusters.js     # Cluster endpoints
│   │   ├── timeline.js     # Timeline endpoint
│   │   ├── ingest.js       # Scraping trigger & status
│   │   ├── sources.js      # Source list endpoint
│
│
│
├── package.json
└── .env
```

### Python Microservice (FastAPI)

#### Features

- **RSS Feed Ingestion**: Fetches from multiple RSS sources with error handling
- **Full Article Extraction**: Uses newspaper3k to extract complete article text
- **Deduplication**: URL normalization and hash-based duplicate prevention
- **Keyword Extraction**: Removes stopwords and extracts meaningful keywords
- **Topic Clustering**: Groups articles by keyword overlap (threshold: 3 shared words)
- **Cluster Labeling**: Auto-generates labels from top keywords
- **Job Management**: Background task processing with status tracking
- **Rerunnable**: Only processes new articles on each run

#### Topic Grouping Approach (Option A)

**Method**: Keyword/word-overlap grouping

**How it works:**

1. Extract meaningful keywords from article title and summary
2. Remove stopwords (NLTK standard list) and short words (< 3 characters)
3. Count shared keywords between articles
4. Group articles with 3+ shared keywords into clusters
5. Generate cluster labels from most common keywords

**Configuration:**

```bash
CLUSTER_THRESHOLD=3    # Minimum shared keywords to form a cluster
MIN_WORD_LENGTH=3      # Minimum length for a word to be considered a keyword
```

#### Why Keyword Overlap

- Deterministic and fast
- Easy to debug and explain
- No external ML dependencies
- Matches the assignment's preference for simple, reliable solutions

#### API Endpoints

| Endpoint           | Method | Description                                        |
| ------------------ | ------ | -------------------------------------------------- |
| `/scrape`          | POST   | Trigger scraping and clustering as background task |
| `/status/{job_id}` | GET    | Get job status with counts                         |
| `/health`          | GET    | Service health check                               |

#### Project Structure

```
python-service/
├── app/
│   ├── main.py            # FastAPI application
│   ├── config.py          # Configuration management
│   ├── db.py              # MongoDB connection
│   ├── scraper.py         # RSS ingestion & article extraction
│   ├── clusterer.py       # Keyword-overlap clustering
│   └── utils.py           # Utility functions (URL normalization, etc.)
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
└── test_pipeline.sh       # Test script for pipeline
```

#### News Sources Used

- **BBC News**: [http://feeds.bbci.co.uk/news/rss.xml](http://feeds.bbci.co.uk/news/rss.xml)
- **NPR**: [https://feeds.npr.org/1001/rss.xml](https://feeds.npr.org/1001/rss.xml)
- **The Guardian**: [https://www.theguardian.com/world/rss](https://www.theguardian.com/world/rss)

### Frontend (Next.js)

#### Features

- **Interactive Timeline**: Gantt-style visualization showing clusters as horizontal bars spanning their active time window
- **Cluster Details**: Click any cluster to view all articles with source, time, and direct links
- **Source Filtering**: Toggle news sources to focus on specific outlets
- **Real-time Updates**: Refresh button triggers scraping with live status polling
- **Visual Indicators**: Cluster size reflects article count, color-coded by source
- **Modern UI**: Glass-morphism design with smooth animations
- **Data Ingestion Page**: Dedicated interface for triggering and monitoring scraping jobs
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Loading States**: Animated skeletons and progress indicators
- **Toast Notifications**: Real-time feedback for user actions

#### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom glass-morphism
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns
- **TypeScript**: Full type safety

#### Pages

| Page               | Path      | Description                                                    |
| ------------------ | --------- | -------------------------------------------------------------- |
| Timeline Dashboard | `/`       | Main page with interactive timeline, stats, and source filters |
| Data Ingestion     | `/ingest` | Dedicated page for triggering scrapes and monitoring jobs      |

#### Components

- **Timeline**: Gantt-style chart with cluster bars, time axis, and tooltips
- **ClusterDetail**: Modal showing articles in a cluster with metadata
- **SourceFilter**: Toggle buttons for source filtering
- **Stats**: Dashboard statistics (articles, clusters, last updated)
- **IngestForm**: Source selection and job trigger
- **JobStatus**: Real-time job progress and results

#### Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with fonts and providers
│   ├── page.tsx            # Main timeline page
│   ├── ingest/
│   │   └── page.tsx        # Data ingestion page
│   └── globals.css         # Global styles
├── components/
│   ├── Timeline/           # Timeline visualization
│   ├── ClusterDetail/      # Article list modal
│   ├── SourceFilter/       # Filter controls
│   ├── Stats/              # Dashboard stats
│   └── Ingest/             # Ingestion UI
├── hooks/
│   └── useData.ts          # Data fetching & polling
├── utils/
│   ├── colors.ts           # Color palette
│   └── timelineHelpers.ts  # Timeline utilities
├── types/                  # TypeScript type definitions
└── package.json
```

### Database Schema

#### Articles Collection

```javascript
{
  _id: ObjectId,
  title: String,
  summary: String,
  full_text: String,
  url: String,
  normalized_url: String,     // Deduplication key
  article_hash: String,       // MD5 for additional dedup
  source: String,
  published_at: Date,
  author: String,
  categories: [String],
  keywords: [String],         // Extracted keywords
  cluster_id: String,         // Assigned during clustering
  cluster_ref_id: ObjectId,   // Reference to clusters collection
  scraped_at: Date
}
```

#### Clusters Collection

```javascript
{
  _id: ObjectId,
  cluster_id: String,         // UUID
  label: String,              // Auto-generated from keywords
  article_ids: [String],      // IDs of articles in cluster
  article_count: Number,
  start_time: Date,           // Earliest article
  end_time: Date,             // Latest article
  keywords: [String],         // Top keywords
  sources: [String],          // News sources in cluster
  created_at: Date
}
```

#### Jobs Collection

```javascript
{
  _id: ObjectId,
  job_id: String,             // UUID
  status: String,             // pending, running, completed, failed
  started_at: Date,
  completed_at: Date,
  error: String,
  counts: {
    articles_scraped: Number,
    clusters_created: Number
  }
}
```

## Testing

### Test the Full Pipeline

Run the test script in the Python service directory:

```bash
cd python-service
./test_pipeline.sh
```

This will:
Trigger a scraping job
Poll for completion
Verify data is available via the backend API

#### Manual Testing

```bash
# Trigger scraping
curl -X POST http://localhost:8000/scrape

# Check job status
curl http://localhost:8000/status/{job_id}

# View timeline data
curl http://localhost:5000/api/timeline

# View clusters
curl http://localhost:5000/api/clusters
```

### Limitations & Future Improvements

#### Current Limitations

- **Keyword Overlap Only**: Doesn't handle synonyms or semantic relationships
- **Single Language**: Only English news sources
- **No Auto-Refresh**: Requires manual refresh for new data
- **Source Extraction**: Some websites may block scraping or have paywalls

#### Future Improvements

- **Cross-source Story Merging**: Recognize same story across different outlets
- **Sentiment Analysis**: Add sentiment scoring to clusters
- **Advanced NLP**: Implement TF-IDF or word embeddings for better clustering
- **Auto-Refresh**: Frontend auto-polls for new data every 30 seconds
- **More Sources**: Add Reuters, Al Jazeera, and other international sources
- **Search & Filter**: Full-text search and date range filters
- **Export**: PDF/CSV export of cluster data
- **Email Digests**: Daily/weekly email summaries of top clusters

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Newspaper3k Documentation](https://newspaper.readthedocs.io/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

---

## License

This project was created as part of a technical assessment for **[XPONENTIUM INDIA]**.

---

## 🙏 Acknowledgments

- **BBC News, NPR, and The Guardian** for providing RSS feeds
- Open-source libraries that made this project possible
- The assessment team for the opportunity
- Built with ❤️ using **Python, Node.js, and Next.js**
