'use client'

import { motion } from 'framer-motion'
import { Cluster } from '@/types'
import { getColor, getColorWithOpacity } from '@/utils/colors'
import { Calendar, Layers } from 'lucide-react'

interface ClusterTooltipProps {
  cluster: Cluster
  position: { x: number; y: number }
}

export default function ClusterTooltip({ cluster, position }: ClusterTooltipProps) {
  const color = getColor(cluster.id)
  const glowShadow = `0 10px 25px ${getColorWithOpacity(cluster.id, 0.25)}`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -108%)',
      }}
    >
      {}
      <div 
        style={{ boxShadow: glowShadow }}
        className="glass-dark rounded-2xl p-4 min-w-[240px] max-w-sm flex flex-col gap-2.5 border border-slate-700/60"
      >
        <div className="flex items-start gap-2.5">
          <div 
            className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-slate-800"
            style={{ backgroundColor: color }}
          />
          <span className="text-white font-bold text-sm leading-tight font-jakarta truncate">
            {cluster.label}
          </span>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-slate-700/50" />

        {}
        <div className="space-y-1.5 text-xs text-slate-300 font-sans">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{cluster.articleCount} grouped articles</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {new Date(cluster.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
              <span className="mx-1 text-slate-500">to</span> 
              {new Date(cluster.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {cluster.sources && cluster.sources.length > 0 && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {cluster.sources.map((src, i) => (
                <span 
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-medium"
                >
                  {src}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Interactive hint chevron */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700/60 rotate-45" />
      </div>
    </motion.div>
  )
}