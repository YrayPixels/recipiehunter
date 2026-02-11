# Recipe Hunter - Technical Documentation

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [RevenueCat Implementation](#revenuecat-implementation)

---

## Tech Stack

### Mobile Application (React Native/Expo)

**Core Framework:**
- **Expo SDK ~54.0** - React Native framework with managed workflow
- **React Native 0.81.5** - Cross-platform mobile framework
- **React 19.1.0** - UI library
- **Expo Router ~6.0.21** - File-based routing system
- **TypeScript 5.9.2** - Type-safe JavaScript

**State Management & Data:**
- **Zustand 5.0.9** - Lightweight state management
- **@react-native-async-storage/async-storage 2.1.1** - Local data persistence
- **Axios 1.6.5** - HTTP client for API communication

**UI & Styling:**
- **NativeWind 4.2.1** - Tailwind CSS for React Native
- **Tailwind CSS 3.4.19** - Utility-first CSS framework
- **@expo/vector-icons 15.0.3** - Icon library
- **@gorhom/bottom-sheet 5.2.8** - Bottom sheet component
- **react-native-reanimated 4.1.1** - Animation library
- **react-native-svg 15.12.1** - SVG support

**Subscriptions & Payments:**
- **react-native-purchases 9.6.13** - RevenueCat SDK for in-app purchases
- **react-native-purchases-ui 9.6.14** - RevenueCat UI components

**Expo Modules:**
- **expo-notifications 0.32.15** - Push notifications
- **expo-secure-store 15.0.8** - Secure key-value storage
- **expo-file-system 18.0.10** - File system access
- **expo-document-picker 13.0.3** - Document picker
- **expo-clipboard 8.0.8** - Clipboard access
- **expo-local-authentication 17.0.8** - Biometric authentication
- **expo-image 3.0.11** - Optimized image component
- **expo-constants 18.0.12** - App constants and configuration

**Utilities:**
- **date-fns 4.1.0** - Date manipulation library
- **uuid 13.0.0** - UUID generation
- **clsx 2.1.1** - Conditional class names

**Development Tools:**
- **ESLint 9.25.0** - Code linting
- **TypeScript 5.9.2** - Type checking
- **EAS Build** - Cloud-based build service

### Backend Server (Node.js/Express)

**Core Framework:**
- **Node.js** - JavaScript runtime
- **Express.js 4.18.2** - Web application framework
- **TypeScript 5.5.0** - Type-safe JavaScript
- **tsx 4.16.0** - TypeScript execution

**Database:**
- **Prisma 5.19.0** - Next-generation ORM
- **PostgreSQL** - Relational database
- **@prisma/client 5.19.0** - Prisma client library

**AI & Processing:**
- **OpenAI SDK 4.24.1** - OpenAI API client (Whisper, GPT-4 Vision, GPT-4)
- **@anthropic-ai/sdk 0.71.2** - Anthropic Claude API (currently disabled, using OpenAI)

**Video Processing:**
- **@distube/ytdl-core 4.13.3** - YouTube video downloader
- **play-dl 1.9.7** - Multi-platform video downloader (TikTok, Instagram, etc.)
- **fluent-ffmpeg 2.1.2** - FFmpeg wrapper for video/audio processing
- **@ffmpeg-installer/ffmpeg 1.1.0** - FFmpeg binary installer
- **@ffprobe-installer/ffprobe 2.1.2** - FFprobe binary installer

**Web Scraping & Content Extraction:**
- **cheerio 1.1.2** - Server-side HTML parsing
- **turndown 7.2.2** - HTML to Markdown converter
- **pdf-parse 2.4.5** - PDF text extraction
- **microdata-node 2.0.0** - Microdata extraction
- **@cucumber/microdata 2.2.0** - Structured data extraction
- **@danielxceron/youtube-transcript 1.2.3** - YouTube transcript extraction

**Caching:**
- **Redis 4.7.0** - In-memory data store
- **@upstash/redis 1.35.8** - Upstash Redis client (for serverless)

**File Handling:**
- **multer 1.4.5-lts.1** - Multipart/form-data handling

**Utilities:**
- **axios 1.13.2** - HTTP client
- **cors 2.8.5** - CORS middleware
- **dotenv 16.3.1** - Environment variable management
- **uuid 9.0.1** - UUID generation

**Development Tools:**
- **Docker Compose** - Container orchestration for Redis

---

## Architecture

### System Overview

Recipe Hunter follows a **client-server architecture** with a mobile app (React Native/Expo) communicating with a Node.js/Express backend API.

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│  (React Native/Expo - iOS & Android)                        │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │  State Mgmt  │  │  API Client  │      │
│  │  (Expo Router│  │   (Zustand)  │  │   (Axios)    │      │
│  │  Components) │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │ RevenueCat SDK │                       │
│                    │  (Subscriptions)│                      │
│                    └───────┬────────┘                       │
└────────────────────────────┼───────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼───────────────────────────────┐
│                  Backend Server                             │
│              (Node.js/Express)                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Routes     │  │  Services    │  │  Middleware │    │
│  │  (Express)  │  │  (Business    │  │  (Auth,      │    │
│  │              │  │   Logic)     │  │   CORS)      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         │                  │                  │            │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐    │
│  │   Prisma    │  │     Redis    │  │   OpenAI    │    │
│  │   (Postgres)│  │    (Cache)   │  │     API      │    │
│  └─────────────┘  └──────────────┘  └──────────────┘    │
└───────────────────────────────────────────────────────────┘
```

### Mobile App Architecture

**File Structure:**
```
recipiehunter/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx        # Root layout with navigation
│   ├── index.tsx          # Home screen
│   ├── guides.tsx         # Recipe/guide list
│   ├── subscription.tsx   # Subscription management
│   └── ...
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/
│   │   ├── api.ts         # API client (Axios instance)
│   │   ├── subscription.ts  # RevenueCat integration
│   │   └── storage.ts     # Local storage utilities
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript type definitions
└── assets/                # Images, fonts, etc.
```

**Key Architectural Patterns:**

1. **File-Based Routing**: Expo Router automatically creates routes from files in the `app/` directory
2. **API Client Abstraction**: All backend communication goes through `src/lib/api.ts` with typed API methods
3. **State Management**: Zustand stores for global state (user auth, shopping lists, meal plans)
4. **Local Persistence**: AsyncStorage for offline data, SecureStore for sensitive data
5. **Subscription Management**: Centralized RevenueCat service in `src/lib/subscription.ts`

### Backend Server Architecture

**File Structure:**
```
recipehunter-server/
├── index.ts               # Express app entry point
├── src/
│   ├── routes/            # API route handlers
│   │   ├── video.ts       # Video processing endpoints
│   │   ├── article.ts     # Article processing endpoints
│   │   ├── recipes.ts     # Recipe CRUD endpoints
│   │   ├── auth.ts        # Authentication endpoints
│   │   └── ...
│   ├── services/          # Business logic
│   │   ├── videoProcessor.ts
│   │   ├── articleProcessor.ts
│   │   ├── recipeGeneratorService.ts
│   │   └── ...
│   ├── middleware/        # Express middleware
│   │   └── subscriptionCheck.ts
│   ├── config/            # Configuration
│   │   ├── redis.ts       # Redis connection
│   │   └── multer.ts      # File upload config
│   └── utils/             # Utility functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
└── uploads/              # Temporary file storage
```

**Key Architectural Patterns:**

1. **RESTful API**: Standard HTTP methods (GET, POST, PATCH, DELETE) for resource operations
2. **Service Layer**: Business logic separated from route handlers
3. **ORM**: Prisma for type-safe database access
4. **Background Processing**: Asynchronous job processing for video/article extraction
5. **Caching**: Redis for frequently accessed data (optional, graceful degradation)

### API Communication

**Connection Flow:**
1. Mobile app uses Axios instance configured with base URL
2. API URL priority:
   - Expo config (`app.config.js` → `extra.apiUrl`)
   - Environment variable (`EXPO_PUBLIC_API_URL`)
   - Default fallback (`http://localhost:3002`)

**Authentication:**
- Currently uses user ID-based authentication (userId sent in request body/query params)
- Future: JWT token-based auth (interceptor ready in `api.ts`)

**Key Endpoints:**
- `/api/video/*` - Video processing (URL upload, file upload, job status)
- `/api/article/*` - Article URL processing
- `/api/guides/*` - Recipe/guide CRUD operations
- `/api/recipes/*` - AI recipe generation
- `/api/meals/*` - Meal planning
- `/api/shopping/*` - Shopping list management
- `/api/ingredients/*` - Pantry/ingredient tracking
- `/api/auth/*` - User authentication

### Data Flow Examples

**Video Processing:**
```
1. User submits video URL in mobile app
2. App → POST /api/video/process-url { url, userId }
3. Backend creates ProcessingJob, returns jobId
4. Backend asynchronously:
   - Downloads video (ytdl-core/play-dl)
   - Extracts audio (FFmpeg)
   - Transcribes (OpenAI Whisper)
   - Extracts recipe (OpenAI GPT-4)
5. App polls GET /api/video/job/:jobId for status
6. When complete, app fetches recipe and displays
```

**Recipe Generation:**
```
1. User selects preferences (meal type, cuisine, etc.)
2. App → POST /api/recipes/quick-generate { preferences, userId }
3. Backend calls OpenAI GPT-4 with structured prompt
4. Backend saves recipe to database via Prisma
5. Backend returns recipe data
6. App caches recipe locally and displays
```

---

## RevenueCat Implementation

### Overview

Recipe Hunter uses **RevenueCat** for cross-platform subscription management. RevenueCat provides a unified SDK that wraps Apple's StoreKit (iOS) and Google Play Billing (Android), simplifying subscription implementation.

**Package:** `react-native-purchases` (v9.6.13)  
**UI Package:** `react-native-purchases-ui` (v9.6.14)  
**Location:** `src/lib/subscription.ts`

### Configuration

**API Keys:**
- iOS: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
- Android: `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`

**Environment Setup:**
Keys are configured via:
1. EAS Secrets (for cloud builds)
2. `.env` file (for local development)
3. `eas.json` (build configuration)

### Initialization

**Entry Points:**
1. **App Startup** (`app/_layout.tsx`): Initializes RevenueCat when user is authenticated
2. **User Login** (`app/signup.tsx`): Re-initializes with user ID after authentication
3. **App Active** (`app/_layout.tsx`): Re-initializes when app comes to foreground

**Initialization Flow:**
```typescript
initializePurchases(userId?: string, enableDebugLogging?: boolean)
```

1. Checks if already initialized with same userId (returns early)
2. Validates API key for platform (iOS/Android)
3. Skips initialization in Expo Go (iOS limitation)
4. Configures RevenueCat SDK with platform-specific API key
5. Logs in user with userId (if provided)
6. Sets up customer info update listener
7. Syncs subscription status to local storage

**Key Features:**
- Prevents duplicate initialization
- Handles user ID changes (re-initializes)
- Graceful degradation if API keys missing
- Debug logging in development mode

### Subscription Plans

**Entitlements:**
- `Premium` - Main premium subscription entitlement
- `Breakfree Pro` - Alternative entitlement (legacy)

**Package Identifiers:**
- `$rc_monthly` - Monthly subscription package
- `$rc_annual` - Annual subscription package
- `$rc_weekly` - Weekly subscription package (if configured)

**Product IDs (configured in App Store Connect / Google Play Console):**
- `break_monthly` - Monthly subscription
- `break_yearly` - Annual subscription
- `break_weekly` - Weekly subscription (optional)

### Core Functions

#### 1. Get Offerings
```typescript
getOfferings(): Promise<PurchasesOffering | null>
```
- Fetches current offering from RevenueCat
- Returns null if not initialized or no offering available
- Includes all packages (monthly, annual, weekly)

#### 2. Get Packages
```typescript
getPackages(): Promise<PurchasesPackage[]>
```
- Extracts packages from current offering
- Returns array of available subscription packages
- Used for displaying subscription options

#### 3. Purchase Package
```typescript
purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo>
```
- Initiates purchase flow via native store (App Store/Play Store)
- Handles user cancellation gracefully
- Syncs subscription status after successful purchase
- Throws error on failure

#### 4. Restore Purchases
```typescript
restorePurchases(): Promise<CustomerInfo>
```
- Restores previous purchases from store
- Useful for users who reinstalled app or switched devices
- Syncs subscription status after restore

#### 5. Get Customer Info
```typescript
getCustomerInfo(): Promise<CustomerInfo | null>
```
- Fetches current customer subscription status
- Includes entitlements, active subscriptions, expiration dates
- Returns null if not initialized

#### 6. Sync Subscription Status
```typescript
syncSubscriptionStatus(customerInfo: CustomerInfo): Promise<void>
```
- Syncs RevenueCat subscription status to local storage
- Updates `subscriptionStatus`, `subscriptionTier`, `subscriptionExpiry`
- Used internally after purchases/restores

### UI Components

#### Present Paywall
```typescript
presentRevenueCatPaywall(offering?: PurchasesOffering): Promise<CustomerInfo | null>
```
- Shows native RevenueCat paywall UI
- Uses `react-native-purchases-ui` package
- Returns CustomerInfo if purchase completed, null if dismissed

**Usage:**
```typescript
const customerInfo = await presentRevenueCatPaywall();
if (customerInfo) {
  // Purchase completed
}
```

#### Present Customer Center
```typescript
presentCustomerCenter(): Promise<boolean>
```
- Shows native customer center for subscription management
- Allows users to manage/cancel subscriptions
- Returns true if presented, false otherwise

### Subscription Status Management

**Local Storage:**
Subscription status is cached locally in AsyncStorage:
- `subscriptionStatus`: `'active' | 'expired' | 'none'`
- `subscriptionTier`: `'premium' | 'free'`
- `subscriptionExpiry`: ISO date string

**Sync Flow:**
1. RevenueCat customer info updates trigger listener
2. Listener calls `syncSubscriptionStatus()`
3. Status saved to local storage
4. App state updated (Zustand store if used)

### Error Handling

**Common Scenarios:**
1. **Missing API Keys**: App continues without subscription features (graceful degradation)
2. **Expo Go Limitation**: iOS native store not available in Expo Go (skips initialization)
3. **User Cancellation**: Purchase cancelled by user (returns gracefully, no error)
4. **Network Errors**: Handled by RevenueCat SDK, logged for debugging

**Error Types:**
- Initialization errors: Logged, app continues without RevenueCat
- Purchase errors: Thrown to caller for UI handling
- Restore errors: Logged, returns null

### Platform-Specific Notes

**iOS:**
- Requires App Store Connect configuration
- Uses StoreKit 2 (via RevenueCat)
- Test with sandbox accounts
- Not available in Expo Go (requires development build)

**Android:**
- Requires Google Play Console configuration
- Uses Google Play Billing Library (via RevenueCat)
- Test with test accounts
- Works in Expo Go with test API keys

### Backend Integration

**Current Status:**
- Backend has subscription check middleware (`src/middleware/subscriptionCheck.ts`)
- Currently bypassed (`BYPASS_PREMIUM_UNTIL_PAYMENT_READY = true`)
- Ready for integration when subscription verification is needed

**Future Integration:**
1. Mobile app sends subscription receipt/entitlement status to backend
2. Backend verifies with RevenueCat webhook or API
3. Backend middleware checks subscription before allowing premium features
4. Premium features: AI recipe generation, unlimited recipe saves, etc.

### Testing

**Development:**
- Use RevenueCat test API keys
- Test with sandbox/test accounts
- Enable debug logging: `initializePurchases(userId, true)`

**Production:**
- Use production API keys from RevenueCat dashboard
- Monitor RevenueCat dashboard for subscription events
- Set up webhooks for server-side verification

### Documentation References

- **RevenueCat React Native SDK**: https://docs.revenuecat.com/docs/react-native
- **RevenueCat Dashboard**: https://app.revenuecat.com
- **Expo Integration**: https://docs.revenuecat.com/docs/expo

---

## Additional Resources

### Project Documentation
- `ENV_SETUP.md` - Environment variable configuration
- `MOBILE_BACKEND_CONNECTION.md` - API connection details
- `PROJECT_STORY.md` - Project background and development journey

### External Documentation
- **Expo Documentation**: https://docs.expo.dev
- **React Native Documentation**: https://reactnative.dev
- **Prisma Documentation**: https://www.prisma.io/docs
- **OpenAI API Documentation**: https://platform.openai.com/docs
- **RevenueCat Documentation**: https://docs.revenuecat.com

---

**Last Updated:** January 2025  
**Version:** 1.0.0
