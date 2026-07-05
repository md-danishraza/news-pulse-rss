'use client'

import { motion } from 'framer-motion'
import { Cluster } from '@/types'
import { getColor } from '@/utils/colors'

interface ClusterTooltipProps {
  cluster: Cluster
  position: { x: number; y: number }
}

export default function ClusterTooltip({ cluster, position }: ClusterTooltipProps) {
  const color = getColor(cluster.id)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="glass-dark rounded-lg p-3 min-w-[200px] shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-white font-medium text-sm truncate">
            {cluster.label}
          </span>
        </div>
        <div className="space-y-1 text-xs text-gray-300">
          <div>{cluster.articleCount} articles</div>
          <div>
            {new Date(cluster.startTime).toLocaleDateString()} → {new Date(cluster.endTime).toLocaleDateString()}
          </div>
          {cluster.source && cluster.source !== 'mixed' && (
            <div>Source: {cluster.source}</div>
          )}
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
      </div>
    </motion.div>
  )
}