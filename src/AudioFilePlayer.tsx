import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { LoadingSpinner } from './components/LoadingSpinner.js'
import { NextButton } from './components/NextButton.js'
import { PlayBar } from './components/PlayBar.js'
import { PlayButton } from './components/PlayButton.js'
import { PreviousButton } from './components/PreviousButton.js'
import { ShuffleButton } from './components/ShuffleButton.js'
import { TimeDisplay } from './components/TimeDisplay.js'
import { VolumeToggle } from './components/VolumeToggle.js'
import './assets/css/main.css'
import './assets/css/components.css'

export interface AudioFilePlayerProps {
  src?: string
  idx?: number
  initDuration?: number
  playOnSeek?: boolean
  resetOnEnd?: boolean
  playOnMount?: boolean
  previousButton?: boolean
  nextButton?: boolean
  volumeButton?: boolean
  shuffleButton?: boolean
  spacebarToggle?: boolean
  masterVolume?: number
  rounded?: boolean
  hidden?: boolean
  useAudioContext?: boolean
  children?: React.ReactNode
  extendedTop?: React.ReactNode
  extendedBottom?: React.ReactNode
  onPrevious?: () => void
  onNext?: () => void
  onShuffleToggle?: (active: boolean) => void
  onTimeUpdate?: (data: { time: number, duration: number }) => void
  onSeekUpdate?: (time: number | null) => void
}

export interface AudioFilePlayerHandle {
  seek: (pos: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  status: string
  isPlaying: boolean
}

export const AudioFilePlayer = forwardRef<AudioFilePlayerHandle, AudioFilePlayerProps>((props, ref) => {
  const {
    src,
    initDuration = 0,
    playOnSeek = false,
    resetOnEnd = false,
    playOnMount = false,
    previousButton = false,
    nextButton = false,
    volumeButton = true,
    shuffleButton = true,
    spacebarToggle = false,
    masterVolume = 1,
    rounded = false,
    hidden = false,
    useAudioContext: useAudioContextProp = false,
    children,
    extendedTop,
    extendedBottom,
    onPrevious,
    onNext,
    onShuffleToggle,
    onTimeUpdate,
    onSeekUpdate,
  } = props

  const audioPlayerEl = useRef<HTMLAudioElement>(null)
  const audioPlayerRef = useRef<HTMLDivElement>(null)
  const audioPlayerContainerRef = useRef<HTMLDivElement>(null)

  const audioContextRef = useRef<AudioContext | undefined>(undefined)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const timeUpdateInterval = useRef<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState<boolean | undefined>(undefined)
  const [duration, setDurationState] = useState(0)
  const [currentTime, setCurrentTimeState] = useState(0)
  const [seekTime, setSeekTime] = useState<number | null>(null)
  const [showVolume, setShowVolume] = useState(false)
  const [volume, setVolume] = useState(100)
  const [shuffleActive, setShuffleActive] = useState(false)
  const [audioPlayerWidth, setAudioPlayerWidth] = useState<number | undefined>(undefined)
  const [audioPlayerContainerWidth, setAudioPlayerContainerWidth] = useState<number | undefined>(undefined)

  const initVolume = volume !== null ? Number(volume) : 100

  function getStatus(): string {
    if (loading) {
      return 'loading'
    }
    if (isPaused === undefined) {
      return 'stopped'
    }
    if (!isPaused) {
      return 'playing'
    }
    return 'paused'
  }

  const status = getStatus()
  const isPlaying = status === 'playing'
  const displayTime = seekTime ?? currentTime

  function emitTimeUpdate(time: number, dur: number) {
    onTimeUpdate?.({ time, duration: dur })
  }

  const setCurrentTime = useCallback((val: number) => {
    setCurrentTimeState(val)
  }, [])

  const setDuration = useCallback((val: number) => {
    setDurationState(val)
  }, [])

  function startTimeUpdate() {
    timeUpdateInterval.current = window.setInterval(() => {
      if (audioPlayerEl.current) {
        const t = audioPlayerEl.current.currentTime
        setCurrentTime(t)
        setDurationState((d) => {
          emitTimeUpdate(t, d)
          return d
        })
      }
    }, 25)
  }

  function stopTimeUpdate() {
    if (timeUpdateInterval.current !== null) {
      clearInterval(timeUpdateInterval.current)
      timeUpdateInterval.current = null
    }
  }

  function setGain(vol: number) {
    setVolume(Number(vol))
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (vol * masterVolume) / 100
    } else if (audioPlayerEl.current) {
      audioPlayerEl.current.volume = (vol * masterVolume) / 100
    }
  }

  function play() {
    audioPlayerEl.current?.play()
    startTimeUpdate()
    setIsPaused(audioPlayerEl.current?.paused)
  }

  function pause() {
    audioPlayerEl.current?.pause()
    stopTimeUpdate()
    setIsPaused(audioPlayerEl.current?.paused)
  }

  function toggleAudio() {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
      setGain(volume)
    }
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  function handleSeek(seekPosition: number) {
    setSeekTime(null)
    onSeekUpdate?.(null)
    if (audioPlayerEl.current) {
      audioPlayerEl.current.currentTime = duration * seekPosition
      setCurrentTime(audioPlayerEl.current.currentTime)
    }
    if (!isPlaying && playOnSeek) {
      toggleAudio()
    }
  }

  function handleSetSeekTime(seekPosition: number | null) {
    const t = seekPosition != null ? duration * seekPosition : null
    setSeekTime(t)
    onSeekUpdate?.(t)
  }

  function toggleShuffle() {
    setShuffleActive((prev) => {
      const next = !prev
      onShuffleToggle?.(next)
      return next
    })
  }

  // masterVolume changes
  useEffect(() => {
    setGain(volume)
  }, [masterVolume])

  // Audio player init on mount
  useEffect(() => {
    const el = audioPlayerEl.current
    if (!el) {
      return
    }

    setDuration(initDuration)
    el.crossOrigin = 'anonymous'
    setGain(initVolume)

    el.onloadstart = () => {
      setDuration(0)
    }

    el.onloadedmetadata = () => {
      setCurrentTime(0)
      const dur = el.duration
      setDuration(dur)
      emitTimeUpdate(0, dur)
      if (playOnMount) {
        play()
      }
      setLoading(false)
    }

    el.onended = () => {
      stopTimeUpdate()
      setCurrentTimeState(duration)
      setIsPaused(el.paused)
      if (resetOnEnd) {
        setCurrentTime(0)
      }
    }

    if (!useAudioContextProp) {
      setLoading(false)
    } else {
      // initAudioContext async
      ;(async () => {
        if (!src) {
          return
        }
        const res = await fetch(src)
        const data = await res.arrayBuffer()
        audioContextRef.current = new AudioContext()
        const decoded = await audioContextRef.current.decodeAudioData(data)
        setDuration(decoded.duration)
        sourceRef.current = audioContextRef.current.createMediaElementSource(el)
        gainNodeRef.current = audioContextRef.current.createGain()
        sourceRef.current.connect(gainNodeRef.current)
        gainNodeRef.current.connect(audioContextRef.current.destination)
      })()
    }

    // Spacebar toggle
    function handleKeyup(e: KeyboardEvent) {
      if (e.code === 'Space') {
        toggleAudio()
      }
    }
    if (spacebarToggle) {
      window.addEventListener('keyup', handleKeyup)
    }

    return () => {
      stopTimeUpdate()
      if (spacebarToggle) {
        window.removeEventListener('keyup', handleKeyup)
      }
    }
  }, [])

  // Resize observers
  useEffect(() => {
    const containerEl = audioPlayerContainerRef.current
    if (!containerEl) {
      return
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setAudioPlayerContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerEl)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const playerEl = audioPlayerRef.current
    if (!playerEl) {
      return
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setAudioPlayerWidth(entry.contentRect.width)
      }
    })
    observer.observe(playerEl)
    return () => observer.disconnect()
  }, [])

  useImperativeHandle(ref, () => ({
    seek: handleSeek,
    play,
    pause,
    toggle: toggleAudio,
    get status() {
      return getStatus()
    },
    get isPlaying() {
      return getStatus() === 'playing'
    },
  }))

  return (
    <div
      ref={audioPlayerContainerRef}
      className={`audio-player-container${rounded ? ' rounded' : ''}`}
      style={{ display: hidden ? 'none' : undefined }}
    >
      {extendedTop}
      <div ref={audioPlayerRef} className="audio-player">
        <div className="controls">
          {previousButton && (
            <PreviousButton className="button previous" onClick={onPrevious} />
          )}
          {loading
            ? (
                <LoadingSpinner className="button" />
              )
            : (
                <PlayButton isPlaying={isPlaying} className="button" onClick={toggleAudio} />
              )}
          {nextButton && (
            <NextButton className="button next" onClick={onNext} />
          )}
          <TimeDisplay type="current" className="current" currentTime={displayTime} />
          <PlayBar
            audioPlayerContainerWidth={audioPlayerContainerWidth}
            audioPlayerWidth={audioPlayerWidth}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            onSetSeekTime={handleSetSeekTime}
          />
          <TimeDisplay type="duration" className="duration" duration={duration} />
          {shuffleButton && (
            <ShuffleButton
              className={`button shuffle${shuffleActive ? ' active' : ''}`}
              onClick={toggleShuffle}
            />
          )}
          {volumeButton && (
            <VolumeToggle
              initVolume={initVolume}
              showVolume={showVolume}
              onMouseOver={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
              onSetGain={setGain}
            />
          )}
        </div>
        {children}
      </div>
      {extendedBottom}
      <audio ref={audioPlayerEl} src={src} />
    </div>
  )
})
