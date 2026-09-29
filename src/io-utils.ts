import type { Dirent } from 'fs'
import fs from 'fs'

export function findReleaseFiles(releaseDir: string): Dirent[] {
  const releaseFiles = fs
    .readdirSync(releaseDir, { withFileTypes: true })
    .filter(item => !item.isDirectory())
    .filter(item => item.name.endsWith('.apk') || item.name.endsWith('.aab'))

  console.log(`Found ${releaseFiles.length} release files.`)

  return releaseFiles
}
