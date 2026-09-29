import * as core from '@actions/core'
import { signAabFile, signApkFile } from './signing'
import path from 'path'
import fs, { type Dirent } from 'fs'
import os from 'os'
import * as ioUtils from './io-utils'
import * as io from '@actions/io'
import { createSignedFilename } from './naming'

async function run(): Promise<void> {
  try {
    if (process.env.DEBUG_ACTION === 'true') {
      core.debug('DEBUG FLAG DETECTED, SHORTCUTTING ACTION.')
      return
    }

    const releaseDir = core.getInput('releaseDir')
      ? core.getInput('releaseDir')
      : process.env.ANDROID_RELEASE_DIR
    const signingKeyBase64 = core.getInput('signingKey')
      ? core.getInput('signingKey')
      : process.env.ANDROID_SIGNING_KEY
    const alias = core.getInput('keyAlias')
      ? core.getInput('keyAlias')
      : process.env.ANDROID_KEY_ALIAS
    const keyStorePassword = core.getInput('keyStorePassword')
      ? core.getInput('keyStorePassword')
      : process.env.ANDROID_KEYSTORE_PASSWORD
    const keyPassword = core.getInput('keyPassword')
      ? core.getInput('keyPassword')
      : process.env.ANDROID_KEY_PASSWORD
    const appName = core.getInput('appName')
      ? core.getInput('appName')
      : process.env.ANDROID_APP_NAME
    const appVersion = core.getInput('appVersion')
      ? core.getInput('appVersion')
      : process.env.ANDROID_APP_VERSION
    const appPrefix = core.getInput('appPrefix')
      ? core.getInput('appPrefix')
      : process.env.ANDROID_APP_PREFIX

    if (!releaseDir || !signingKeyBase64 || !alias || !keyStorePassword) {
      throw new Error('Missing required input(s).')
    }

    core.setSecret(signingKeyBase64)
    core.setSecret(keyStorePassword)
    if (keyPassword) {
      core.setSecret(keyPassword)
    }

    console.log(
      `Preparing to sign key @ ${releaseDir} with provided signing key`
    )

    const releaseFiles = ioUtils.findReleaseFiles(releaseDir)

    if (releaseFiles.length > 0) {
      const signingKeyDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'sign-android-')
      )
      const signingKey = path.join(signingKeyDirectory, 'signingKey.jks')

      try {
        saveSigningKey(signingKey, signingKeyBase64)

        let signedReleaseFiles = await signReleaseFiles(
          releaseFiles,
          releaseDir,
          signingKey,
          alias,
          keyStorePassword,
          keyPassword
        )

        if (appName || appVersion || appPrefix) {
          console.log('Renaming signed release files...')
          signedReleaseFiles = await renameSignedReleaseFiles(
            signedReleaseFiles,
            appName,
            appVersion,
            appPrefix
          )
        }

        setOutputVariables(signedReleaseFiles)

        console.log('Releases signed!')
      } finally {
        fs.rmSync(signingKeyDirectory, { force: true, recursive: true })
      }
    } else {
      throw new Error('No release files (.apk or .aab) could be found.')
    }
  } catch (error) {
    handleError(error)
  }
}
async function renameSignedReleaseFiles(
  signedReleaseFiles: string[],
  name = 'app',
  version?: string,
  prefix?: string
): Promise<string[]> {
  const renamedFiles: string[] = []

  for (const file of signedReleaseFiles) {
    const ext = path.extname(file)
    const dir = path.dirname(file)
    const newFilename = createSignedFilename(
      file,
      signedReleaseFiles.length > 1,
      name,
      version,
      prefix
    )
    const newFileStem = path.parse(newFilename).name
    let newFilePath = path.join(dir, newFilename)

    let duplicateIndex = 1
    while (fs.existsSync(newFilePath)) {
      console.error('File already exists:', newFilePath)
      newFilePath = path.join(dir, `${newFileStem}-${duplicateIndex++}${ext}`)
    }

    await io.mv(file, newFilePath)
    console.log(`Renamed ${file} to ${newFilePath}`)
    renamedFiles.push(newFilePath)
  }

  return renamedFiles
}

function saveSigningKey(
  signingKeyPath: string,
  signingKeyBase64: string
): void {
  try {
    fs.writeFileSync(signingKeyPath, signingKeyBase64, 'base64')
  } catch (error: unknown) {
    throw new Error(`Failed to save signing key: ${getErrorMessage(error)}`, {
      cause: error
    })
  }
}

async function signReleaseFiles(
  releaseFiles: Dirent[],
  releaseDir: string,
  signingKey: string,
  alias: string,
  keyStorePassword: string,
  keyPassword: string | undefined
): Promise<string[]> {
  const signedReleaseFiles: string[] = []

  for (const releaseFile of releaseFiles) {
    core.debug(`Found release to sign: ${releaseFile.name}`)
    const releaseFilePath = path.join(releaseDir, releaseFile.name)
    let signedReleaseFile: string

    console.log('Working on', releaseFile.name, '...')

    try {
      if (releaseFile.name.endsWith('.apk')) {
        signedReleaseFile = await signApkFile(
          releaseFilePath,
          signingKey,
          alias,
          keyStorePassword,
          keyPassword
        )
      } else if (releaseFile.name.endsWith('.aab')) {
        signedReleaseFile = await signAabFile(
          releaseFilePath,
          signingKey,
          alias,
          keyStorePassword,
          keyPassword
        )
      } else {
        throw new Error(`Unsupported file format: ${releaseFile.name}`)
      }
    } catch (error: unknown) {
      throw new Error(
        `Failed to sign file ${releaseFile.name}: ${getErrorMessage(error)}`,
        { cause: error }
      )
    }

    signedReleaseFiles.push(signedReleaseFile)
  }

  return signedReleaseFiles
}

function setOutputVariables(signedReleaseFiles: string[]): void {
  const absoluteSignedReleaseFiles = signedReleaseFiles.map(file =>
    path.resolve(file)
  )
  const signedFilesList = absoluteSignedReleaseFiles.join('\n')
  const signedFilesJson = JSON.stringify(absoluteSignedReleaseFiles)

  core.exportVariable('ANDROID_SIGNED_FILES', signedReleaseFiles.join(':'))
  core.setOutput('signedFiles', signedReleaseFiles.join(':'))
  core.exportVariable('ANDROID_SIGNED_FILES_LIST', signedFilesList)
  core.setOutput('signedFilesList', signedFilesList)
  core.exportVariable('ANDROID_SIGNED_FILES_JSON', signedFilesJson)
  core.setOutput('signedFilesJson', signedFilesJson)
  core.exportVariable(
    'ANDROID_SIGNED_FILES_COUNT',
    `${signedReleaseFiles.length}`
  )
  core.setOutput('signedFilesCount', `${signedReleaseFiles.length}`)

  signedReleaseFiles.forEach((signedReleaseFile, index) => {
    core.exportVariable(`ANDROID_SIGNED_FILE_${index}`, signedReleaseFile)
    core.setOutput(`signedFile${index}`, signedReleaseFile)
  })

  if (signedReleaseFiles.length === 1) {
    core.exportVariable('ANDROID_SIGNED_FILE', signedReleaseFiles[0])
    core.setOutput('signedFile', signedReleaseFiles[0])
  }
}

function handleError(error: unknown): void {
  if (error instanceof Error) {
    core.setFailed(error.message)
  } else {
    core.setFailed('An unknown error occurred.')
    console.error(error)
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

run()
