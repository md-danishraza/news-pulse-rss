'use client'

import { format, eachHourOfInterval, eachDayOfInterval } from 'date-fns'

interface TimeAxisProps {
  minTime: number
  maxTime: number
}

export default function TimeAxis({ minTime, maxTime }: TimeAxisProps) {
  const duration = maxTime - minTime
  const isSameDay = duration < 24 * 60 * 60 * 1000
  
  let intervals: Date[]
  if (isSameDay) {
    intervals = eachHourOfInterval({
      start: new Date(minTime),
      end: new Date(maxTime)
    }).filter((_, i) => i % 3 === 0) // Limit display overlap
  } else {
    intervals = eachDayOfInterval({
      start: new Date(minTime),
      end: new Date(maxTime)
    })
  }

  // Fallback guard to guarantee visual rendering structure
  if (intervals.length === 0) {
    intervals = [new Date(minTime), new Date(maxTime)]
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-800/40 px-6 backdrop-blur-sm z-20">
      <div className="relative w-full h-full">
        {intervals.map((date, i) => {
          const position = ((date.getTime() - minTime) / (maxTime - minTime)) * 100
          
          return (
            <div
              key={i}
              className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${position}%` }}
            >
              {/* Tick marker */}
              <div className="h-2 w-[1px] bg-slate-300 dark:bg-slate-700" />
              
              {/* Timestamp label */}
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-jakarta mt-1.5">
                {format(date, isSameDay ? 'HH:mm' : 'MMM d')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}