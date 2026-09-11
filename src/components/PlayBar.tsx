import { useCallback, useMemo, useRef, useState } from 'react'

interface PlayBarProps {
  currentTime?: number
  duration?: number
  fullWidth?: boolean
  audioPlayerContainerWidth?: number
  audioPlayerWidth?: number
  onSeek: (position: number) => void
  onSetSeekTime: (position: number | null) => void
}

function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) {
    return e.touches[0]?.clientX ?? 0
  }
  return e.clientX
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export function PlayBar({
  currentTime,
  duration,
  fullWidth = false,
  audioPlayerContainerWidth = 0,
  audioPlayerWidth = 0,
  onSeek,
  onSetSeekTime,
}: PlayBarProps) {
  const playbarRef = useRef<HTMLDivElement>(null)
  const [dragPosition, setDragPosition] = useState<number | null>(null)
  const [dragInit, setDragInit] = useState(false)

  const showDuration = !Number.isNaN(duration) && typeof duration !== 'undefined'

  const markerPosition = useMemo((): number => {
    const position = dragInit && dragPosition != null
      ? dragPosition
      : ((currentTime ?? 0) / (duration ?? 1)) * 100
    return position > 100 ? 100 : position < 0 ? 0 : position
  }, [dragInit, dragPosition, currentTime, duration])

  const audioPlayerOffset = useMemo(() => {
    if (!fullWidth) return 1
    const containerOffset = window.innerWidth - audioPlayerContainerWidth
    return ((audioPlayerContainerWidth - audioPlayerWidth + containerOffset - 32) / 2) + 2
  }, [fullWidth, audioPlayerContainerWidth, audioPlayerWidth])

  const drag = useCallback((event: MouseEvent | TouchEvent) => {
    if (!playbarRef.current) return
    const rect = playbarRef.current.getBoundingClientRect()
    const clientX = getClientX(event)
    const windowOffset = -audioPlayerOffset
    const pos = (clientX - rect.left + windowOffset) / rect.width
    setDragPosition(pos * 100)
    onSetSeekTime(clamp01(pos))
  }, [audioPlayerOffset, onSetSeekTime])

  const handleMouseup = useCallback((event: MouseEvent | TouchEvent) => {
    if (!playbarRef.current) return
    const rect = playbarRef.current.getBoundingClientRect()
    const clientX = getClientX(event)
    const windowOffset = -audioPlayerOffset
    const seekPosition = (clientX - rect.left + windowOffset) / rect.width

    setDragPosition(null)
    setDragInit(false)
    onSeek(clamp01(seekPosition))

    window.removeEventListener('mousemove', drag)
    window.removeEventListener('mouseup', handleMouseup as EventListener)
    window.removeEventListener('touchmove', drag as EventListener)
    window.removeEventListener('touchend', handleMouseup as EventListener)
  }, [audioPlayerOffset, drag, onSeek])

  const initDrag = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!playbarRef.current) return

    window.addEventListener('mousemove', drag)
    window.addEventListener('mouseup', handleMouseup as EventListener)
    window.addEventListener('touchmove', drag as EventListener)
    window.addEventListener('touchend', handleMouseup as EventListener)

    setDragInit(true)
    // perform first position update immediately
    drag(event.nativeEvent)
  }, [drag, handleMouseup])

  if (!showDuration) return null

  return (
    <div className="playbar-container" onMouseDown={initDrag} onTouchStart={initDrag}>
      <div ref={playbarRef} className="playbar">
        {duration ? (
          <div
            className={`elapsed${markerPosition >= 100 ? ' complete' : ''}`}
            style={{ width: `${markerPosition}%` }}
          />
        ) : null}
        <div className="marker" style={{ left: `${markerPosition}%` }} />
      </div>
    </div>
  )
}
