import { useState, useEffect, useCallback, useRef } from "react";
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

  // Refs to cleanly cancel asynchronous operations on unmount or re-runs
  const activeFetchController = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel any previous pending requests to avoid race conditions
    if (activeFetchController.current) {
      activeFetchController.current.abort();
    }

    const controller = new AbortController();
    activeFetchController.current = controller;

    try {
      setLoading(true);
      const [timelineRes, sourcesRes] = await Promise.all([
        fetch(`${API_URL}/timeline`, { signal: controller.signal }),
        fetch(`${API_URL}/sources`, { signal: controller.signal }),
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
    } catch (error: any) {
      // Gracefully ignore manual abort actions
      if (error.name === "AbortError") return;
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      // Ensure we only update loading state if this controller is still current
      if (activeFetchController.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  const refreshData = useCallback(async () => {
    // Prevent starting parallel pipelines if one is already running
    if (refreshing) {
      toast.error("An update sequence is already in progress");
      return;
    }

    // Clean up any stale intervals before starting a new run
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    setRefreshing(true);
    try {
      // Trigger scrape pipeline
      const triggerRes = await fetch(`${API_URL}/ingest/trigger`, {
        method: "POST",
      });
      if (!triggerRes.ok) throw new Error("Failed to trigger scrape");

      const data = await triggerRes.json();
      // Handle both camelCase and snake_case API specifications seamlessly
      const jobId = data.jobId || data.job_id;

      if (!jobId) {
        throw new Error("No jobId received from ingestion service");
      }

      toast.loading("Initiating ingestion engine...", { id: "scrape" });

      let attempts = 0;
      const maxAttempts = 60; // 2 minutes maximum cutoff

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch(`${API_URL}/ingest/status/${jobId}`);
          if (!statusRes.ok) throw new Error("Failed to verify status");

          const status = await statusRes.json();

          if (status.status === "completed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            toast.success(
              `✨ Complete: Loaded ${
                status.counts?.articles_scraped || 0
              } articles, formed ${
                status.counts?.clusters_created || 0
              } clusters`,
              { id: "scrape" }
            );

            await fetchData();
            setRefreshing(false);
          } else if (status.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            toast.error(
              `⚡ Scraping failed: ${
                status.error || "Execution terminated unexpectedly"
              }`,
              { id: "scrape" }
            );
            setRefreshing(false);
          } else if (attempts >= maxAttempts) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            toast.error("⏱️ Service polling timed out", { id: "scrape" });
            setRefreshing(false);
          }
        } catch (error) {
          console.error("Pipeline polling status error:", error);
          // Keep loop running on minor network hiccups, but safe-guard exit
          if (attempts >= maxAttempts) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setRefreshing(false);
          }
        }
      }, 2000);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data", { id: "scrape" });
      setRefreshing(false);
    }
  }, [fetchData, refreshing]);

  // Initial component mount call
  useEffect(() => {
    fetchData();

    // Clean up active fetches and active polling streams when unmounting
    return () => {
      if (activeFetchController.current) {
        activeFetchController.current.abort();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchData]);

  // Periodic automatic sync: refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && !loading) {
        fetchData();
      }
    }, 30000);

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
