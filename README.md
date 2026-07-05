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

[Fill this in after implementation]

Method: Keyword-overlap grouping
Threshold: 3 shared meaningful words
Stopwords: NLTK standard stopword list

### Limitations

[To be filled]

### News Sources Used

BBC News
NPR
The Guardian

### Live URLs

Frontend: [URL]
Backend API: [URL]
Python Service: [URL]
