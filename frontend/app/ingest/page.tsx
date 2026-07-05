'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Settings, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Database,
  Rss,
  Brain,
  ArrowLeft,
  History,
  Trash2,
  Filter,
  Sliders
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { statusColors } from '@/utils/colors'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface JobStatus {
  job_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  error?: string
  counts?: {
    articles_scraped: number
    clusters_created: number
  }
}

interface JobHistory extends JobStatus {
  duration?: string
}

export default function IngestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [polling, setPolling] = useState(false)
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)
  
  // Configuration state
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'BBC News',
    'NPR',
    'The Guardian'
  ])
  const [clusterThreshold, setClusterThreshold] = useState(3)
  const [minWordLength, setMinWordLength] = useState(3)

  const availableSources = [
    { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', active: true },
    { id: 'npr', name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', active: true },
    { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', active: true },
    { id: 'reuters', name: 'Reuters', url: 'https://www.reuters.com/rss', active: false },
    { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', active: false },
  ]

  // Load job history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jobHistory')
    if (saved) {
      try {
        setJobHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load job history')
      }
    }
  }, [])

  // Save job history
  const saveJobHistory = (job: JobHistory) => {
    const updated = [job, ...jobHistory].slice(0, 20) // Keep last 20
    setJobHistory(updated)
    localStorage.setItem('jobHistory', JSON.stringify(updated))
  }

  const triggerScrape = async () => {
    setIsLoading(true)
    setJobStatus(null)
    
    try {
      const res = await fetch(`${API_URL}/ingest/trigger`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: selectedSources,
          threshold: clusterThreshold,
          minWordLength: minWordLength
        })
      })
      
      if (!res.ok) throw new Error('Failed to trigger scrape')
      
      const data = await res.json()
      setJobStatus({ ...data, status: 'pending' })
      setPolling(true)
      toast.success('📡 Scraping job started!')
      
      pollStatus(data.job_id)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to start scraping')
      setIsLoading(false)
    }
  }

  const pollStatus = async (jobId: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 minutes

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`${API_URL}/ingest/status/${jobId}`)
        const data = await res.json()
        setJobStatus(data)

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
          setPolling(false)
          setIsLoading(false)
          
          // Save to history
          const duration = data.completed_at 
            ? Math.round((new Date(data.completed_at).getTime() - new Date(data.started_at).getTime()) / 1000)
            : undefined
          
          saveJobHistory({
            ...data,
            duration: duration ? `${duration}s` : undefined
          })
          
          if (data.status === 'completed') {
            toast.success(`✅ Completed! ${data.counts?.articles_scraped || 0} articles, ${data.counts?.clusters_created || 0} clusters`)
          } else {
            toast.error(`❌ Failed: ${data.error || 'Unknown error'}`)
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setPolling(false)
          setIsLoading(false)
          toast.error('⏱️ Scraping timed out')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000)
  }

  const clearHistory = () => {
    setJobHistory([])
    localStorage.removeItem('jobHistory')
    toast.success('History cleared')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Activity className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.idle
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Database className="w-8 h-8 text-indigo-500" />
                Data Ingestion
              </h1>
              <p className="text-gray-500 mt-1">Advanced control for scraping and clustering</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow hover:shadow-md transition-all"
          >
            <History className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">History ({jobHistory.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  Configuration
                </h2>
                <button
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className="text-sm text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  {advancedMode ? 'Basic Mode' : 'Advanced Mode'}
                </button>
              </div>

              <div className="space-y-4">
                {/* Source Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    <span className="flex items-center gap-2">
                      <Rss className="w-4 h-4" />
                      News Sources
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSources.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => {
                          setSelectedSources(prev =>
                            prev.includes(source.name)
                              ? prev.filter(s => s !== source.name)
                              : [...prev, source.name]
                          )
                        }}
                        disabled={!source.active}
                        className={`
                          px-3 py-1.5 text-sm rounded-full transition-all
                          ${!source.active ? 'opacity-50 cursor-not-allowed' : ''}
                          ${selectedSources.includes(source.name)
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${source.active ? 'bg-green-400' : 'bg-gray-400'}`} />
                          {source.name}
                          {!source.active && ' (coming soon)'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Settings */}
                <AnimatePresence>
                  {advancedMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="text-sm font-medium text-gray-600 block mb-1">
                            Cluster Threshold
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={clusterThreshold}
                              onChange={(e) => setClusterThreshold(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="font-medium text-indigo-600 w-8">
                              {clusterThreshold}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Shared keywords needed</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 block mb-1">
                            Min Word Length
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="2"
                              max="6"
                              value={minWordLength}
                              onChange={(e) => setMinWordLength(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="font-medium text-indigo-600 w-8">
                              {minWordLength}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Minimum characters</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Trigger Button */}
                <button
                  onClick={triggerScrape}
                  disabled={isLoading || polling || selectedSources.length === 0}
                  className={`
                    w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                    ${isLoading || polling || selectedSources.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    }
                  `}
                >
                  {isLoading || polling ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {polling ? 'Processing...' : 'Starting...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Scraping ({selectedSources.length} sources)
                    </>
                  )}
                </button>

                {selectedSources.length === 0 && (
                  <p className="text-sm text-yellow-600 text-center">
                    ⚠️ Please select at least one source
                  </p>
                )}
              </div>
            </motion.div>

            {/* Current Job Status */}
            {jobStatus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 shadow-lg"
              >
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Current Job
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(jobStatus.status)}
                      <div>
                        <p className="font-medium text-gray-700">
                          Job {jobStatus.job_id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Started: {new Date(jobStatus.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div 
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: getStatusColor(jobStatus.status) }}
                    >
                      {jobStatus.status.toUpperCase()}
                    </div>
                  </div>

                  {jobStatus.status === 'running' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 60, ease: 'linear' }}
                      />
                    </div>
                  )}

                  {jobStatus.counts && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {jobStatus.counts.articles_scraped || 0}
                        </p>
                        <p className="text-sm text-gray-500">Articles</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {jobStatus.counts.clusters_created || 0}
                        </p>
                        <p className="text-sm text-gray-500">Clusters</p>
                      </div>
                    </div>
                  )}

                  {jobStatus.error && (
                    <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">
                      <strong>Error:</strong> {jobStatus.error}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Info & History */}
          <div className="space-y-6">
            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-indigo-500" />
                How It Works
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">1.</span>
                  <span>Fetch articles from selected RSS feeds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">2.</span>
                  <span>Extract full article content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">3.</span>
                  <span>Extract keywords (remove stopwords)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">4.</span>
                  <span>Group by keyword overlap (threshold: {clusterThreshold})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">5.</span>
                  <span>Generate cluster labels from top keywords</span>
                </li>
              </ul>
            </motion.div>

            {/* Job History */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-500" />
                      Job History
                    </h2>
                    {jobHistory.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {jobHistory.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No jobs yet. Run your first scrape!
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {jobHistory.map((job) => (
                        <div
                          key={job.job_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <div>
                              <p className="text-gray-700">
                                {new Date(job.started_at).toLocaleDateString()}
                              </p>
                              {job.counts && (
                                <p className="text-xs text-gray-400">
                                  {job.counts.articles_scraped || 0} articles · {job.counts.clusters_created || 0} clusters
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {job.duration && (
                              <span className="text-xs text-gray-400">{job.duration}</span>
                            )}
                            <div 
                              className="px-2 py-0.5 rounded-full text-xs text-white"
                              style={{ backgroundColor: getStatusColor(job.status) }}
                            >
                              {job.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}