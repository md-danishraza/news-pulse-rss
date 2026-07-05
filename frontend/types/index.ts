export interface Article {
  id?: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  fullText?: string;
}

export interface Cluster {
  id: string;
  clusterId?: string;
  label: string;
  articleCount: number;
  startTime: string;
  endTime: string;
  source?: string;
  sources?: string[];
  intensity?: number;
}

export interface ClusterDetail extends Cluster {
  articles: Article[];
}

export interface Source {
  name: string;
  active: boolean;
  color?: string;
}

export interface TimelineData {
  clusters: Cluster[];
  timeRange: {
    min: number | null;
    max: number | null;
  };
  metadata?: {
    totalClusters: number;
    totalArticles: number;
    hasData: boolean;
  };
}

export interface JobStatus {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  error?: string;
  counts?: {
    articles_scraped: number;
    clusters_created: number;
  };
}
