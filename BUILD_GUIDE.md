# Build Guide for CMU TalentHub Mobile App

This guide will help you build and deploy the app to both Apple App Store and Google Play Store.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev) if you don't have one
2. **Apple Developer Account**: Required for iOS builds ($99/year)
3. **Google Play Console Account**: Required for Android builds ($25 one-time fee)
4. **EAS CLI**: Install globally or use from node_modules

## Installation

### Install EAS CLI

```bash
npm install -g eas-cli
```

Or use it from node_modules:

```bash
npx eas-cli login
```

### Login to Expo

```bash
eas login
```

### Configure Project

The project is already configured with:
- **Project ID**: `6c631a05-9ba5-4202-ad44-0348f65f74ea`
- **iOS Bundle ID**: `com.prospermap.StudentTalentHubMobile`
- **Android Package**: `com.prospermap.StudentTalentHubMobile`

## Build Profiles

### 1. Development Build
For testing with development client (allows hot reload, debugging)

**iOS Development Build:**
```bash
npm run build:dev:ios
# or
eas build --profile development --platform ios
```

**Android Development Build:**
```bash
npm run build:dev:android
# or
eas build --profile development --platform android
```

**Features:**
- Development client enabled
- Internal distribution
- iOS: Simulator build
- Android: APK format

### 2. Preview Build
For internal testing (TestFlight, internal testing track)

**iOS Preview Build:**
```bash
npm run build:preview:ios
# or
eas build --profile preview --platform ios
```

**Android Preview Build:**
```bash
npm run build:preview:android
# or
eas build --profile preview --platform android
```

**Features:**
- Production-like build
- Internal distribution
- iOS: Real device build
- Android: APK format

### 3. Production Build
For App Store and Play Store submission

**iOS Production Build:**
```bash
npm run build:prod:ios
# or
eas build --profile production --platform ios
```

**Android Production Build:**
```bash
npm run build:prod:android
# or
eas build --profile production --platform android
```

**Both Platforms:**
```bash
npm run build:prod:all
# or
eas build --profile production --platform all
```

**Features:**
- Auto-increment version
- iOS: App Store build (AAB for Android)
- Production environment

## iOS Setup (App Store)

### 1. App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app with bundle ID: `com.prospermap.StudentTalentHubMobile`
3. Note your:
   - **Apple ID** (email)
   - **App ID** (from App Store Connect)
   - **Team ID** (from Apple Developer portal)

### 2. Update eas.json

Update the submit section in `eas.json`:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABC123XYZ"
    }
  }
}
```

### 3. Build and Submit

```bash
# Build for production
npm run build:prod:ios

# Submit to App Store
npm run submit:ios
# or
eas submit --platform ios --profile production
```

## Android Setup (Play Store)

### 1. Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Set up your app details

### 2. Create Service Account

1. Go to Google Cloud Console
2. Create a service account for Play Console API
3. Download the JSON key file
4. Save it as `google-service-account.json` in the project root (add to .gitignore!)
5. Grant the service account access in Play Console

### 3. Update eas.json

Update the submit section in `eas.json`:

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-service-account.json",
      "track": "internal" // or "alpha", "beta", "production"
    }
  }
}
```

### 4. Build and Submit

```bash
# Build for production
npm run build:prod:android

# Submit to Play Store
npm run submit:android
# or
eas submit --platform android --profile production
```

## Build Commands Summary

### Development Builds
- `npm run build:dev:ios` - iOS development build
- `npm run build:dev:android` - Android development build

### Preview Builds
- `npm run build:preview:ios` - iOS preview build
- `npm run build:preview:android` - Android preview build

### Production Builds
- `npm run build:prod:ios` - iOS App Store build
- `npm run build:prod:android` - Android Play Store build (AAB)
- `npm run build:prod:all` - Build for both platforms

### Submission
- `npm run submit:ios` - Submit iOS to App Store
- `npm run submit:android` - Submit Android to Play Store

## Environment Variables

The app uses the following environment variable:
- `API_BASE_URL`: Backend API URL (defaults to production)

Create a `.env` file for local development:
```
API_BASE_URL=http://localhost:3001
```

## Version Management

- **Version**: Managed in `app.config.js` (currently `1.0.2`)
- **iOS Build Number**: Auto-incremented in production builds
- **Android Version Code**: Auto-incremented in production builds

## Testing

### TestFlight (iOS)
1. Build with preview or production profile
2. Build will automatically upload to TestFlight if configured
3. Manage testers in App Store Connect

### Internal Testing (Android)
1. Build with preview or production profile
2. Submit to internal testing track
3. Add testers in Play Console

## Troubleshooting

### Build Fails
- Check EAS CLI version: `eas --version`
- Update EAS CLI: `npm install -g eas-cli@latest`
- Check project ID matches in `app.config.js`

### iOS Certificate Issues
- EAS will generate certificates automatically
- You may need to configure credentials: `eas credentials`

### Android Signing Issues
- EAS manages Android signing keys automatically
- Check credentials: `eas credentials`

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
