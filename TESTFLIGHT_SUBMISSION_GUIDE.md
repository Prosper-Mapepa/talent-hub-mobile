# TestFlight Submission Guide

## The Problem

Running `npm run build:prod:ios` only **creates** the build. It does **NOT** automatically submit to TestFlight. You need to submit it separately.

## Solution Options

### Option 1: Submit Manually (Recommended for First Time)

After your build completes:

```bash
# Submit the latest build to TestFlight
npm run submit:ios

# Or manually:
eas submit --platform ios --profile production
```

This will:
- Find the latest iOS production build
- Upload it to App Store Connect
- Make it available in TestFlight

### Option 2: Auto-Submit on Build

You can configure EAS to automatically submit after building. Update `eas.json`:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": {
        "simulator": false,
        "autoSubmit": true  // Add this
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "APP_ENV": "production",
        "API_BASE_URL": "https://web-production-11221.up.railway.app"
      }
    }
  }
}
```

Then `npm run build:prod:ios` will automatically submit.

### Option 3: Build and Submit in One Command

```bash
eas build --profile production --platform ios --auto-submit
```

## Required: App Store Connect Setup

Before submitting, you **MUST** configure your App Store Connect credentials in `eas.json`:

### 1. Get Your App Store Connect Information

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **My Apps** → Your App
3. Note:
   - **App ID** (Numeric ID, e.g., `1234567890`)
   - Your **Apple ID** email
   - **Team ID** (from Apple Developer portal)

### 2. Update `eas.json`

Update the `submit` section:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-actual-email@example.com",
        "ascAppId": "1234567890",  // Your App Store Connect App ID
        "appleTeamId": "ABC123XYZ"  // Your Apple Team ID
      }
    }
  }
}
```

## First Time Setup

### Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: CMU TalentHub
   - **Primary Language**: English
   - **Bundle ID**: `com.prospermap.StudentTalentHubMobile`
   - **SKU**: Any unique identifier
   - **User Access**: Full Access (or as needed)
4. Click **Create**

### Step 2: Configure Credentials

```bash
# Configure App Store Connect credentials
eas credentials

# Select iOS
# Select "Set up App Store Connect API Key" or "App-specific password"
```

### Step 3: Build and Submit

```bash
# Build
npm run build:prod:ios

# Wait for build to complete (check https://expo.dev)

# Submit
npm run submit:ios
```

## Check Build Status

1. **EAS Dashboard**: https://expo.dev/accounts/[your-account]/projects/StudentTalentHubMobile/builds
2. **App Store Connect**: https://appstoreconnect.apple.com → My Apps → TestFlight

## Troubleshooting

### Build Not Showing in TestFlight

1. **Did you submit?** Building ≠ Submitting
   - Run `npm run submit:ios` after build completes

2. **Check App Store Connect**
   - Go to TestFlight tab
   - Check "iOS Builds" section
   - Processing can take 5-30 minutes

3. **Check Build Status**
   ```bash
   eas build:list --platform ios
   ```
   - Status should be "finished" before submitting

4. **Credential Issues**
   ```bash
   eas credentials
   ```
   - Reconfigure if needed

### "App not found in App Store Connect"

- Ensure app exists in App Store Connect
- Check `ascAppId` in `eas.json` matches your App ID
- App ID is numeric (not bundle ID)

### "Authentication failed"

- Update `appleId` and `appleTeamId` in `eas.json`
- Or run `eas credentials` to configure API key

### Build is Processing

- Check processing status in App Store Connect
- Processing typically takes:
  - EAS Build: 10-20 minutes
  - App Store Connect processing: 5-30 minutes
  - Total: 15-50 minutes

## Quick Reference

```bash
# Build only (does NOT submit)
npm run build:prod:ios

# Submit existing build
npm run submit:ios

# Build AND submit (one command)
eas build --profile production --platform ios --auto-submit

# Check build status
eas build:list --platform ios

# View submission status
# Check App Store Connect → TestFlight
```

## After Submission

1. **Wait for Processing**: 5-30 minutes
2. **Check TestFlight**: App Store Connect → TestFlight → iOS Builds
3. **Add Testers**: 
   - Internal testers (up to 100)
   - External testers (need review first time)
4. **Distribute**: Testers will receive email invitations

## Important Notes

- First submission to TestFlight requires app metadata (screenshots, description, etc.)
- External testers require App Review (1-2 days first time)
- Internal testers can test immediately after processing
- Builds expire after 90 days of inactivity
