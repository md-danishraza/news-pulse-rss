'use client'

import { motion, Variants } from 'framer-motion'
import { Source } from '@/types'
import { getColor, getColorWithOpacity } from '@/utils/colors'
import { Radio } from 'lucide-react'

interface SourceFilterProps {
  sources: Source[]
  selectedSources: string[]
  onToggleSource: (source: string) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants:Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 5 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
}

export default function SourceFilter({ sources, selectedSources, onToggleSource }: SourceFilterProps) {
  if (!sources || sources.length === 0) return null

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap items-center gap-3 p-4 bg-white/45 dark:bg-slate-900/40 rounded-2xl glass border border-slate-200/50 dark:border-slate-800/40 shadow-sm"
    >
      <div className="flex items-center gap-2 mr-1">
        <Radio className="w-4 h-4 text-slate-400 animate-pulse" />
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 font-jakarta">
          Coverage Nodes:
        </span>
      </div>

      {}
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          const isSelected = selectedSources.includes(source.name)
          const baseColor = getColor(index)
          
          // Setup active capsule background styling
          const activeStyle = isSelected ? {
            backgroundColor: baseColor,
            boxShadow: `0 4px 14px ${getColorWithOpacity(index, 0.35)}`,
            borderColor: baseColor,
          } : {}

          return (
            <motion.button
              key={source.name}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onToggleSource(source.name)}
              style={activeStyle}
              className={`
                px-4 py-1.5 rounded-full text-xs font-bold font-jakarta transition-all duration-300 cursor-pointer border
                ${isSelected 
                  ? 'text-white border-transparent' 
                  : 'bg-slate-100/80 text-slate-600 border-slate-200/55 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/40 dark:hover:bg-slate-700/60'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span 
                  className={`w-1.5 h-1.5 rounded-full transition-transform duration-300 ${isSelected ? 'scale-125' : ''}`}
                  style={{ backgroundColor: isSelected ? '#ffffff' : baseColor }}
                />
                {source.name}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}