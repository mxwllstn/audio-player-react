import { useRef, useState } from 'react'
import { AudioFilePlayer, AudioStreamPlayer } from '@mxwllstn/audio-player-react'
import type { AudioFilePlayerHandle, AudioStreamPlayerHandle } from '@mxwllstn/audio-player-react'
import { ExtendedInfo } from './components/ExtendedInfo'
import './App.css'

const audios = [
  {
    src: '/audio/1.mp3',
    data: { artist: 'Max Stein', title: 'Parc Lafontaine 2023.08.09', image: '/image/1.jpg' },
  },
  {
    src: '/audio/2.mp3',
    data: { artist: 'Max Stein', title: 'Echo Park Lake 2023.03.01' },
  },
  {
    src: '/audio/3.mp3',
    data: { artist: 'Max Stein', title: 'Parc Jarry 2022.05.12' },
  },
  { src: 'https://stream.radiovestige.com/AcousticMirror', stream: true },
  { src: 'https://stream.sonicscape.land/audiohijack4', stream: true, volumeBar: true, title: 'Test title' },
  { src: 'https://stream.sonicscape.land/audiohijack4', stream: true, dataTracking: 'amplitude' },
  { src: 'https://stream.sonicscape.land/audiohijack4', stream: true, hidden: true },
] as {
  src: string
  stream?: boolean
  hidden?: boolean
  data?: { artist: string; title: string; image?: string }
  dataTracking?: string
  volumeBar?: boolean
  title?: string
}[]

const mapNumRange = (num: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin

export default function App() {
  const audioPlayerRef = useRef<AudioFilePlayerHandle>(null)
  const audioPlayerHiddenRef = useRef<AudioFilePlayerHandle>(null)
  const streamPlayerRefs = useRef<(AudioStreamPlayerHandle | null)[]>([])
  const filePlayerRefs = useRef<(AudioFilePlayerHandle | null)[]>([])

  const [audioFile, setAudioFile] = useState(audios[0]?.src)
  const [audioData, setAudioData] = useState(audios[0]?.data)
  const [showExtended, setShowExtended] = useState(false)
  const [dbOpacity, setDbOpacity] = useState(0)

  function changeTrack(idx: number) {
    setAudioFile(audios[idx]?.src)
    setAudioData(audios[idx]?.data)
  }

  function toggleAudio(idx?: number) {
    if (idx !== undefined) {
      const audio = audios[idx]
      if (audio?.stream) {
        streamPlayerRefs.current[idx]?.toggle()
      } else {
        filePlayerRefs.current[idx]?.toggle()
      }
    } else {
      audioPlayerRef.current?.toggle()
    }
  }

  function handleSeek(idx: number, pos: number) {
    filePlayerRefs.current[idx]?.seek(pos)
  }

  function onAmplitudeData(data: { avg: number; peak: number } | null) {
    const { avg } = data || {}
    const val = avg ? mapNumRange(avg, -50, 0, 0, 100) : 0
    setDbOpacity(val)
  }

  return (
    <div className="content">
      <div className="container">
        <h4>multiple audio example</h4>
        {audios.map((audio, idx) => {
          if (audio.stream) {
            return (
              <div key={idx}>
                <AudioStreamPlayer
                  ref={el => { streamPlayerRefs.current[idx] = el as AudioStreamPlayerHandle | null }}
                  src={audio.src}
                  idx={idx}
                  volumeBar={audio.volumeBar}
                  dataTracking={audio.dataTracking}
                  hidden={audio.hidden}
                  masterVolume={0.75}
                  title={audio.title}
                  onAmplitudeData={onAmplitudeData}
                >
                  {audio.dataTracking && (
                    <div
                      className="amplitude data-tracking"
                      style={{
                        background: `rgb(199 0 57 / ${dbOpacity}%)`,
                        transform: `scale(${(dbOpacity / 100) * 2})`,
                      }}
                    />
                  )}
                </AudioStreamPlayer>
                <button onClick={() => toggleAudio(idx)}>
                  toggle
                </button>
              </div>
            )
          } else {
            return (
              <div key={idx}>
                <AudioFilePlayer
                  ref={el => { filePlayerRefs.current[idx] = el as AudioFilePlayerHandle | null }}
                  src={audio.src}
                  idx={idx}
                  hidden={audio.hidden}
                  masterVolume={0.75}
                />
                <button onClick={() => toggleAudio(idx)}>toggle</button>
                {idx === 1 && (
                  <button onClick={() => handleSeek(idx, 0.5)}>seek</button>
                )}
              </div>
            )
          }
        })}
      </div>

      <div className="container">
        <h4>single audio example</h4>
        <AudioFilePlayer
          ref={audioPlayerRef}
          src={audioFile}
          nextButton
          previousButton
          playOnMount
          shuffleButton
          spacebarToggle
          rounded
          extendedTop={showExtended ? <div>test</div> : undefined}
          onNext={() => changeTrack(2)}
          onPrevious={() => changeTrack(1)}
          onShuffleToggle={active => console.log('shuffle', active)}
        >
          <ExtendedInfo
            audioData={audioData}
            extendedInfoOpen={showExtended}
            locationButton
            onExtendedClick={() => setShowExtended(v => !v)}
          />
        </AudioFilePlayer>
        <button onClick={() => toggleAudio()}>
          toggle
        </button>
        <button onClick={() => changeTrack(0)}>track 1</button>
        <button onClick={() => changeTrack(1)}>track 2</button>
        <button onClick={() => changeTrack(2)}>track 3</button>
      </div>

      <div className="container">
        <h4>hidden audio example</h4>
        <AudioFilePlayer ref={audioPlayerHiddenRef} hidden src={audios[0]?.src} />
        <button onClick={() => audioPlayerHiddenRef.current?.toggle()}>toggle hidden</button>
      </div>
    </div>
  )
}
