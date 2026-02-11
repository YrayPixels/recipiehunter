require('dotenv').config();

// Get API URL from environment, with validation
const getApiUrl = () => {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    const defaultUrl = "http://10.12.77.101:3002";

    // If envUrl is the literal template string (not replaced), ignore it
    if (envUrl === '${EXPO_PUBLIC_API_URL}') {
        console.warn('⚠️  EXPO_PUBLIC_API_URL is not set or not replaced. Using default URL.');
        return defaultUrl;
    }

    // If envUrl is set and valid, use it
    if (envUrl && envUrl.trim() && envUrl !== '') {
        return envUrl;
    }

    // Otherwise use default
    return defaultUrl;
};

module.exports = {
    expo: {
        name: "Recipe Hunter",
        slug: "recipe-hunter",
        version: "1.0.2",
        orientation: "portrait",
        icon: "./assets/images/logo_bg.png",
        scheme: "recipe-hunter",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/logo_no_bg.png",
                backgroundImage: "./assets/images/logo_bg.png",
                monochromeImage: "./assets/images/logo_no_bg.png"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            useLegacyPackaging: true,
            package: "com.yraylabs.recipehunter",
            permissions: [
                "android.permission.READ_EXTERNAL_STORAGE",
                "android.permission.WRITE_EXTERNAL_STORAGE",
                "android.permission.FOREGROUND_SERVICE",
                "android.permission.READ_MEDIA_VIDEO",
                "android.permission.READ_MEDIA_IMAGES",
                "android.permission.CAMERA"
            ],
            versionCode: 3
        },
        ios: {
            bundleIdentifier: "com.yraylabs.recipehunter",
            supportsTablet: true,
            infoPlist: {
                NSPhotoLibraryUsageDescription: "The app accesses your photos to let you select videos for recipe creation.",
                NSCameraUsageDescription: "The app accesses your camera to let you take photos for recipe creation."
            }
        },
        web: {
            output: "static",
            favicon: "./assets/images/logo_no_bg.png",
            bundler: "metro"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/logo_bg.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                    dark: {
                        backgroundColor: "#000000"
                    }
                }
            ],
            [
                "expo-notifications",
                {
                    icon: "./assets/images/logo_no_bg.png",
                    color: "#5a7a5a",
                    sounds: []
                }
            ],
            [
                "expo-secure-store"
            ]
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            router: {},
            eas: {
                projectId: "74429156-8b41-4a5b-a612-6ceb7e156ab5"
            },
            apiUrl: getApiUrl()
        },
        runtimeVersion: "1.0.2",
        updates: {
            url: ""
        }
    }
};
