import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AntennaIcon } from './components/AntennaIcon.js'
import { PlayButton } from './components/PlayButton.js'
import { VolumeBar } from './components/VolumeBar.js'
import { VolumeToggle } from './components/VolumeToggle.js'
import './assets/css/main.css'
import './assets/css/components.css'

export interface AudioStreamPlayerProps {
  src?: string | null
  idx?: number
  volumeBar?: boolean
  volumeButton?: boolean
  masterVolume?: number
  loading?: boolean
  dataTracking?: string | string[] | null
  rounded?: boolean
  hidden?: boolean
  title?: string
  children?: React.ReactNode
  onStreamEnded?: () => void
  onSpectralData?: (data: { freq: Uint8Array, time: Uint8Array }, idx?: number) => void
  onAmplitudeData?: (data: { avg: number, peak: number } | null, idx?: number) => void
  onLoading?: () => void
  onLoaded?: () => void
  onError?: (error: string, idx?: number) => void
  onConnected?: () => void
  onToggle?: () => void
}

export interface AudioStreamPlayerHandle {
  play: () => void
  pause: () => void
  toggle: () => void
  status: string
}

export const AudioStreamPlayer = forwardRef<AudioStreamPlayerHandle, AudioStreamPlayerProps>((props, ref) => {
  const {
    src,
    idx,
    volumeBar = false,
    volumeButton = true,
    masterVolume = 1,
    loading: loadingProp = false,
    dataTracking = null,
    rounded = false,
    hidden = false,
    title,
    children,
    onStreamEnded,
    onSpectralData,
    onAmplitudeData,
    onLoaded,
    onError,
    onConnected,
    onToggle,
  } = props

  const audioPlayerEl = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const trackingIntervalsRef = useRef<number[]>([])

  const [streamLoading, setStreamLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState<boolean | undefined>(undefined)
  const [showVolume, setShowVolume] = useState(false)
  const [volume, setVolume] = useState(100)
  const [canPlayThrough, setCanPlayThrough] = useState<boolean | undefined>(undefined)

  const isLoading = loadingProp
  const isConnecting = !isLoading && canPlayThrough === false

  function getStatus(): string {
    if (error) {
      return error || 'error'
    }
    if (isConnecting) {
      return 'connecting'
    }
    if (isLoading) {
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
  const initVolume = volume !== null ? Number(volume) : 100

  function setLoadingState(state: boolean) {
    setStreamLoading(state)
    if (!state) {
      onLoaded?.()
    }
  }

  function setVolumeValue(vol: number) {
    setVolume(Number(vol))
    if (audioPlayerEl.current) {
      audioPlayerEl.current.volume = (Number(vol) * masterVolume) / 100
    }
  }

  function setGain(vol: number) {
    setVolumeValue(vol)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (Number(vol) * masterVolume) / 100
    }
  }

  function getAmplitudeData() {
    if (!analyserRef.current) {
      return null
    }
    analyserRef.current.fftSize = 2048 * 4
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const amplitudeData = new Float32Array(dataArray)
    analyserRef.current.getFloatTimeDomainData(amplitudeData)
    const sumOfSquares = amplitudeData.reduce((acc, v) => acc + v ** 2, 0)
    const avgPowerDecibels = 10 * Math.log10(sumOfSquares / amplitudeData.length)
    const peakInstantaneousPower = amplitudeData.reduce((acc, v) => Math.max(v ** 2, acc), 0)
    const peakInstantaneousPowerDecibels = 10 * Math.log10(peakInstantaneousPower)
    return { avg: avgPowerDecibels, peak: peakInstantaneousPowerDecibels }
  }

  function getSpectralData() {
    if (!analyserRef.current) {
      return null
    }
    analyserRef.current.fftSize = 2048
    const bufferLength = analyserRef.current.frequencyBinCount
    const freqByteData = new Uint8Array(bufferLength)
    const timeByteData = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(freqByteData)
    analyserRef.current.getByteTimeDomainData(timeByteData)
    return { freq: freqByteData, time: timeByteData }
  }

  function trackData(type: string | string[]) {
    if (Array.isArray(type) ? type.includes('amplitude') : type === 'amplitude') {
      const id = window.setInterval(() => {
        if (getStatus() === 'playing') {
          const data = getAmplitudeData()
          if (data && Number.isFinite(data.avg)) {
            onAmplitudeData?.(data, idx)
          } else {
            onAmplitudeData?.(null, idx)
          }
        }
      }, 50)
      trackingIntervalsRef.current.push(id)
    }
    if (Array.isArray(type) ? type.includes('spectral') : type === 'spectral') {
      const id = window.setInterval(() => {
        if (getStatus() === 'playing') {
          const data = getSpectralData()
          if (data) {
            onSpectralData?.(data, idx)
          }
        }
      }, 100)
      trackingIntervalsRef.current.push(id)
    }
  }

  function initAudioContext() {
    if (!audioPlayerEl.current) {
      return
    }
    audioContextRef.current = new AudioContext()
    sourceRef.current = audioContextRef.current.createMediaElementSource(audioPlayerEl.current)
    gainNodeRef.current = audioContextRef.current.createGain()
    sourceRef.current.connect(gainNodeRef.current)
    gainNodeRef.current.connect(audioContextRef.current.destination)
    analyserRef.current = audioContextRef.current.createAnalyser()
    analyserRef.current.connect(audioContextRef.current.destination)
    if (sourceRef.current && analyserRef.current) {
      sourceRef.current.connect(analyserRef.current)
    }
    if (dataTracking) {
      if ((Array.isArray(dataTracking) ? dataTracking.includes('amplitude') : dataTracking === 'amplitude')) {
        trackData('amplitude')
      }
      if ((Array.isArray(dataTracking) ? dataTracking.includes('spectral') : dataTracking === 'spectral')) {
        trackData('spectral')
      }
    }
  }

  function resetDataTracking() {
    if (!dataTracking) {
      return
    }
    if ((Array.isArray(dataTracking) ? dataTracking.includes('amplitude') : dataTracking === 'amplitude')) {
      onAmplitudeData?.(null, idx)
    }
  }

  function playAudio() {
    if (!audioPlayerEl.current) {
      return
    }
    audioPlayerEl.current.src = src ?? ''
    audioPlayerEl.current.load()
    audioPlayerEl.current.play()
  }

  function start() {
    setCanPlayThrough(false)
    audioPlayerEl.current?.load()
    playAudio()
  }

  function pauseAudio() {
    audioPlayerEl.current?.pause()
  }

  async function toggleAudio() {
    if (!audioContextRef.current) {
      initAudioContext()
    }
    if (canPlayThrough === undefined) {
      setCanPlayThrough(false)
    }
    if (isPlaying) {
      pauseAudio()
    } else {
      start()
    }
    if (dataTracking) {
      resetDataTracking()
    }
    setIsPaused(audioPlayerEl.current?.paused)
    onToggle?.()
  }

  // masterVolume watch
  useEffect(() => {
    setGain(volume)
  }, [masterVolume])

  useEffect(() => {
    const el = audioPlayerEl.current
    if (!el) {
      return
    }

    async function initStream() {
      try {
        if (!src) {
          setError('Select an audio source')
          setLoadingState(false)
          return
        }
        setError(null)
        setLoadingState(true)
        const request = new XMLHttpRequest()
        request.open('GET', src)
        request.responseType = 'arraybuffer'
        request.send()
        request.onerror = () => {
          setLoadingState(false)
          const msg = 'Stream not found'
          setError(msg)
          onError?.(msg, idx)
        }
        request.onprogress = () => {
          if (request.status === 200) {
            request.abort()
          } else {
            const msg = 'Stream not found'
            setError(msg)
            onError?.(msg, idx)
          }
          setLoadingState(false)
        }
      } catch (e: unknown) {
        setLoadingState(false)
        if (e instanceof Error) {
          console.error(e.message)
        }
      }
    }

    function initAudioPlayer() {
      if (!el) {
        return
      }
      el.crossOrigin = 'anonymous'
      setGain(initVolume)

      function handleCanPlayThrough() {
        setCanPlayThrough(true)
        onConnected?.()
        setGain(initVolume)
      }

      el.addEventListener('canplaythrough', handleCanPlayThrough)
      el.addEventListener('canplay', handleCanPlayThrough)

      el.onended = () => {
        onStreamEnded?.()
        setIsPaused(el.paused)
      }
    }

    initStream().then(() => {
      initAudioPlayer()
      if (volumeBar) {
        setVolumeValue(50)
      }
    })

    return () => {
      trackingIntervalsRef.current.forEach(id => clearInterval(id))
    }
  }, [])

  useImperativeHandle(ref, () => ({
    play: playAudio,
    pause: pauseAudio,
    toggle: toggleAudio,
    get status() {
      return getStatus()
    },
  }))

  return (
    <div
      className={`audio-player-container${rounded ? ' rounded' : ''}`}
      style={{ display: hidden ? 'none' : undefined }}
    >
      {(streamLoading || error) && (
        <div className="audio-player">
          <AntennaIcon className="button" />
          {streamLoading && <div className="loading">Loading...</div>}
          {error && !streamLoading && <div className="error">{error}</div>}
        </div>
      )}
      {!streamLoading && !error && src && (
        <div className="audio-player">
          {isConnecting
            ? (
                <AntennaIcon className="button" />
              )
            : (
                <PlayButton isPlaying={isPlaying} className="button" onClick={toggleAudio} />
              )}
          {volumeBar && <VolumeBar volume={volume} onSetGain={setGain} />}
          {!volumeBar && volumeButton && (
            <VolumeToggle
              initVolume={initVolume}
              showVolume={showVolume}
              onMouseOver={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
              onSetGain={setGain}
            />
          )}
          {title && <div className="title">{title}</div>}
          {children}
        </div>
      )}
      <audio ref={audioPlayerEl} src={src ?? undefined} />
    </div>
  )
})
