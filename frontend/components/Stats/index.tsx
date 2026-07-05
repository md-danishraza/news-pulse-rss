'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Newspaper, Layers, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface StatsProps {
  totalArticles: number
  totalClusters: number
  lastUpdated: Date | null
  isRefreshing: boolean
  onRefresh: () => void
  onDataCleared?: () => void // Callback to refresh data after clear
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="glass rounded-xl p-4 flex items-center gap-4 min-w-[140px]"
  >
    <div className={`p-2.5 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
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
      toast.success(`🗑️ Cleared ${data.deleted.articles} articles, ${data.deleted.clusters} clusters`)
      
      // Refresh the data
      if (onDataCleared) {
        onDataCleared()
      }
      setShowConfirm(false)
    } catch (error) {
      console.error('Error clearing data:', error)
      toast.error('Failed to clear data')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/50 rounded-xl glass relative">
      <div className="flex flex-wrap gap-4">
        <StatCard
          icon={Newspaper}
          label="Articles"
          value={totalArticles}
          color="bg-blue-500"
        />
        <StatCard
          icon={Layers}
          label="Clusters"
          value={totalClusters}
          color="bg-purple-500"
        />
        <StatCard
          icon={Clock}
          label="Updated"
          value={lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'Never'}
          color="bg-emerald-500"
        />
      </div>
      
      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
            ${isRefreshing 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md hover:shadow-lg'
            }
          `}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </motion.button>

        {/* Delete Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting || (totalArticles === 0 && totalClusters === 0)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
            ${isDeleting || (totalArticles === 0 && totalClusters === 0)
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-red-500 text-white shadow-md hover:shadow-lg hover:bg-red-600'
            }
          `}
        >
          <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
          {isDeleting ? 'Deleting...' : 'Clear All'}
        </motion.button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Clear All Data?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Articles:</span>
                  <span className="font-medium">{totalArticles}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Clusters:</span>
                  <span className="font-medium">{totalClusters}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Clear All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}