const express = require("express");
const axios = require("axios");
const router = express.Router();

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// POST /api/ingest/trigger
router.post("/trigger", async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/scrape`);
    res.json(response.data);
  } catch (error) {
    console.error("Error triggering scrape:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: "Python service unavailable",
        details: error.message,
      });
    }
  }
});

// GET /api/ingest/status/:jobId
router.get("/status/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const response = await axios.get(`${PYTHON_SERVICE_URL}/status/${jobId}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching job status:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: "Python service unavailable",
        details: error.message,
      });
    }
  }
});

module.exports = router;
