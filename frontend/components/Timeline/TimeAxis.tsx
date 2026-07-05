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
    }).filter((_, i) => i % 2 === 0)
  } else {
    intervals = eachDayOfInterval({
      start: new Date(minTime),
      end: new Date(maxTime)
    })
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-8 bg-white/50 border-t border-gray-200/50">
      <div className="relative w-full h-full">
        {intervals.map((date, i) => {
          const position = ((date.getTime() - minTime) / (maxTime - minTime)) * 100
          return (
            <div
              key={i}
              className="absolute top-0"
              style={{ left: `${position}%` }}
            >
              <div className="h-2 w-px bg-gray-400" />
              <span className="text-[10px] text-gray-500 whitespace-nowrap -translate-x-1/2">
                {format(date, isSameDay ? 'HH:mm' : 'MMM d')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}