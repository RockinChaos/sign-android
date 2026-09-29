import { createSignedFilename } from '../src/naming'

describe('createSignedFilename', () => {
  it.each([
    ['app-arm64-v8a-signed.apk', 'android-Example-1.2.3-arm64-v8a.apk'],
    ['app-armeabi-v7a-signed.apk', 'android-Example-1.2.3-armeabi-v7a.apk'],
    ['app-x86-signed.apk', 'android-Example-1.2.3-x86.apk'],
    ['app-x86_64-signed.apk', 'android-Example-1.2.3-x86_64.apk']
  ])('preserves the ABI in %s', (file, expected) => {
    expect(
      createSignedFilename(file, true, 'Example', '1.2.3', 'android')
    ).toBe(expected)
  })

  it('omits an architecture suffix for a single file', () => {
    expect(
      createSignedFilename(
        'app-arm64-v8a-signed.apk',
        false,
        'Example',
        '1.2.3',
        'android'
      )
    ).toBe('android-Example-1.2.3.apk')
  })
})
