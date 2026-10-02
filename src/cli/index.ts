#!/usr/bin/env node
import { runExport } from './export'

const args = process.argv.slice(2)
const job = args[0]
if (!job || job !== '--export') {
  console.error('Usage: npx @mxwllstn/audio-player-react --export <abs-output-directory>')
  process.exit(1)
}
const outputDirArg = args[1]
if (!outputDirArg) {
  console.error('Usage: npx @mxwllstn/audio-player-react --export <abs-output-directory>')
  process.exit(1)
}

runExport(outputDirArg)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
