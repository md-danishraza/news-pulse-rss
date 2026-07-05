import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Cluster, Source, TimelineData } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function useData() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState({ totalArticles: 0, totalClusters: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [timelineRes, sourcesRes] = await Promise.all([
        fetch(`${API_URL}/timeline`),
        fetch(`${API_URL}/sources`),
      ]);

      if (!timelineRes.ok || !sourcesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const timelineData: TimelineData = await timelineRes.json();
      const sourcesData: Source[] = await sourcesRes.json();

      setClusters(timelineData.clusters || []);
      setSources(sourcesData || []);
      setStats({
        totalArticles: timelineData.metadata?.totalArticles || 0,
        totalClusters: timelineData.metadata?.totalClusters || 0,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Trigger scrape
      const triggerRes = await fetch(`${API_URL}/ingest/trigger`, {
        method: "POST",
      });
      if (!triggerRes.ok) throw new Error("Failed to trigger scrape");

      const { job_id } = await triggerRes.json();
      toast.loading("Scraping started...", { id: "scrape" });

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch(`${API_URL}/ingest/status/${job_id}`);
          const status = await statusRes.json();

          if (status.status === "completed") {
            clearInterval(pollInterval);
            toast.success(
              `✅ Scraped ${status.counts?.articles_scraped || 0} articles, ${
                status.counts?.clusters_created || 0
              } clusters`,
              { id: "scrape" }
            );
            await fetchData();
            setRefreshing(false);
          } else if (status.status === "failed") {
            clearInterval(pollInterval);
            toast.error(
              `❌ Scraping failed: ${status.error || "Unknown error"}`,
              { id: "scrape" }
            );
            setRefreshing(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            toast.error("⏱️ Scraping timed out", { id: "scrape" });
            setRefreshing(false);
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 2000);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
      setRefreshing(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // auto referesh / polling every 30sec
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && !loading) {
        fetchData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchData, refreshing, loading]);

  return {
    clusters,
    sources,
    loading,
    refreshing,
    lastUpdated,
    stats,
    fetchData,
    refreshData,
  };
}
