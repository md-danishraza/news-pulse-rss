const express = require("express");
const { getDB } = require("../db");

const router = express.Router();

// GET /api/sources
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const sources = await db.collection("articles").distinct("source");

    res.json(sources.map((s) => ({ name: s, active: true })));
  } catch (error) {
    console.error("Error fetching sources:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
