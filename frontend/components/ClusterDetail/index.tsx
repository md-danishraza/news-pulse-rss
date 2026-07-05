'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { X, ExternalLink, Calendar, Newspaper, Hash } from 'lucide-react'
import { ClusterDetail as ClusterDetailType } from '@/types'
import { getColor, getColorWithOpacity } from '@/utils/colors'

interface ClusterDetailProps {
  cluster: ClusterDetailType | null
  onClose: () => void
}

const overlayVariants:Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
}

const modalVariants:Variants = {
  hidden: { scale: 0.95, y: 15, opacity: 0 },
  visible: { 
    scale: 1, 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 350 } 
  },
  exit: { scale: 0.95, y: 15, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
}

export default function ClusterDetail({ cluster, onClose }: ClusterDetailProps) {
  if (!cluster) return null

  const color = getColor(cluster.id)
  const glowShadow = `0 10px 30px ${getColorWithOpacity(cluster.id, 0.15)}`

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
        onClick={onClose}
      >
        {}
        <motion.div
          variants={modalVariants}
          style={{ boxShadow: glowShadow }}
          className="relative bg-white/95 dark:bg-slate-900/95 glass rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800/60 "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative glowing gradient top bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-1.5 transition-all"
            style={{ backgroundColor: color }}
          />

          {}
          <div 
            className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/80 relative overflow-hidden "
            style={{ background: `linear-gradient(135deg, ${color}08, ${color}02)` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span 
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white/95"
                    style={{ backgroundColor: color }}
                  >
                    <Hash className="w-3 h-3" />
                    Cluster Focus
                  </span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    ID: {cluster.id.toString().substring(0, 8)}
                  </span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white font-jakarta tracking-tight mt-1 truncate">
                  {cluster.label}
                </h3>

                <div className="flex items-center gap-4 flex-wrap text-sm text-slate-500 dark:text-slate-400 mt-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Newspaper className="w-4 h-4 text-slate-400" />
                    {cluster.articleCount} articles
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(cluster.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
                    <span className="mx-1 text-slate-400 font-normal">to</span> 
                    {new Date(cluster.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </motion.button>
            </div>
          </div>

          {}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
            {cluster.articles && cluster.articles.length > 0 ? (
              <div className="space-y-4">
                {cluster.articles.map((article, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group relative p-5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 hover:border-slate-200/80 dark:hover:border-slate-700/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-start gap-1.5 font-jakarta leading-snug"
                        >
                          {article.title}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1 text-slate-400" />
                        </a>

                        {article.summary && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans">
                            {article.summary}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                              style={{ backgroundColor: getColor(article.source || '') }}
                            />
                            {article.source || 'Unknown Outlet'}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(article.publishedAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No verified article details found.</p>
              </div>
            )}
          </div>

          {}
          <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/20 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Consolidated Stream • Source coverage verified independently
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}