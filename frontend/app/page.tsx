'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import Link from 'next/link'
import { Database, Sparkles, Newspaper, ArrowRight, Activity, Calendar } from 'lucide-react'
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

  const fadeInUpVariants:Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  }

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Modern Interactive Header */}
        <motion.header 
          variants={fadeInUpVariants}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200/50 dark:border-slate-800/40"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl shadow-md shadow-indigo-500/10 text-white">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-jakarta flex items-center gap-3">
                  News Pulse
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Activity className="w-3 h-3 animate-pulse text-indigo-500" />
                    Live Engine
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
              Automated multi-source RSS intelligence. Extracting, filtering, and organizing real-time world events into interactive timelines.
            </p>
          </div>
          
          {/* Action Trigger Block */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full md:w-auto"
          >
            <Link
              href="/ingest"
              className="group relative flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Database className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-1.5">
                Data Pipeline Manager
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </motion.header>

        {/* Dashboard Metrics Panel */}
        <motion.section variants={fadeInUpVariants}>
          <Stats
            totalArticles={stats.totalArticles}
            totalClusters={stats.totalClusters}
            lastUpdated={lastUpdated}
            isRefreshing={refreshing}
            onRefresh={refreshData}
            onDataCleared={fetchData}
          />
        </motion.section>

        {/* Dynamic Filtering Panel */}
        <motion.section 
          variants={fadeInUpVariants}
          className="glass rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/50 shadow-sm shadow-slate-100/30"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-jakarta flex items-center gap-2">
                Filter Stream Sources
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Isolate or combine feeds to discover overlapping multi-outlet coverage.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
              {selectedSources.length} of {sources.length} active
            </span>
          </div>
          <SourceFilter
            sources={sources}
            selectedSources={selectedSources}
            onToggleSource={toggleSource}
          />
        </motion.section>

        {/* Timeline Visualization Card */}
        <motion.section 
          variants={fadeInUpVariants}
          className="glass rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/50 shadow-md shadow-slate-100/20 overflow-hidden relative"
        >
          {/* Ambient header glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-jakarta">
              Topic-Clustered Timeline
            </h2>
          </div>
          
          <Timeline
            clusters={filteredClusters}
            onClusterClick={handleClusterClick}
            loading={loading}
          />
        </motion.section>

        {/* Detailed Modal Overlay */}
        <AnimatePresence>
          {selectedCluster && (
            <ClusterDetail
              cluster={selectedCluster}
              onClose={() => setSelectedCluster(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}