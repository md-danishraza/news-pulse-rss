'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Calendar, Newspaper } from 'lucide-react'
import { ClusterDetail as ClusterDetailType } from '@/types'
import { getColor } from '@/utils/colors'

interface ClusterDetailProps {
  cluster: ClusterDetailType | null
  onClose: () => void
}

export default function ClusterDetail({ cluster, onClose }: ClusterDetailProps) {
  if (!cluster) return null

  const color = getColor(cluster.id)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="p-6 border-b"
            style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <h3 className="text-xl font-bold text-gray-800">{cluster.label}</h3>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Newspaper className="w-4 h-4" />
                    {cluster.articleCount} articles
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(cluster.startTime).toLocaleDateString()} → {new Date(cluster.endTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Articles list */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              {cluster.articles?.map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-4 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-medium text-gray-800 hover:text-indigo-600 transition-colors flex items-start gap-2"
                      >
                        {article.title}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                      </a>
                      {article.summary && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ 
                              backgroundColor: getColor(article.source || '') 
                            }}
                          />
                          {article.source || 'Unknown'}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(article.publishedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50/50">
            <p className="text-xs text-gray-400 text-center">
              {cluster.articles?.length || 0} articles • Click title to read full article
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}