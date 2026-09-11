# audio-player-react
React component for embedding audio files and streams

## Usage

```tsx
import { AudioFilePlayer, AudioStreamPlayer } from '@mxwllstn/audio-player-react'

/* audio file player */
<AudioFilePlayer src="https://test.com/file.mp3" />

/* audio stream player */
<AudioStreamPlayer src="https://test.com/stream" />
```

## Source Export

Copy the raw source into your project (shadcn-style):

```bash
npx @mxwllstn/audio-player-react --export ./src/components/audio-player
```

## Development Setup

```bash
# install dependencies
pnpm i

# serve with hot reload
pnpm run dev

# build for production
pnpm run build
```
