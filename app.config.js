import 'dotenv/config';

export default {
  expo: {
    name: "CMU TalentHub",
    slug: "StudentTalentHubMobile",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    updates: {
      url: "https://u.expo.dev/6c631a05-9ba5-4202-ad44-0348f65f74ea",
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD",
      enabled: true,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#8F1A27"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.prospermap.StudentTalentHubMobile",
      buildNumber: "1",
      associatedDomains: ["applinks:cmutalenthub.netlify.app"],
      infoPlist: {
        NSCameraUsageDescription: "This app needs access to your camera to upload profile pictures and talent photos.",
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to upload profile pictures and talent photos.",
        NSMicrophoneUsageDescription: "This app needs access to your microphone to record videos for talents.",
        NSLocationWhenInUseUsageDescription: "This app uses your location to show nearby opportunities.",
        NSFaceIDUsageDescription: "Use Face ID to securely sign in to your account. Your biometric data is stored only on your device and is never shared with our servers.",
      },
      config: {
        usesNonExemptEncryption: false
      },
      // App Store Connect configuration (will be set in EAS)
      // appleTeamId: "YOUR_TEAM_ID",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#8F1A27"
      },
      edgeToEdgeEnabled: true,
      package: "com.prospermap.StudentTalentHubMobile",
      versionCode: 1,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "cmutalenthub.netlify.app",
              pathPrefix: "/reset-password",
            },
            {
              scheme: "cmutalenthub",
              host: "reset-password",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET",
        "VIBRATE"
      ],
      // Google Play configuration
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.prospermap.StudentTalentHubMobile",
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "6c631a05-9ba5-4202-ad44-0348f65f74ea"
      },
      apiBaseUrl: process.env.API_BASE_URL || "https://web-production-11221.up.railway.app"
    },
    plugins: [
      "expo-asset",
      "expo-font",
      "expo-av",
      "expo-video",
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to upload profile pictures and talent photos.",
          cameraPermission: "The app accesses your camera to take photos for your profile and talents."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#8F1A27"
        }
      ]
    ],
    description: "CMU TalentHub - Connect, Showcase, and Evolve. A platform for students to showcase their talents and discover opportunities.",
    owner: "prospermap",
  }
};

