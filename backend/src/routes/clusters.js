const express = require("express");
const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

const router = express.Router();

// GET /api/clusters
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    // Check if clusters collection exists and has data
    const clusters = await db
      .collection("clusters")
      .find({})
      .sort({ start_time: -1 })
      .toArray();

    console.log(`Found ${clusters.length} clusters`);

    // Format response
    const formatted = clusters.map((c) => ({
      id: c._id,
      clusterId: c.cluster_id,
      label: c.label || "Untitled Cluster",
      articleCount: c.article_count || c.article_ids?.length || 0,
      startTime: c.start_time || new Date(),
      endTime: c.end_time || new Date(),
      source: c.sources?.[0] || "mixed",
      sources: c.sources || [],
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching clusters:", error);
    res.status(500).json({
      error: error.message,
      details: "Check if clusters collection exists and has data",
    });
  }
});

// GET /api/clusters/:id
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    // Try to find by ObjectId first
    let cluster;
    if (ObjectId.isValid(id)) {
      cluster = await db
        .collection("clusters")
        .findOne({ _id: new ObjectId(id) });
    }

    // If not found, try by cluster_id
    if (!cluster) {
      cluster = await db.collection("clusters").findOne({ cluster_id: id });
    }

    if (!cluster) {
      return res.status(404).json({ error: "Cluster not found" });
    }

    // Get articles for this cluster
    let articles = [];
    if (cluster.article_ids && cluster.article_ids.length > 0) {
      // Convert string IDs to ObjectIds if needed
      const objectIds = cluster.article_ids
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      if (objectIds.length > 0) {
        articles = await db
          .collection("articles")
          .find({ _id: { $in: objectIds } })
          .sort({ published_at: 1 })
          .toArray();
      }
    }

    // If no articles found by IDs, try finding by cluster_id field
    if (articles.length === 0) {
      articles = await db
        .collection("articles")
        .find({
          $or: [
            { cluster_id: cluster.cluster_id },
            { cluster_ref_id: cluster._id },
          ],
        })
        .sort({ published_at: 1 })
        .toArray();
    }

    res.json({
      id: cluster._id,
      clusterId: cluster.cluster_id,
      label: cluster.label || "Untitled Cluster",
      articles: articles.map((a) => ({
        id: a._id,
        title: a.title || "Untitled",
        summary: a.summary || "",
        source: a.source || "Unknown",
        publishedAt: a.published_at || new Date(),
        url: a.url || "#",
        fullText: a.full_text || "",
      })),
      startTime: cluster.start_time || new Date(),
      endTime: cluster.end_time || new Date(),
      articleCount: articles.length,
      sources: cluster.sources || [],
    });
  } catch (error) {
    console.error("Error fetching cluster details:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
