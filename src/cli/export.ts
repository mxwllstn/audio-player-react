import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'
import AdmZip from 'adm-zip'

const packageName = 'audio-player-react'
const releaseDataUrl = 'https://api.github.com/repos/mxwllstn/audio-player-react/releases/latest'

async function getReleaseUrl() {
  const res = await fetch(releaseDataUrl)
  const data = await res.json() as { assets: { name: string, browser_download_url: string }[] }
  const release = data.assets.find(asset => asset.name.includes(packageName))
  return release!.browser_download_url
}

function unzip(zipPath: string) {
  const zip = new AdmZip(zipPath)
  const destination = path.join(path.dirname(zipPath), packageName)
  zip.extractAllTo(destination)
  console.log(`Output: Package extracted to ${destination}`)
}

async function downloadFile(url: string, outputDir: string, filename?: string) {
  const res = await fetch(url)
  try {
    if (res.body) {
      filename = filename || url.split('/').pop() || ''
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir)
      }
      const destination = path.resolve(path.join(outputDir, filename))
      const fileStream = fs.createWriteStream(destination, { flags: 'w' })
      await finished(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]).pipe(fileStream))
      return destination
    }
  } catch (err) {
    console.log('Error ', err)
  }
}

export async function runExport(outputDir: string) {
  const releaseUrl = await getReleaseUrl()
  const zipPath = await downloadFile(releaseUrl, outputDir)
  if (zipPath) {
    unzip(zipPath)
    fs.unlinkSync(zipPath)
  }
}
