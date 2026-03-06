# Build Guide for Essences App - Android & iOS Distribution

## Prerequisites

Before building, ensure you have:

1. **EAS CLI Installed**
   ```bash
   npm install -g eas-cli
   ```

2. **Logged into EAS**
   ```bash
   eas login
   ```

3. **Registered App (if not already done)**
   ```bash
   eas build:configure
   ```

## iOS Distribution Build

### Prerequisites
- Apple Developer Account ($99/year)
- Valid Apple ID
- Generated App ID and Provisioning Profiles in Apple Developer Portal

### Steps

1. **Create Apple App ID and Provisioning Profiles**
   ```bash
   eas credentials
   ```
   Select iOS → production and follow prompts to create/select certificates

2. **Build for App Store**
   ```bash
   eas build --platform ios --auto-submit
   ```
   Or without auto-submit:
   ```bash
   eas build --platform ios
   ```

3. **Monitor Build**
   - EAS will build your app in the cloud
   - Check status: `eas build:list`
   - Download IPA when complete

4. **Submit to App Store**
   - Update `eas.json` with your Apple ID, App ID, and Team ID
   - Run: `eas submit --platform ios --latest`
   - Or submit manually using Xcode/Transporter

### Build with Internal Testing (Faster)
```bash
eas build --platform ios --profile preview
```

## Android Distribution Build

### Prerequisites
- Google Play Developer Account ($25 one-time fee)
- Keystore file (will be created by EAS) or existing keystore

### Steps

1. **Build for Google Play**
   ```bash
   eas build --platform android --auto-submit
   ```
   Or manual:
   ```bash
   eas build --platform android
   ```

2. **Configure Keystore Credentials**
   ```bash
   eas credentials
   ```
   Select Android → production and let EAS create/manage keystore

3. **Create Service Account (for auto-submit)**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create Service Account
   - Generate JSON key file
   - Save to: `./google-service-account.json`
   - Update `eas.json` with path

4. **Submit to Google Play**
   ```bash
   eas submit --platform android --latest
   ```
   Or submit using Google Play Console manually

## Build Both Platforms at Once

```bash
eas build --platform all
```

## Build Commands Reference

### Local Build (without EAS)

**iOS:**
```bash
eas build --platform ios --local
```

**Android:**
```bash
eas build --platform android --local
```

### Preview Builds (Internal Distribution)

```bash
# iOS
eas build --platform ios --profile preview

# Android  
eas build --platform android --profile preview
```

### Production Builds (Store Distribution)

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

## Configuration Files

### eas.json (Already Updated)
- Development: Internal testing with dev client
- Preview: Internal distribution via links
- Production: Store submission ready

### app.json Key Settings
```json
{
  "ios": {
    "bundleIdentifier": "com.caridadrivera.essences"
  },
  "android": {
    "package": "com.caridadrivera.essences"
  }
}
```

## Version Management

App version is managed remotely via EAS (`appVersionSource: "remote"`). 

To update version before build:
```bash
# Update version in eas.json or let autoIncrement handle it
eas build --platform all
```

## Testing Before Submission

1. **Test on Emulator/Simulator**
   ```bash
   npx expo start
   # Press i for iOS simulator or a for Android emulator
   ```

2. **Test on Real Device via Preview**
   ```bash
   eas build --platform ios --profile preview
   eas build --platform android --profile preview
   ```

3. **Test Production Build Locally**
   ```bash
   eas build --platform ios --local
   eas build --platform android --local
   ```

## Submission Checklist

### Before iOS Submission
- [ ] App name finalized
- [ ] Description and keywords set in App Store Connect
- [ ] Privacy policy URL configured
- [ ] Ratings/content warnings completed
- [ ] Screenshots and preview videos added
- [ ] Release notes prepared
- [ ] Build uploaded and processed
- [ ] App review information filled

### Before Android Submission
- [ ] App title and description finalized
- [ ] Graphics (icon, feature graphic, screenshots) uploaded
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL configured
- [ ] Build uploaded (APK/AAB)
- [ ] Store listing marked as complete

## Troubleshooting

### Build Fails
```bash
# View detailed logs
eas build:view <build-id>

# Clean and rebuild
eas build --platform android --clear-cache
```

### After Updates
```bash
# Update version
npm run patch  # or eas build with autoIncrement

# Rebuild
eas build --platform all
```

### Credentials Issues
```bash
# Reset credentials
eas credentials delete --platform ios
eas credentials delete --platform android

# Reconfigure
eas credentials
```

## Important Notes

- **iOS SDK Requirement (ITMS-90725)**: Starting April 28, 2026, Apple requires all iOS/iPadOS apps to be built with the **iOS 26 SDK (Xcode 26+)**. The `eas.json` production profile uses `"image": "macos-sequoia-15.6-xcode-26.2"` to satisfy this requirement.
- **First iOS Build**: Apple review process takes 24-48 hours
- **First Android Build**: Google review takes 2-3 hours
- **Version Numbers**: Must increment for each submission
- **Bundle IDs**: Cannot be changed after first submission
- **Passwords**: Store securely, EAS manages certificates

## Resources

- [EAS Build Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Expo Documentation](https://docs.expo.dev/)

## Quick Start Commands

```bash
# First time setup
eas login
eas build:configure

# Create credentials
eas credentials

# Build for distribution
eas build --platform all

# Submit to stores
eas submit --platform all --latest

# Check status
eas build:list
eas submit:list
```

---

**Last Updated**: March 6, 2026
**App Version**: 2.0.0
**Bundle ID (iOS)**: com.caridadrivera.essences
**Package (Android)**: com.caridadrivera.essences
