import fs from 'fs'
import os from 'os'
import path from 'path'
import { findReleaseFiles } from '../src/io-utils'

describe('findReleaseFiles', () => {
  let releaseDir: string

  beforeEach(() => {
    releaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sign-android-test-'))
  })

  afterEach(() => {
    fs.rmSync(releaseDir, { force: true, recursive: true })
  })

  it('returns only APK and AAB files', () => {
    fs.writeFileSync(path.join(releaseDir, 'app.apk'), '')
    fs.writeFileSync(path.join(releaseDir, 'bundle.aab'), '')
    fs.writeFileSync(path.join(releaseDir, 'notes.txt'), '')
    fs.mkdirSync(path.join(releaseDir, 'nested.apk'))

    const releaseFiles = findReleaseFiles(releaseDir)

    expect(releaseFiles.map(file => file.name).sort()).toEqual([
      'app.apk',
      'bundle.aab'
    ])
  })

  it('returns an empty array when no release files exist', () => {
    fs.writeFileSync(path.join(releaseDir, 'notes.txt'), '')

    expect(findReleaseFiles(releaseDir)).toEqual([])
  })
})
