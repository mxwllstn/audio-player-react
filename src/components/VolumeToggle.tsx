import { useMemo, useState } from 'react'
import { VolumeButton } from './VolumeButton.js'

interface VolumeToggleProps {
  initVolume?: number
  showVolume?: boolean
  onSetGain: (vol: number) => void
  onMouseOver?: () => void
  onMouseLeave?: () => void
}

export function VolumeToggle({ initVolume = 100, showVolume = false, onSetGain, onMouseOver, onMouseLeave }: VolumeToggleProps) {
  const [volume, setVolume] = useState(Number(initVolume))
  const [prevVolume, setPrevVolume] = useState(100)

  const muted = useMemo(() => Number(volume) === 0, [volume])

  function handleSetGain() {
    onSetGain(Number(volume))
  }

  function toggleMute() {
    if (muted) {
      setVolume(Number(prevVolume))
      onSetGain(Number(prevVolume))
    } else {
      setPrevVolume(Number(volume))
      setVolume(0)
      onSetGain(0)
    }
  }

  return (
    <div className="volume" onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
      <VolumeButton volume={Number(volume)} className="button" onClick={toggleMute} />
      {showVolume && (
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            className="slider"
            onChange={(e) => {
              setVolume(Number(e.target.value))
            }}
            onInput={handleSetGain}
          />
        </div>
      )}
    </div>
  )
}
