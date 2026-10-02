import type { Duration, DurationUnitType } from '../utils/dayjs'
import dayjs from '../utils/dayjs'

interface TimeDisplayProps {
  currentTime?: number
  duration?: number
  type?: 'joint' | 'current' | 'duration'
  className?: string
}

function formatTime(time: number, durationType: DurationUnitType = 'seconds', format = 'mm:ss') {
  const parsedTime = dayjs.duration(time, durationType) as Duration
  if (format === 'mm:ss' && durationType === 'seconds' && time > 3600) {
    return parsedTime.format('HH:mm:ss')
  }
  return parsedTime.format(format)
}

export function TimeDisplay({ currentTime, duration, type = 'joint', className }: TimeDisplayProps) {
  const showDuration = !Number.isNaN(duration) && typeof duration !== 'undefined'

  return (
    <div className={`time${className ? ` ${className}` : ''}`}>
      {type === 'joint' && (
        <span>
          <span>{formatTime(currentTime ?? 0)}</span>
          {showDuration && (
            <span>
              {' '}
              /
              {formatTime(duration ?? 0)}
            </span>
          )}
        </span>
      )}
      {type === 'current' && (
        <span className="current">{formatTime(currentTime ?? 0)}</span>
      )}
      {type === 'duration' && showDuration && (
        <span className="duration">{formatTime(duration ?? 0)}</span>
      )}
    </div>
  )
}
