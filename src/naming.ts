import path from 'path'

const architectures = ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86', 'universal']

export function createSignedFilename(
  file: string,
  multipleFiles: boolean,
  name = 'app',
  version?: string,
  prefix?: string
): string {
  const extension = path.extname(file)
  const basename = path.basename(file)
  const architecture = architectures.find(candidate =>
    basename.includes(candidate)
  )

  const parts = [prefix, name, version]
  if (multipleFiles && architecture) {
    parts.push(architecture)
  }

  return `${parts.filter(Boolean).join('-')}${extension}`
}
