'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Database, Sparkles } from 'lucide-react'
import { useData } from '@/hooks/useData'
import Timeline from '@/components/Timeline'

import Stats from '@/components/Stats'
import ClusterDetail from '@/components/ClusterDetail'
import { Cluster, ClusterDetail as ClusterDetailType } from '@/types'
import SourceFilter from '@/components/SourceFitler'

export default function Home() {
  const { 
    clusters, 
    sources, 
    loading, 
    refreshing, 
    lastUpdated, 
    stats,
    refreshData,
    fetchData 
  } = useData()

  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [selectedCluster, setSelectedCluster] = useState<ClusterDetailType | null>(null)

  // Initialize selected sources
  useEffect(() => {
    if (sources.length > 0 && selectedSources.length === 0) {
      setSelectedSources(sources.map(s => s.name))
    }
  }, [sources, selectedSources])

  // Filter clusters by selected sources
  const filteredClusters = clusters.filter(cluster => {
    if (selectedSources.length === 0) return true
    if (cluster.source && cluster.source !== 'mixed') {
      return selectedSources.includes(cluster.source)
    }
    if (cluster.sources && cluster.sources.length > 0) {
      return cluster.sources.some(s => selectedSources.includes(s))
    }
    return true
  })

  const handleClusterClick = async (cluster: Cluster) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clusters/${cluster.id}`)
      if (!res.ok) throw new Error('Failed to fetch cluster details')
      const data = await res.json()
      setSelectedCluster(data)
    } catch (error) {
      console.error('Error fetching cluster details:', error)
    }
  }

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span>📰</span>
              News Pulse
              <span className="text-sm font-normal text-gray-400 ml-2">
                <Sparkles className="w-4 h-4 inline text-indigo-400" />
                Live
              </span>
            </h1>
            <p className="text-gray-500 mt-1">
              Topic-clustered news timeline from multiple sources
            </p>
          </div>
          
          <Link
            href="/ingest"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <Database className="w-4 h-4" />
            Data Ingest
          </Link>
        </motion.div>

        {/* Stats - with onDataCleared callback */}
        <Stats
          totalArticles={stats.totalArticles}
          totalClusters={stats.totalClusters}
          lastUpdated={lastUpdated}
          isRefreshing={refreshing}
          onRefresh={refreshData}
          onDataCleared={fetchData} // Refresh data after clearing
        />

        {/* Source Filter */}
        <div className="mt-6">
          <SourceFilter
            sources={sources}
            selectedSources={selectedSources}
            onToggleSource={toggleSource}
          />
        </div>

        {/* Timeline */}
        <div className="mt-6">
          <Timeline
            clusters={filteredClusters}
            onClusterClick={handleClusterClick}
            loading={loading}
          />
        </div>

        {/* Cluster Detail Modal */}
        <ClusterDetail
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
        />
      </div>
    </div>
  )
}