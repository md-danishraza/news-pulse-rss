'use client'

import { useState, useEffect, useRef } from 'react'
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
  Sliders,
  ChevronRight,
  Sparkles
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

interface ConfigCardProps {
  selectedSources: string[]
  setSelectedSources: React.Dispatch<React.SetStateAction<string[]>>
  clusterThreshold: number
  setClusterThreshold: (val: number) => void
  minWordLength: number
  setMinWordLength: (val: number) => void
  advancedMode: boolean
  setAdvancedMode: (val: boolean) => void
  availableSources: Array<{ id: string; name: string; url: string; active: boolean }>
  triggerScrape: () => void
  isLoading: boolean
  polling: boolean
}

function ConfigCard({
  selectedSources,
  setSelectedSources,
  clusterThreshold,
  setClusterThreshold,
  minWordLength,
  setMinWordLength,
  advancedMode,
  setAdvancedMode,
  availableSources,
  triggerScrape,
  isLoading,
  polling
}: ConfigCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden group border border-slate-200/50 dark:border-slate-800/40"
    >
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-indigo-500/20 via-cyan-500/40 to-transparent" />
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2.5 font-jakarta">
          <Settings className="w-5 h-5 text-indigo-500" />
          Ingestion Settings
        </h2>
        <button
          onClick={() => setAdvancedMode(!advancedMode)}
          className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/10"
        >
          <Sliders className="w-3.5 h-3.5" />
          {advancedMode ? 'Basic Mode' : 'Advanced Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Source Selection Tag Board */}
        <div>
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3 font-jakarta">
            <span className="flex items-center gap-2">
              <Rss className="w-4 h-4 text-slate-400" />
              Active Feed Channels
            </span>
          </label>
          <div className="flex flex-wrap gap-2.5">
            {availableSources.map((source) => {
              const isSelected = selectedSources.includes(source.name)
              return (
                <button
                  key={source.id}
                  onClick={() => {
                    setSelectedSources(prev =>
                      prev.includes(source.name)
                        ? prev.filter(s => s !== source.name)
                        : [...prev, source.name]
                    )
                  }}
                  disabled={!source.active || isLoading || polling}
                  className={`
                    px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer border flex items-center gap-2
                    ${!source.active ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800/40' : ''}
                    ${isSelected
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/15 border-transparent'
                      : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800/40 dark:hover:bg-slate-800/60'
                    }
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${source.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  {source.name}
                  {!source.active && <span className="text-[9px] font-normal text-slate-400 uppercase tracking-tight ml-0.5">(Soon)</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Advanced Parameter Controls */}
        <AnimatePresence initial={false}>
          {advancedMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-800/40 pt-5 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold font-jakarta text-slate-500 uppercase tracking-wider">
                    <span>Cluster Matching Index</span>
                    <span className="text-indigo-500 text-sm font-black">{clusterThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={clusterThreshold}
                    onChange={(e) => setClusterThreshold(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    Required shared keyword matches before two distinct news records coalesce into one timeline topic pill.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold font-jakarta text-slate-500 uppercase tracking-wider">
                    <span>Keyword Size Threshold</span>
                    <span className="text-indigo-500 text-sm font-black">{minWordLength}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={minWordLength}
                    onChange={(e) => setMinWordLength(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    Minimum word-length boundary filter to omit parsing artifacts, tracking symbols, or truncated abbreviations.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Action Trigger Button */}
        <div className="pt-2">
          <button
            onClick={triggerScrape}
            disabled={isLoading || polling || selectedSources.length === 0}
            className={`
              w-full py-4 rounded-2xl font-bold font-jakarta text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md
              ${isLoading || polling || selectedSources.length === 0
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none border border-slate-200/30 dark:border-slate-700/30'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-indigo-500/15 cursor-pointer hover:scale-[1.01]'
              }
            `}
          >
            {isLoading || polling ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                {polling ? 'Parsing & Clusterting Pipeline...' : 'Initiating Connection...'}
              </>
            ) : (
              <>
                <Play className="w-4.5 h-4.5 text-white" />
                Launch Pipeline Sequence ({selectedSources.length} Feeds)
              </>
            )}
          </button>
          
          {selectedSources.length === 0 && (
            <p className="text-[11px] font-bold text-amber-500 text-center mt-3 font-jakarta uppercase tracking-wider animate-pulse">
              ⚠️ Select at least one feed channel to activate sequence.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface JobStatusCardProps {
  jobStatus: JobStatus
  getStatusIcon: (status: string) => React.ReactNode
  getStatusColor: (status: string) => string
}

function JobStatusCard({ jobStatus, getStatusIcon, getStatusColor }: JobStatusCardProps) {
  // Safe status translation to prevent visual crashes
  const currentStatus = jobStatus.status || 'pending'
  const isRunning = currentStatus === 'running' || currentStatus === 'pending'
  const statusBadgeColor = getStatusColor(currentStatus)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-emerald-500/10 via-emerald-500/30 to-transparent" />

      <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2.5 font-jakarta mb-5">
        <Activity className="w-5 h-5 text-indigo-500" />
        Live Monitor
      </h2>

      <div className="space-y-6">
        {/* Connection status summary block */}
        <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/20 rounded-2xl">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/40">
              {getStatusIcon(currentStatus)}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-700 dark:text-slate-300 font-jakarta text-sm">
                Job #{jobStatus.job_id.slice(0, 8)}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                Timestamp: {jobStatus.started_at ? new Date(jobStatus.started_at).toLocaleTimeString() : 'Awaiting start'}
              </p>
            </div>
          </div>
          <span 
            className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white select-none shadow-sm"
            style={{ backgroundColor: statusBadgeColor }}
          >
            {currentStatus}
          </span>
        </div>

        {/* Polling progress animation track */}
        {isRunning && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Extracting RSS Coordinates</span>
              <span className="text-indigo-500 animate-pulse font-jakarta">Parsing Active</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/10">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                initial={{ width: '2%' }}
                animate={{ width: '98%' }}
                transition={{ duration: 30, ease: 'easeOut' }} // Gentle visual pacing
              />
            </div>
          </div>
        )}

        {/* Dynamic processed metric modules */}
        {jobStatus.counts && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50/20 dark:bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-center">
              <p className="text-3xl font-extrabold text-indigo-500 dark:text-indigo-400 font-jakarta tracking-tight">
                {jobStatus.counts.articles_scraped || 0}
              </p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                Articles Catalogued
              </p>
            </div>
            <div className="p-4 bg-cyan-50/20 dark:bg-cyan-500/5 border border-cyan-500/10 rounded-2xl text-center">
              <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 font-jakarta tracking-tight">
                {jobStatus.counts.clusters_created || 0}
              </p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                Derived Clusters
              </p>
            </div>
          </div>
        )}

        {/* Error reporting stack */}
        {jobStatus.error && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-xs text-rose-500 leading-relaxed font-sans"
          >
            <span className="font-bold uppercase tracking-wider block mb-1">Execution Interrupted:</span>
            {jobStatus.error}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function InfoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass rounded-3xl p-6 md:p-8 shadow-md border border-slate-200/50 dark:border-slate-800/40 relative"
    >
      <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2.5 font-jakarta mb-5">
        <Brain className="w-5 h-5 text-indigo-500" />
        Processing Sequence
      </h2>
      <div className="space-y-4">
        {[
          { num: '01', title: 'Feed Pull', desc: 'Normalized fields are safely parsed from RSS nodes.' },
          { num: '02', title: 'Full Text Parsing', desc: 'Main text extracted independently, stripping boilerplate items.' },
          { num: '03', title: 'Part-of-Speech Tag', desc: 'Words are evaluated using POS taggers; only Nouns and Adjectives are retained.' },
          { num: '04', title: 'Seed Clustering', desc: 'Keyword sets compared with cluster seed nodes to verify semantic alignment.' },
          { num: '05', title: 'Title Generation', desc: 'The timeline creates dynamic titles based on topmost shared keywords.' }
        ].map((step, i) => (
          <div key={i} className="flex gap-4">
            <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 font-jakarta bg-indigo-500/5 dark:bg-indigo-500/10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
              {step.num}
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-jakarta">{step.title}</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

interface JobHistoryCardProps {
  jobHistory: JobHistory[]
  clearHistory: () => void
  getStatusIcon: (status: string) => React.ReactNode
  getStatusColor: (status: string) => string
}

function JobHistoryCard({ jobHistory, clearHistory, getStatusIcon, getStatusColor }: JobHistoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-3xl p-6 md:p-8 shadow-md border border-slate-200/50 dark:border-slate-800/40 mt-6 relative"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2.5 font-jakarta">
          <History className="w-5 h-5 text-indigo-500" />
          Execution Log
        </h2>
        {jobHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 cursor-pointer flex items-center gap-1 bg-rose-500/5 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Log
          </button>
        )}
      </div>

      {jobHistory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            No pipeline jobs ran in this sandbox cycle. Use start sequences above.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {jobHistory.map((job) => (
            <div
              key={job.job_id}
              className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/30 dark:border-slate-800/20 rounded-2xl text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 p-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                  {getStatusIcon(job.status)}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-700 dark:text-slate-300 font-jakarta truncate">
                    Job #{job.job_id.slice(0, 8)}
                  </p>
                  {job.counts && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      Merged: {job.counts.articles_scraped} entries • Created: {job.counts.clusters_created} topics
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2.5 ml-3 flex-shrink-0">
                {job.duration && (
                  <span className="text-[10px] font-bold text-slate-400 font-jakarta">{job.duration}</span>
                )}
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-white"
                  style={{ backgroundColor: getStatusColor(job.status) }}
                >
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function IngestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [polling, setPolling] = useState(false)
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([])
  const [showHistory, setShowHistory] = useState(true)
  const [advancedMode, setAdvancedMode] = useState(false)

  // Polling intervals reference to safely prevent memory leaks on unmount
  const activePollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Configuration parameter options
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'BBC News',
    'NPR',
    'World news | The Guardian'
  ])
  const [clusterThreshold, setClusterThreshold] = useState(3)
  const [minWordLength, setMinWordLength] = useState(3)

  const availableSources = [
    { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', active: true },
    { id: 'npr', name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', active: true },
    { id: 'guardian', name: 'World news | The Guardian', url: 'https://www.theguardian.com/world/rss', active: true },
    { id: 'reuters', name: 'Reuters', url: 'https://www.reuters.com/rss', active: false },
    { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', active: false },
  ]

  // Clean-up polling loop on component unmount
  useEffect(() => {
    return () => {
      if (activePollIntervalRef.current) {
        clearInterval(activePollIntervalRef.current)
      }
    }
  }, [])

  // Load history data from LocalStorage cleanly
  useEffect(() => {
    const saved = localStorage.getItem('jobHistory')
    if (saved) {
      try {
        setJobHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse Job History:', e)
      }
    }
  }, [])

  const saveJobHistory = (job: JobHistory) => {
    setJobHistory(prev => {
      const updated = [job, ...prev].slice(0, 20)
      localStorage.setItem('jobHistory', JSON.stringify(updated))
      return updated
    })
  }

  const triggerScrape = async () => {
    // Clear any dangling interval loops first
    if (activePollIntervalRef.current) {
      clearInterval(activePollIntervalRef.current)
    }

    setIsLoading(true)
    setPolling(true)
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

      if (!res.ok) throw new Error('Request refused by Node proxy gateway')

      const data = await res.json()
      
      // FIXING CASED KEY MISMATCH: Fallbacks to match any API response structures seamlessly
      const targetJobId = data.jobId || data.job_id

      if (!targetJobId) {
        throw new Error('Pipeline triggered but no jobId was returned by backend')
      }

      setJobStatus({
        job_id: targetJobId,
        status: 'pending',
        started_at: new Date().toISOString()
      })
      
      toast.success('📡 Scrape triggered. Initializing monitors...')
      pollStatus(targetJobId)
    } catch (error) {
      console.error('Trigger Scrape Error:', error)
      toast.error('Could not initiate ingestion flow')
      setIsLoading(false)
      setPolling(false)
    }
  }

  const pollStatus = (jobId: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 minutes maximum limits

    activePollIntervalRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`${API_URL}/ingest/status/${jobId}`)
        if (!res.ok) throw new Error('Pipeline status verify failed')
        
        const data: JobStatus = await res.json()
        
        // FIXING CRITICAL VISUAL STUCK LOADER BUG:
        // Ensure state updates to the fresh status instantly instead of keeping hardcoded pending/running labels.
        setJobStatus(data)

        if (data.status === 'completed' || data.status === 'failed') {
          if (activePollIntervalRef.current) {
            clearInterval(activePollIntervalRef.current)
          }
          setPolling(false)
          setIsLoading(false)

          const durationSec = data.completed_at && data.started_at
            ? Math.round((new Date(data.completed_at).getTime() - new Date(data.started_at).getTime()) / 1000)
            : undefined

          saveJobHistory({
            ...data,
            duration: durationSec ? `${durationSec}s` : undefined
          })

          if (data.status === 'completed') {
            toast.success(`✨ Success! Parsed ${data.counts?.articles_scraped || 0} items into ${data.counts?.clusters_created || 0} clusters`)
          } else {
            toast.error(`⚡ Pipeline failed: ${data.error || 'Check server execution logs'}`)
          }
        } else if (attempts >= maxAttempts) {
          if (activePollIntervalRef.current) {
            clearInterval(activePollIntervalRef.current)
          }
          setPolling(false)
          setIsLoading(false)
          toast.error('⏱️ Status verification timed out')
        }
      } catch (error) {
        console.error('Polling tick verification error:', error)
        // Keep running on minor network hiccups up to the limit, but safe-guard exit
        if (attempts >= maxAttempts) {
          if (activePollIntervalRef.current) {
            clearInterval(activePollIntervalRef.current)
          }
          setPolling(false)
          setIsLoading(false)
        }
      }
    }, 2000)
  }

  const clearHistory = () => {
    setJobHistory([])
    localStorage.removeItem('jobHistory')
    toast.success('Execution logs reset cleanly', { icon: '🧹' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
      case 'running':
        return <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500 animate-pulse" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-500" />
      default:
        return <Activity className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.idle
  }

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative z-10 space-y-8">
        {/* Navigation Headboard header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-jakarta flex items-center gap-3">
                <Database className="w-8 h-8 text-indigo-500 animate-pulse-soft" />
                Control Room
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/15">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Management
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Advanced scraping execution and grouping index configuration panel.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl shadow-sm text-xs font-bold font-jakarta text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-400" />
            Log history ({jobHistory.length})
          </button>
        </header>

        {/* Dashboard Panels Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ConfigCard
              selectedSources={selectedSources}
              setSelectedSources={setSelectedSources}
              clusterThreshold={clusterThreshold}
              setClusterThreshold={setClusterThreshold}
              minWordLength={minWordLength}
              setMinWordLength={setMinWordLength}
              advancedMode={advancedMode}
              setAdvancedMode={setAdvancedMode}
              availableSources={availableSources}
              triggerScrape={triggerScrape}
              isLoading={isLoading}
              polling={polling}
            />

            <AnimatePresence>
              {jobStatus && (
                <JobStatusCard
                  jobStatus={jobStatus}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <InfoCard />

            <AnimatePresence>
              {showHistory && (
                <JobHistoryCard
                  jobHistory={jobHistory}
                  clearHistory={clearHistory}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}