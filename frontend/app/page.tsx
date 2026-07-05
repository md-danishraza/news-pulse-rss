'use client';

import { useState, useEffect } from 'react';

// Types
interface Cluster {
  id: string;
  label: string;
  articleCount: number;
  startTime: string;
  endTime: string;
  source?: string;
}

interface Source {
  name: string;
  active: boolean;
}

interface Article {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  fullText?: string;
}

interface ClusterDetail {
  id: string;
  label: string;
  articles: Article[];
  startTime: string;
  endTime: string;
  articleCount: number;
}

interface TimelineResponse {
  clusters: Cluster[];
  timeRange: {
    min: number | null;
    max: number | null;
  };
}

export default function Home() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<ClusterDetail | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [clustersRes, sourcesRes] = await Promise.all([
        fetch(`${API_URL}/timeline`),
        fetch(`${API_URL}/sources`)
      ]);
      
      const clustersData: TimelineResponse = await clustersRes.json();
      const sourcesData: Source[] = await sourcesRes.json();
      
      setClusters(clustersData.clusters || []);
      setSources(sourcesData || []);
      setSelectedSources(sourcesData.map(s => s.name));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const triggerRes = await fetch(`${API_URL}/ingest/trigger`, {
        method: 'POST'
      });
      const { job_id } = await triggerRes.json();
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/ingest/status/${job_id}`);
          const status = await statusRes.json();
          
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            await fetchData();
            setLoading(false);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setLoading(false);
            alert(`Scraping failed: ${status.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Error triggering refresh:', error);
      setLoading(false);
    }
  };
  
  const handleClusterClick = async (clusterId: string) => {
    try {
      const res = await fetch(`${API_URL}/clusters/${clusterId}`);
      const data: ClusterDetail = await res.json();
      setSelectedCluster(data);
    } catch (error) {
      console.error('Error fetching cluster details:', error);
    }
  };
  
  // Filter clusters by selected sources
  const filteredClusters = clusters.filter(cluster => {
    if (selectedSources.length === 0) return true;
    if (cluster.source && cluster.source !== 'mixed') {
      return selectedSources.includes(cluster.source);
    }
    return true;
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">📰 News Pulse</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Updating...' : '🔄 Refresh Data'}
          </button>
        </div>
        
        {/* Source Filters */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">Sources:</span>
          {sources.map(source => (
            <button
              key={source.name}
              onClick={() => {
                setSelectedSources(prev =>
                  prev.includes(source.name)
                    ? prev.filter(s => s !== source.name)
                    : [...prev, source.name]
                );
              }}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedSources.includes(source.name)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {source.name}
            </button>
          ))}
        </div>
        
        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Timeline</h2>
          {filteredClusters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span>Loading clusters...</span>
                </div>
              ) : (
                <div>
                  <p>No clusters found.</p>
                  <p className="text-sm mt-2">Click &quot;Refresh Data&quot; to start scraping news articles.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredClusters.map(cluster => {
                const startDate = new Date(cluster.startTime);
                const endDate = new Date(cluster.endTime);
                const isToday = startDate.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={cluster.id}
                    onClick={() => handleClusterClick(cluster.id)}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-800">{cluster.label}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {startDate.toLocaleDateString()} → {endDate.toLocaleDateString()}
                          {isToday && (
                            <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {cluster.articleCount} articles
                        </span>
                        {cluster.source && cluster.source !== 'mixed' && (
                          <span className="text-xs text-gray-500">{cluster.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Cluster Detail Modal */}
        {selectedCluster && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedCluster(null)}
          >
            <div 
              className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
                <h3 className="text-xl font-bold text-gray-800">{selectedCluster.label}</h3>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4 mt-4">
                {selectedCluster.articles?.map((article, i) => (
                  <div key={i} className="border-b pb-4 last:border-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {article.title}
                    </a>
                    <div className="text-sm text-gray-500 mt-1">
                      {article.source} • {new Date(article.publishedAt).toLocaleString()}
                    </div>
                    {article.summary && (
                      <p className="text-sm text-gray-700 mt-2">{article.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}