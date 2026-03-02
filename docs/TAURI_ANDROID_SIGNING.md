# Tauri Android Signed APK Build

This guide builds a signed Android APK that can be installed on physical devices.

## 1) Prerequisites

- Android SDK with Build Tools (contains `zipalign` and `apksigner`)
- Java `keytool`
- Rust + Tauri Android dependencies already set up

## 2) Generate keystore (one-time)

```bash
mkdir -p "$HOME/.android"
keytool -genkeypair \
  -v \
  -keystore "$HOME/.android/vfdashboard-upload.jks" \
  -alias vfdashboard \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "CHANGE_ME_STRONG_PASSWORD" \
  -keypass "CHANGE_ME_STRONG_PASSWORD" \
  -dname "CN=VF9 Club, OU=Community, O=VF9 Club, L=HCM, ST=HCM, C=VN"
```

## 3) Build signed APK

```bash
ANDROID_KEYSTORE_PATH="$HOME/.android/vfdashboard-upload.jks" \
ANDROID_KEY_ALIAS="vfdashboard" \
ANDROID_KEYSTORE_PASSWORD="CHANGE_ME_STRONG_PASSWORD" \
ANDROID_KEY_PASSWORD="CHANGE_ME_STRONG_PASSWORD" \
npm run tauri:build:android:signed
```

Default target is `aarch64`. Override if needed:

```bash
TAURI_ANDROID_TARGET="aarch64" npm run tauri:build:android:signed
```

## 4) Output artifact

Signed APK is generated at:

`src-tauri/gen/android/app/build/outputs/apk/universal/release/VFDashboard_<version>_aarch64_signed.apk`

## 5) Verify and install

```bash
"$HOME/Library/Android/sdk/build-tools/36.1.0/apksigner" verify --verbose --print-certs \
  "src-tauri/gen/android/app/build/outputs/apk/universal/release/VFDashboard_<version>_aarch64_signed.apk"

adb install -r "src-tauri/gen/android/app/build/outputs/apk/universal/release/VFDashboard_<version>_aarch64_signed.apk"
```

If you see `INSTALL_FAILED_VERSION_DOWNGRADE`, uninstall old app first:

```bash
adb uninstall club.vf9.dashboard
adb install "src-tauri/gen/android/app/build/outputs/apk/universal/release/VFDashboard_<version>_aarch64_signed.apk"
```
