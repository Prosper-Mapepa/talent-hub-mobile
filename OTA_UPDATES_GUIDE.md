# OTA (Over-The-Air) Updates Guide

## What are OTA Updates?

OTA updates allow you to push JavaScript and asset updates to your app without going through the App Store or Play Store review process. This is perfect for:
- Bug fixes
- UI improvements
- Feature additions (that don't require native code changes)
- Emergency hotfixes

## Setup Complete ✅

The app is now configured for OTA updates:
- ✅ `expo-updates` package added
- ✅ Updates configuration in `app.config.js`
- ✅ Update check logic in `App.tsx`
- ✅ Production build profile configured with live backend URL

## How It Works

1. **Build the app** once and publish to App Store/Play Store
2. **Make changes** to JavaScript/TypeScript code or assets
3. **Publish an update** using EAS Update
4. **Users get the update** automatically when they open the app

## Publishing Updates

### Initial Setup (One-time)

```bash
# Configure EAS Update (if not already done)
cd StudentTalentHubMobile
eas update:configure
```

### Publishing an Update

After making code changes:

```bash
# 1. Commit your changes
git add .
git commit -m "Your update description"
git push

# 2. Publish the update to production branch
npm run update:publish

# Or manually:
eas update:publish --branch production --message "Description of your update"
```

### View Update Status

```bash
# View all published updates
npm run update:view

# Or manually:
eas update:view
```

## Update Channels

The app uses the `production` branch by default. To use different channels:

```bash
# Publish to a specific channel
eas update:publish --branch preview --message "Preview update"

# Build the app pointing to a specific channel
eas build --profile production --channel preview
```

## Checking for Updates

The app automatically checks for updates:
- **When the app launches** (`checkAutomatically: "ON_LOAD"`)
- **Updates are downloaded in the background**
- **App reloads** with the new update when available

## Limitations

OTA updates **CANNOT** update:
- Native code changes (iOS/Android native modules)
- Changes to `app.config.js` or `app.json`
- New permissions
- Native dependencies
- Bundle identifier or package name

For these changes, you need to:
1. Create a new build (`eas build`)
2. Submit to App Store/Play Store
3. Wait for review

## Testing Updates

1. **Build a production app:**
   ```bash
   npm run build:prod:ios    # or android
   ```

2. **Install the build** on your device

3. **Make code changes** (e.g., change some text)

4. **Publish an update:**
   ```bash
   npm run update:publish
   ```

5. **Close and reopen the app** - it should download and apply the update

## Environment Variables

The production build is configured with:
- `API_BASE_URL`: `https://web-production-11221.up.railway.app`

This is set in:
- `app.config.js` (for runtime)
- `eas.json` (for builds)

## Update Branch Strategy

- **`production`**: Main production updates (default)
- **`preview`**: Preview/test updates
- **`staging`**: Staging environment updates

## Troubleshooting

### Updates not showing up

1. Check update was published:
   ```bash
   eas update:view
   ```

2. Verify app is checking for updates (check logs)

3. Ensure `Updates.isEnabled` is true (only works in production builds, not Expo Go)

4. Check the update branch matches your build channel

### App crashes after update

1. Check EAS Update dashboard for error reports
2. Rollback to previous update:
   ```bash
   eas update:republish --branch production --from <previous-update-id>
   ```

### Need to force a new native build

If you make changes that require a native build:
1. Increment `version` in `app.config.js`
2. Increment `buildNumber` (iOS) or `versionCode` (Android)
3. Run `eas build` again
4. Submit to stores

## Useful Commands

```bash
# Check for updates manually
npm run update:check

# View update history
npm run update:view

# Publish update
npm run update:publish

# Build for production
npm run build:prod:ios
npm run build:prod:android
npm run build:prod:all
```

## Resources

- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Update Best Practices](https://docs.expo.dev/eas-update/best-practices/)
