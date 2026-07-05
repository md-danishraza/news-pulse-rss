const express = require("express");
const { getDB } = require("../db");
const router = express.Router();

// DELETE /api/admin/clear-all
router.delete("/clear-all", async (req, res) => {
  try {
    const db = getDB();

    // Get counts before deletion
    const articleCount = await db.collection("articles").countDocuments();
    const clusterCount = await db.collection("clusters").countDocuments();
    const jobCount = await db.collection("jobs").countDocuments();

    // Delete all data
    await db.collection("articles").deleteMany({});
    await db.collection("clusters").deleteMany({});
    await db.collection("jobs").deleteMany({});

    res.json({
      success: true,
      message: "All data cleared successfully",
      deleted: {
        articles: articleCount,
        clusters: clusterCount,
        jobs: jobCount,
      },
    });
  } catch (error) {
    console.error("Error clearing data:", error);
    res.status(500).json({
      error: "Failed to clear data",
      details: error.message,
    });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const db = getDB();

    const articleCount = await db.collection("articles").countDocuments();
    const clusterCount = await db.collection("clusters").countDocuments();
    const jobCount = await db.collection("jobs").countDocuments();

    res.json({
      articles: articleCount,
      clusters: clusterCount,
      jobs: jobCount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
