'use client'

import { motion } from 'framer-motion'
import { Source } from '@/types'
import { getColor } from '@/utils/colors'

interface SourceFilterProps {
  sources: Source[]
  selectedSources: string[]
  onToggleSource: (source: string) => void
}

export default function SourceFilter({ sources, selectedSources, onToggleSource }: SourceFilterProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-white/50 rounded-xl glass">
      <span className="text-sm font-medium text-gray-600 mr-2">📡 Sources:</span>
      <motion.div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          const isSelected = selectedSources.includes(source.name)
          const color = getColor(index)

          return (
            <motion.button
              key={source.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggleSource(source.name)}
              className={`
                px-3 py-1.5 text-sm rounded-full transition-all duration-200
                ${isSelected 
                  ? 'text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              style={{
                backgroundColor: isSelected ? color : undefined,
              }}
            >
              <span className="flex items-center gap-1.5">
                <span 
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: isSelected ? 'white' : color }}
                />
                {source.name}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}