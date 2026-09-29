<div align="center">
<h1>Sign Android Release</h1>
<p>A GitHub Action to sign an APK or AAB.</p>

[![Test](https://github.com/RockinChaos/sign-android/actions/workflows/test.yml/badge.svg)](https://github.com/RockinChaos/sign-android/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/RockinChaos/sign-android?style=flat-square)](https://github.com/RockinChaos/sign-android/blob/main/LICENSE)

</div>

---

This action will help you sign an Android `.apk` or `.aab` (Android App Bundle)
file for release.

## Usage

```yml
steps:
  - uses: RockinChaos/sign-android@main
    name: Sign app APK
    id: sign_app
    with:
      releaseDir: app/build/outputs/apk/release
      signingKey: ${{ secrets.ANDROID_SIGNING_KEY }}
      keyAlias: ${{ secrets.ANDROID_KEY_ALIAS }}
      keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
      keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

  # Upload your signed file if you want
  - uses: actions/upload-artifact@v4
    with:
      name: Signed APK
      path: ${{ steps.sign_app.outputs.signedFile }}
```

If you have multiple files to sign, use the newline-separated output directly
from a shell step. The example below assumes the workflow runs for a tag with an
existing GitHub release. Grant the workflow or job `contents: write` permission
so it can upload release assets. `--clobber` replaces assets with the same
names.

```yaml
steps:
  - uses: RockinChaos/sign-android@main
    id: sign_app
    with:
      releaseDir: app/build/outputs/apk/release
      signingKey: ${{ secrets.ANDROID_SIGNING_KEY }}
      keyAlias: ${{ secrets.ANDROID_KEY_ALIAS }}
      keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
      keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

  - name: Upload signed files
    env:
      GH_TOKEN: ${{ github.token }}
      RELEASE_TAG: ${{ github.ref_name }}
      SIGNED_FILES: ${{ steps.sign_app.outputs.signedFilesList }}
    shell: bash
    run: |
      mapfile -t files <<< "$SIGNED_FILES"
      gh release upload --clobber "$RELEASE_TAG" "${files[@]}"
```

For consumers that need individual paths, indexed outputs such as `signedFile0`
and `signedFile1` remain available.

## Inputs

You can set either inputs (in `with` section) or env (in `env` section).

| Key               | ENV                         | Usage                                                                  |
| ----------------- | --------------------------- | ---------------------------------------------------------------------- |
| releaseDir        | ANDROID_RELEASE_DIR         | **Required.** Directory containing the APK or AAB files to sign.       |
| signingKey        | ANDROID_SIGNING_KEY         | **Required.** Base64-encoded signing keystore.                         |
| keyAlias          | ANDROID_KEY_ALIAS           | **Required.** Alias of the signing key.                                |
| keyStorePassword  | ANDROID_KEYSTORE_PASSWORD   | **Required.** Keystore password.                                       |
| keyPassword       | ANDROID_KEY_PASSWORD        | **Optional.** Password for the signing key.                            |
| buildToolsVersion | ANDROID_BUILD_TOOLS_VERSION | **Optional.** Android build-tools version; auto-detected when omitted. |
| appName           | ANDROID_APP_NAME            | **Optional.** Name used when renaming signed files; defaults to `app`. |
| appVersion        | ANDROID_APP_VERSION         | **Optional.** Version included in renamed filenames.                   |
| appPrefix         | ANDROID_APP_PREFIX          | **Optional.** Prefix included in renamed filenames.                    |

If any naming input is set, signed files are renamed using the supplied parts:
`[prefix-]name[-version][-ABI].apk` (or `.aab`). The ABI suffix is added when
multiple files are signed and a recognized ABI appears in the source filename.
For example, `appPrefix: android`, `appName: Example`, and `appVersion: 1.2.3`
produce `android-Example-1.2.3-arm64-v8a.apk` for an arm64-v8a APK in a
multi-file release.

You can prepare your `signingKey` by running this command:

```sh
openssl base64 < some_signing_key.jks | tr -d '\n' > some_signing_key.jks.base64.txt
```

Then copy the text to `Settings - Secrets - Action` in your account or
organization. Treat the generated file as a secret and do not commit it.

## Outputs

| Key              | ENV                        | Usage                                                                                                                                                                          |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| signedFile       | ANDROID_SIGNED_FILE        | The signed release file path when exactly one file is signed; otherwise unset.                                                                                                 |
| signedFiles      | ANDROID_SIGNED_FILES       | The paths to the release files that have been signed with this action, separated by `:`. This legacy format is retained for compatibility.                                     |
| signedFilesList  | ANDROID_SIGNED_FILES_LIST  | The absolute signed release file paths separated by newlines, suitable for `mapfile` in Bash.                                                                                  |
| signedFilesJson  | ANDROID_SIGNED_FILES_JSON  | The absolute signed release file paths encoded as a JSON array.                                                                                                                |
| signedFileX      | ANDROID_SIGNED_FILE_X      | The paths to the release files that have been signed with this action. The `X` is index number starting from 0. Example: `signedFile0, signedFile1` or `ANDROID_SIGNED_FILE_0` |
| signedFilesCount | ANDROID_SIGNED_FILES_COUNT | The count of signed release files.                                                                                                                                             |

## BUGs & Issues

Feel free to
[open issues](https://github.com/RockinChaos/sign-android/issues/new).

## Contributions

PRs are welcome! Feel free to contribute.

## Credits

Based on [sign-android](https://github.com/NoCrypt/sign-android) by
[NoCrypt](https://github.com/NoCrypt), used under the
[MIT License](https://github.com/NoCrypt/sign-android/blob/main/LICENSE).

## LICENSE

[MIT](https://github.com/RockinChaos/sign-android/blob/main/LICENSE)
