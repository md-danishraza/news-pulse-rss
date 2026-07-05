'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Newspaper, Layers, RefreshCw, Trash2, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface StatsProps {
  totalArticles: number
  totalClusters: number
  lastUpdated: Date | null
  isRefreshing: boolean
  onRefresh: () => void
  onDataCleared?: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const StatCard = ({ icon: Icon, label, value, colorClass, shadowGlow }: any) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    className="glass rounded-2xl p-4 flex items-center gap-4 min-w-[160px] flex-1 border border-slate-200/50 dark:border-slate-800/40 shadow-sm relative overflow-hidden group"
  >
    {/* Soft inner ambient hover card glow */}
    <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full blur-2xl opacity-10 transition-transform duration-500 group-hover:scale-150 ${colorClass}`} />
    
    <div className={`p-3 rounded-xl shadow-md ${colorClass} text-white`}>
      <Icon className="w-5 h-5" />
    </div>
    
    <div className="space-y-0.5 relative z-10">
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 font-jakarta tracking-wider uppercase">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-extrabold text-slate-800 dark:text-white font-jakarta tracking-tight">{value}</p>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  </motion.div>
)

export default function Stats({ 
  totalArticles, 
  totalClusters, 
  lastUpdated, 
  isRefreshing, 
  onRefresh,
  onDataCleared 
}: StatsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClearAll = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`${API_URL}/admin/clear-all`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear data')
      }
      
      const data = await response.json()
      toast.success(`Cleared ${data.deleted.articles} articles and ${data.deleted.clusters} clusters cleanly.`, {
        icon: '🧹'
      })
      
      if (onDataCleared) {
        onDataCleared()
      }
      setShowConfirm(false)
    } catch (error) {
      console.error('Error clearing database:', error)
      toast.error('Clean execution sequence failed')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-6 p-4 md:p-5 bg-white/45 dark:bg-slate-900/40 rounded-3xl glass border border-slate-200/50 dark:border-slate-800/40">
      
      {}
      <div className="flex flex-wrap gap-4 flex-1 min-w-[280px]">
        <StatCard
          icon={Newspaper}
          label="Catalogued"
          value={totalArticles}
          colorClass="bg-gradient-to-tr from-indigo-500 to-indigo-600"
        />
        <StatCard
          icon={Layers}
          label="Clusters"
          value={totalClusters}
          colorClass="bg-gradient-to-tr from-violet-500 to-violet-600"
        />
        <StatCard
          icon={Clock}
          label="Updated"
          value={lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'Never'}
          colorClass="bg-gradient-to-tr from-cyan-500 to-cyan-600"
        />
      </div>
      
      {}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Refresh Sequence Trigger */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase font-jakarta tracking-wider transition-all duration-300 cursor-pointer
            ${isRefreshing 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200/30 dark:border-slate-700/30' 
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md hover:shadow-lg'
            }
          `}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </motion.button>

        {/* Database Clear Action Trigger */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting || (totalArticles === 0 && totalClusters === 0)}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase font-jakarta tracking-wider transition-all duration-300 cursor-pointer border
            ${isDeleting || (totalArticles === 0 && totalClusters === 0)
              ? 'bg-slate-100 dark:bg-slate-850/40 text-slate-400 dark:text-slate-700 cursor-not-allowed border-transparent' 
              : 'bg-red-500/10 dark:bg-red-500/10 hover:bg-red-500 text-red-500 dark:text-red-400 hover:text-white border-red-500/20 shadow-sm'
            }
          `}
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </motion.button>
      </div>

      {}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl glass border border-slate-200/60 dark:border-slate-800/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-jakarta">Purge Database Cache?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This strictly deletes all cached feed stories. The pipeline state will be reset.</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-800/40">
                <div className="flex justify-between text-xs font-bold font-jakarta text-slate-400 uppercase tracking-wider">
                  <span>Resource catalog</span>
                  <span>Quantity</span>
                </div>
                <div className="h-px bg-slate-200/50 dark:bg-slate-800/50 my-2" />
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <span>Verified articles</span>
                  <span>{totalArticles}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 font-medium mt-1.5">
                  <span>Derived clusters</span>
                  <span>{totalClusters}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl transition-colors font-semibold text-sm cursor-pointer"
                >
                  Keep Data
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-500/80 dark:hover:bg-red-500 text-white rounded-2xl transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'Wiping...' : 'Wipe Database'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}