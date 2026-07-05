'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cluster } from '@/types'
import { getColor, getColorWithOpacity } from '@/utils/colors'

import { formatDistanceToNow } from 'date-fns'
import TimeAxis from './TimeAxis'
import ClusterTooltip from './ClusterTooltip'


interface TimelineProps {
  clusters: Cluster[]
  onClusterClick: (cluster: Cluster) => void
  loading?: boolean
}

export default function Timeline({ clusters, onClusterClick, loading }: TimelineProps) {
  const [hoveredCluster, setHoveredCluster] = useState<Cluster | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  if (loading) {
    return <TimelineSkeleton />
  }

  if (!clusters || clusters.length === 0) {
    return <EmptyState />
  }

  // Calculate time range
  const allDates = clusters.flatMap(c => [
    new Date(c.startTime).getTime(),
    new Date(c.endTime).getTime()
  ])
  const minTime = Math.min(...allDates)
  const maxTime = Math.max(...allDates)
  const totalDuration = maxTime - minTime || 1

  const getPosition = (timestamp: string) => {
    const time = new Date(timestamp).getTime()
    return ((time - minTime) / totalDuration) * 100
  }

  // Sort clusters by size for z-index
  const sortedClusters = [...clusters].sort((a, b) => a.articleCount - b.articleCount)

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="relative w-full h-[400px] bg-white/50 rounded-xl overflow-hidden glass"
      >
        {/* Timeline grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-gray-200/50"
              style={{ left: `${(i / 11) * 100}%` }}
            />
          ))}
        </div>

        {/* Clusters */}
        <div className="absolute inset-0 p-6 pt-10">
          {sortedClusters.map((cluster, index) => {
            const left = getPosition(cluster.startTime)
            const width = getPosition(cluster.endTime) - left
            const color = getColor(cluster.id)
            const height = Math.max(20, Math.min(60, 12 + cluster.articleCount * 2))
            
            return (
              <motion.div
                key={cluster.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03, duration: 0.4 }}
                className="absolute cursor-pointer group"
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 0.5)}%`,
                  height: `${height}px`,
                  top: `${(index % 8) * 45 + 10}px`,
                  zIndex: cluster.articleCount,
                }}
                onClick={() => onClusterClick(cluster)}
                onMouseEnter={(e) => {
                  setHoveredCluster(cluster)
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (rect) {
                    setTooltipPosition({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top - 60
                    })
                  }
                }}
                onMouseLeave={() => setHoveredCluster(null)}
              >
                <div
                  className="w-full h-full rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:scale-y-110"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${getColorWithOpacity(cluster.id, 0.7)})`,
                    boxShadow: `0 4px 15px ${getColorWithOpacity(cluster.id, 0.3)}`,
                  }}
                >
                  {/* Label */}
                  <div className="absolute inset-0 flex items-center justify-center px-2">
                    <span className="text-white text-xs font-medium truncate drop-shadow-md">
                      {cluster.label}
                    </span>
                  </div>
                  
                  {/* Article count badge */}
                  <div className="absolute -top-2 -right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    <span className="text-[10px] font-bold text-gray-700">
                      {cluster.articleCount}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Time axis */}
        <TimeAxis minTime={minTime} maxTime={maxTime} />
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredCluster && (
          <ClusterTooltip
            cluster={hoveredCluster}
            position={tooltipPosition}
          />
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>
          {clusters.length} clusters · {clusters.reduce((acc, c) => acc + c.articleCount, 0)} articles
        </span>
        <span>
          {formatDistanceToNow(new Date(clusters[0]?.startTime || Date.now()))} ago
        </span>
      </div>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="relative w-full h-[400px] bg-white/50 rounded-xl overflow-hidden glass">
      <div className="absolute inset-0 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-8 rounded-lg shimmer"
            style={{
              left: `${Math.random() * 60 + 10}%`,
              width: `${Math.random() * 30 + 10}%`,
              top: `${i * 50 + 20}px`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="relative w-full h-[400px] bg-white/50 rounded-xl overflow-hidden glass flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700">No Clusters Yet</h3>
        <p className="text-gray-500 mt-2">
          Click &quot;Refresh Data&quot; to start scraping news articles
        </p>
      </div>
    </div>
  )
}