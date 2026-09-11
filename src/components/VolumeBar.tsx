import { useEffect, useMemo, useRef, useState } from 'react'

interface VolumeBarProps {
  volume: number
  onSetGain: (vol: number) => void
}

export function VolumeBar({ volume, onSetGain }: VolumeBarProps) {
  const volumebarRef = useRef<HTMLDivElement>(null)
  const [dragPosition, setDragPosition] = useState<number | null>(null)
  const [gainPosition, setGainPositionState] = useState<number | null>(null)
  const [dragInit, setDragInit] = useState(false)

  const markerPosition = useMemo((): number => {
    const position = dragInit && dragPosition != null ? dragPosition : volume
    return position > 100 ? 100 : position < 0 ? 0 : position
  }, [dragInit, dragPosition, volume])

  function setGainPosition(position: number) {
    if (gainPosition !== position) {
      setGainPositionState(position)
      onSetGain(position)
    }
  }

  function initDrag(event: React.MouseEvent | React.TouchEvent) {
    if (volumebarRef.current) {
      const el = volumebarRef.current
      const parentEl = el.offsetParent as HTMLElement | null
      const parentOffset = parentEl ? parentEl.offsetLeft : 0
      const position = ((event.nativeEvent instanceof MouseEvent ? event.nativeEvent.pageX : (event.nativeEvent as TouchEvent).touches[0].pageX) - (parentOffset + el.offsetLeft)) / el.offsetWidth * 100
      const clamped = position > 100 ? 100 : position < 0 ? 0 : position
      setDragPosition(clamped)
      setGainPosition(clamped)
      setDragInit(true)
    }
  }

  useEffect(() => {
    function drag(event: MouseEvent | TouchEvent) {
      if (volumebarRef.current && dragInit) {
        const el = volumebarRef.current
        const parentEl = el.offsetParent as HTMLElement | null
        const parentOffset = parentEl ? parentEl.offsetLeft : 0
        const pageX = event instanceof MouseEvent ? event.pageX : (event as TouchEvent).touches[0].pageX
        const position = (pageX - (parentOffset + el.offsetLeft)) / el.offsetWidth * 100
        const clamped = position > 100 ? 100 : position < 0 ? 0 : position
        setDragPosition(clamped)
        onSetGain(clamped)
      }
    }

    function handleMouseup() {
      if (dragInit) {
        setDragPosition(null)
        setDragInit(false)
      }
    }

    window.addEventListener('mousemove', drag)
    window.addEventListener('mouseup', handleMouseup)
    window.addEventListener('touchmove', drag)
    window.addEventListener('touchend', handleMouseup)

    return () => {
      window.removeEventListener('mousemove', drag)
      window.removeEventListener('mouseup', handleMouseup)
      window.removeEventListener('touchmove', drag)
      window.removeEventListener('touchend', handleMouseup)
    }
  }, [dragInit, onSetGain])

  return (
    <div className="volumebar-container" onMouseDown={initDrag} onTouchStart={initDrag}>
      <div ref={volumebarRef} className="volumebar">
        <div className="elapsed" style={{ width: `${markerPosition}%` }} />
        <div className="marker" style={{ left: `${markerPosition}%` }} />
      </div>
    </div>
  )
}
