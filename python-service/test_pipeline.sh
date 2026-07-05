#!/bin/bash

# Configuration
PYTHON_URL="http://localhost:8000"
BACKEND_URL="http://localhost:5000"

# Text Formatting Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting News Pulse Pipeline Test ===${NC}\n"

# 1. Trigger the Scraping Job
echo -e "${YELLOW}[1/3] Triggering scrape endpoint...${NC}"
RESPONSE=$(curl -s -X POST "$PYTHON_URL/scrape" -H "Content-Type: application/json")

if [ -z "$RESPONSE" ]; then
    echo -e "${RED}Error: No response from Python service at $PYTHON_URL. Is it running?${NC}"
    exit 1
fi

echo -e "Raw Response: $RESPONSE"

# Extract job_id (handles both clean JSON fields and simple string forms)
JOB_ID=$(echo "$RESPONSE" | grep -o '"job_id":[ ]*"[^"]*' | grep -o '[^"]*$')

if [ -z "$JOB_ID" ]; then
    # Fallback if the response is just a raw UUID or structured differently
    JOB_ID=$(echo "$RESPONSE" | grep -oE '[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}')
fi

if [ -z "$JOB_ID" ]; then
    echo -e "${RED}Could not extract job_id from response. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully triggered! Job ID: $JOB_ID${NC}\n"

# 2. Poll Job Status Until Completed
echo -e "${YELLOW}[2/3] Polling job status for ID: $JOB_ID...${NC}"
while true; do
    STATUS_RESP=$(curl -s -X GET "$PYTHON_URL/status/$JOB_ID")
    
    # Extract status field string value
    STATUS=$(echo "$STATUS_RESP" | grep -o '"status":[ ]*"[^"]*' | grep -o '[^"]*$')
    
    echo -e "Current Status: ${BLUE}$STATUS${NC}"
    
    if [ "$STATUS" == "completed" ]; then
        echo -e "${GREEN}Pipeline processing finished successfully!${NC}\n"
        break
    elif [ "$STATUS" == "failed" ]; then
        echo -e "${RED}Pipeline job reported a failure status.${NC}"
        exit 1
    fi
    
    sleep 2
done

# 3. Verify Timeline Data on Backend
echo -e "${YELLOW}[3/3] Fetching aggregated cluster timeline from Node backend...${NC}"
TIMELINE_RESP=$(curl -s -X GET "$BACKEND_URL/api/timeline")

if [ -z "$TIMELINE_RESP" ]; then
    echo -e "${RED}Error: No response from Express backend at $BACKEND_URL/api/timeline.${NC}"
    exit 1
else
    echo -e "${GREEN}Backend response received!${NC}"
    echo -e "------------------------------------"
    echo "$TIMELINE_RESP" | head -n 20
    echo -e "...\n------------------------------------"
fi

echo -e "${GREEN}=== Testing Complete ===${NC}"
echo -e "Open ${BLUE}http://localhost:3000${NC} in your browser to inspect the UI visualizations."