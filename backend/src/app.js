const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db");
const clustersRoutes = require("./routes/clusters");
const timelineRoutes = require("./routes/timeline");
const ingestRoutes = require("./routes/ingest");
const sourcesRoutes = require("./routes/sources");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/clusters", clustersRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/sources", sourcesRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    const db = require("./db").getDB();
    await db.command({ ping: 1 });
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: process.env.DATABASE_NAME || "news_pulse",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(
        `📊 Using database: ${process.env.DATABASE_NAME || "news_pulse"}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
