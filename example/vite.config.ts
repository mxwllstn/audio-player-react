import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mxwllstn/audio-player-react': path.resolve(__dirname, '../src'),
    },
  },
})
