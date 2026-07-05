const express = require("express");
const { getDB } = require("../db");

const router = express.Router();

// GET /api/timeline
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    // Get all clusters
    const clusters = await db
      .collection("clusters")
      .find({})
      .sort({ start_time: 1 })
      .toArray();

    console.log(`Timeline: Found ${clusters.length} clusters`);

    // Check if we have any articles
    const articleCount = await db.collection("articles").countDocuments();
    console.log(`Timeline: Total articles in DB: ${articleCount}`);

    // Format for timeline visualization
    const timelineData = clusters.map((c) => ({
      id: c._id,
      clusterId: c.cluster_id,
      label: c.label || "Untitled Cluster",
      startTime: c.start_time || new Date(),
      endTime: c.end_time || new Date(),
      articleCount: c.article_count || c.article_ids?.length || 0,
      intensity: c.article_count || c.article_ids?.length || 0,
      source: c.sources?.[0] || "mixed",
      sources: c.sources || [],
    }));

    // Calculate time range
    let timeRange = { min: null, max: null };
    if (timelineData.length > 0) {
      const times = timelineData.flatMap((t) => [
        new Date(t.startTime).getTime(),
        new Date(t.endTime).getTime(),
      ]);
      timeRange.min = Math.min(...times);
      timeRange.max = Math.max(...times);
    }

    res.json({
      clusters: timelineData,
      timeRange: timeRange,
      metadata: {
        totalClusters: timelineData.length,
        totalArticles: articleCount,
        hasData: timelineData.length > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({
      error: error.message,
      details: "Check if clusters collection exists and has data",
    });
  }
});

module.exports = router;
