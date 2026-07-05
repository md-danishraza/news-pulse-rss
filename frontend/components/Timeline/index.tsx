'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cluster } from '@/types'
import { getColor, getColorWithOpacity } from '@/utils/colors'
import { CalendarRange } from 'lucide-react'

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

  // Find extreme temporal boundaries for scaling
  const allDates = clusters.flatMap(c => [
    new Date(c.startTime).getTime(),
    new Date(c.endTime).getTime()
  ])
  const minTime = Math.min(...allDates)
  const maxTime = Math.max(...allDates)
  const totalDuration = maxTime - minTime || 1

  // Converts a timestamp into a 0-100 percentage layout position
  const getPosition = (timestamp: string) => {
    const time = new Date(timestamp).getTime()
    return ((time - minTime) / totalDuration) * 100
  }

  // Sort clusters chronologically by start time to pack lanes systematically
  const sortedByStart = [...clusters].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  // Lanes store the end time (in milliseconds) of the last assigned cluster
  const lanes: number[] = []
  const clusterLanes: Record<string, number> = {}

  // Safe visual horizontal margin/buffer (roughly 6% of the timeline width) to prevent adjacent collisions
  const timeBuffer = totalDuration * 0.06

  sortedByStart.forEach(cluster => {
    const start = new Date(cluster.startTime).getTime()
    const end = new Date(cluster.endTime).getTime()
    
    // Handle single-point event durations (1-day stories) to give them virtual buffer space
    const duration = end - start
    const virtualEnd = duration < timeBuffer ? start + timeBuffer : end

    let assignedLane = -1;

    // Scan existing lanes to see where this item fits cleanly
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] + timeBuffer < start) {
        assignedLane = i
        lanes[i] = virtualEnd
        break
      }
    }

    // No lane was free with enough buffer space - provision a new lane
    if (assignedLane === -1) {
      assignedLane = lanes.length
      lanes.push(virtualEnd)
    }

    clusterLanes[cluster.id] = assignedLane
  })

  // Dynamic sizing parameters based on generated packing lanes
  const laneCount = Math.max(1, lanes.length)
  const laneHeight = 46 // px
  const timelineHeight = laneCount * laneHeight + 110 // Dynamic outer height with padded bottom spacing

  return (
    <div className="relative">
      {}
      <div 
        ref={containerRef}
        style={{ height: `${timelineHeight}px` }}
        className="relative w-full bg-white/40 dark:bg-slate-950/20 rounded-3xl overflow-hidden glass border border-slate-200/50 dark:border-slate-800/40 select-none shadow-sm transition-all duration-500"
      >
        {/* Dynamic Horizontal Lane Tracks Backdrops */}
        <div className="absolute inset-x-0 top-12 bottom-14 pointer-events-none">
          {Array.from({ length: laneCount }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-[1px] bg-slate-100/40 dark:bg-slate-800/20"
              style={{ top: `${i * laneHeight + laneHeight / 2}px` }}
            />
          ))}
        </div>

        {/* Dynamic Vertical Time Guidelines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[1px] bg-slate-100/50 dark:bg-slate-800/10"
              style={{ left: `${(i / 7) * 100}%` }}
            />
          ))}
        </div>

        {}
        <div className="absolute inset-0 p-6 pt-12 pb-16">
          {sortedByStart.map((cluster, index) => {
            const laneIndex = clusterLanes[cluster.id] ?? 0
            
            // Raw positions based on percentages
            const rawLeft = getPosition(cluster.startTime)
            const rawRight = getPosition(cluster.endTime)
            let clusterWidth = rawRight - rawLeft

            // Enforce a minimum layout width (4%) for single-point events to keep them readable/clickable
            const minWidth = 4
            let adjustedLeft = rawLeft
            if (clusterWidth < minWidth) {
              clusterWidth = minWidth
              // Offset slightly left if rendering right up against the 100% boundary
              if (adjustedLeft + clusterWidth > 100) {
                adjustedLeft = 100 - minWidth
              }
            }

            // LINEAR BOUNDARY SAFE-GUTTER: Compresses scale to stay cleanly inside the timeline (2.5% to 94.5%)
            // This leaves 2.5% left margin and 5.5% right margin to guarantee circles/pills never clip out
            const leftPercent = 2.5 + (adjustedLeft * 0.92)
            const widthPercent = clusterWidth * 0.92

            const color = getColor(cluster.id)
            const height = 28 // Clean, high-legibility pill height

            return (
              <motion.div
                key={cluster.id}
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.02, type: 'spring', stiffness: 280, damping: 24 }}
                className="absolute cursor-pointer group"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${height}px`,
                  top: `${laneIndex * laneHeight + 12}px`,
                  zIndex: cluster.articleCount + 10,
                }}
                onClick={() => onClusterClick(cluster)}
                onMouseEnter={(e) => {
                  setHoveredCluster(cluster)
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (rect) {
                    setTooltipPosition({
                      x: e.clientX,
                      y: e.clientY - 12
                    })
                  }
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({
                    x: e.clientX,
                    y: e.clientY - 12
                  })
                }}
                onMouseLeave={() => setHoveredCluster(null)}
              >
                {/* Frosted Segment Pill Container */}
                <div
                  className="w-full h-full rounded-full transition-all duration-300 flex items-center px-3.5 justify-between shadow-sm relative overflow-hidden ring-1 ring-white/10 hover:shadow-lg group-hover:scale-[1.01]"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${getColorWithOpacity(cluster.id, 0.82)})`,
                    boxShadow: `0 4px 12px ${getColorWithOpacity(cluster.id, 0.25)}`,
                  }}
                >
                  <span className="text-white text-[11px] font-extrabold truncate drop-shadow-sm font-jakarta tracking-wide">
                    {cluster.label}
                  </span>
                  
                  {/* Article count indicator bubble */}
                  <span className="flex-shrink-0 ml-2 h-4 px-1.5 rounded-full bg-white/20 text-[9px] font-black text-white flex items-center justify-center">
                    {cluster.articleCount}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Dynamic horizontal Timeaxis footer */}
        <TimeAxis minTime={minTime} maxTime={maxTime} />
      </div>

      {/* Hover Tooltip Render */}
      <AnimatePresence>
        {hoveredCluster && (
          <ClusterTooltip
            cluster={hoveredCluster}
            position={tooltipPosition}
          />
        )}
      </AnimatePresence>

      {/* Summary Tracker Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-bold font-jakarta uppercase tracking-wider px-2">
        <span>Timeline Space: {clusters.length} topics mapped ({laneCount} lanes packed)</span>
        <span>Covers: {clusters.reduce((acc, c) => acc + c.articleCount, 0)} articles total</span>
      </div>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="relative w-full h-[400px] bg-slate-100/30 dark:bg-slate-950/10 rounded-3xl overflow-hidden glass border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between p-6">
      <div className="space-y-4 flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-2xl shimmer border border-slate-200/20"
            style={{
              marginLeft: `${i * 12 + 5}%`,
              width: `${55 - i * 6}%`,
            }}
          />
        ))}
      </div>
      <div className="h-6 rounded-lg shimmer w-1/3 mt-4" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="relative w-full h-[400px] bg-white/40 dark:bg-slate-950/10 rounded-3xl overflow-hidden glass border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-center">
      <div className="text-center space-y-3 p-6 max-w-sm">
        <div className="p-4 bg-indigo-50 dark:bg-slate-800/30 rounded-full w-fit mx-auto">
          <CalendarRange className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white font-jakarta">Waiting for Stream Data</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          No clusters are available in this coordinate time window. Click Refresh above to initiate the scraper pipeline.
        </p>
      </div>
    </div>
  )
}