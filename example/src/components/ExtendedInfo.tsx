import { InfoButton } from './InfoButton'
import { LocationButton } from './LocationButton'
import { QueueButton } from './QueueButton'

interface AudioData {
  artist?: string
  title?: string
  image?: string
}

interface ExtendedInfoProps {
  audioData?: AudioData | null
  extendedInfoOpen?: boolean
  queueButton?: boolean
  locationButton?: boolean
  onExtendedClick?: (type: string) => void
}

export function ExtendedInfo({ audioData, extendedInfoOpen = false, queueButton = false, locationButton = false, onExtendedClick }: ExtendedInfoProps) {
  return (
    <div className="extended-info">
      <div className="extended">
        {audioData && (
          <div className="audio-data" onClick={() => onExtendedClick?.('info')}>
            <div className="container">
              {audioData.image && (
                <div className="image" style={{ backgroundImage: `url(${audioData.image})` }} />
              )}
              <div className="info">
                <p className="artist ellipsis">{audioData.artist}</p>
                <p className="title ellipsis">{audioData.title}</p>
              </div>
            </div>
            <InfoButton className="button" open={extendedInfoOpen} />
          </div>
        )}
        <div className="buttons">
          {queueButton && <QueueButton className="button" onClick={() => onExtendedClick?.('queue')} />}
          {locationButton && <LocationButton className="button" onClick={() => onExtendedClick?.('location')} />}
        </div>
      </div>
    </div>
  )
}
