# Environment Variables Setup for EAS Builds

## Option 1: Using EAS Secrets (Recommended)

EAS Secrets are the secure way to store environment variables for builds:

```bash
# Set secrets for your project
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "your-ios-key-here"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "your-android-key-here"
```

Then update `eas.json` to reference them (already done):
```json
"env": {
  "EXPO_PUBLIC_REVENUECAT_API_KEY_IOS": "${EXPO_PUBLIC_REVENUECAT_API_KEY_IOS}",
  "EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID": "${EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID}"
}
```

## Option 2: Using .env file (Local builds only)

For local builds, create a `.env` file in the project root:

```env
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your-ios-key-here
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your-android-key-here
```

**Note:** `.env` files are NOT included in production builds. You must use EAS Secrets for production.

## Option 3: Hardcode in eas.json (Not Recommended)

You can hardcode values directly in `eas.json`, but this is not secure:

```json
"env": {
  "EXPO_PUBLIC_REVENUECAT_API_KEY_IOS": "your-actual-key",
  "EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID": "your-actual-key"
}
```

## Verifying Environment Variables

After setting up, verify they're available:

1. **Check EAS Secrets:**
   ```bash
   eas secret:list
   ```

2. **Test in build:**
   The app will log a warning if keys are missing:
   ```
   RevenueCat API key is missing for android. Subscription features will be disabled.
   ```

## Important Notes

- Environment variables prefixed with `EXPO_PUBLIC_` are embedded in the app bundle
- They are available at build time, not runtime
- You must rebuild the app after setting/changing secrets
- Secrets are project-scoped and available to all builds for that project
