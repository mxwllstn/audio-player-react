#!/usr/bin/env node
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'
import packageJson from '../../package.json' with { type: 'json' }

const srcPath = 'src'
const outputPath = path.join('./exports')

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath)
}

const zip = new AdmZip()
const output = path.join(outputPath, 'audio-player-react.zip')

await zip.addLocalFolderPromise(srcPath, {
  zipPath: 'src',
  filter: (item: string) => !item.includes('cli'),
})

const { packageManager: _pm, exports: _exports, main: _main, module: _mod, bin: _bin, files: _files, scripts: _scripts, ...config } = packageJson as Record<string, unknown>
zip.addFile('package.json', Buffer.from(JSON.stringify(config, null, 2), 'utf8'))

zip.writeZip(output)
console.log(`Output: ${output}`)
