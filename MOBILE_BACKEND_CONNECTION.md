# Mobile App Backend Connection Guide

## 🔌 How the Mobile App Connects to the Backend

### Connection Architecture

```
Mobile App (React Native/Expo)
    ↓
Axios HTTP Client (src/lib/api.ts)
    ↓
Backend Server (recipehunter-server)
    ↓
PostgreSQL Database (via Prisma)
```

## 📍 Connection Configuration

### 1. API URL Configuration

The mobile app gets its API URL from **3 sources** (in priority order):

1. **Expo Config** (`app.json`):
   ```json
   {
     "extra": {
       "apiUrl": "http://localhost:3002"
     }
   }
   ```

2. **Environment Variable**:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3002
   ```

3. **Default Fallback**:
   ```typescript
   'http://localhost:3002'
   ```

**Location**: `src/lib/api.ts` line 9
```typescript
const API_URL = Constants.expoConfig?.extra?.apiUrl 
  || process.env.EXPO_PUBLIC_API_URL 
  || 'http://localhost:3002';
```

### 2. HTTP Client Setup

**Location**: `src/lib/api.ts` lines 12-18

```typescript
const api: AxiosInstance = axios.create({
  baseURL: API_URL,  // http://localhost:3002
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,  // 30 seconds
});
```

## 🔄 API Endpoints Used

### Video Processing
- `POST /api/video/process-url` - Process video URL
- `POST /api/video/process-upload` - Upload video file
- `GET /api/video/job/:jobId` - Get job status
- `GET /api/video/jobs` - Get user's jobs

### Recipes/Guides
- `GET /api/guides/:userId` - Get all recipes
- `GET /api/guides/detail/:recipeId` - Get single recipe
- `POST /api/guides` - Create recipe
- `PATCH /api/guides/:recipeId` - Update recipe
- `DELETE /api/guides/:recipeId` - Delete recipe
- `PATCH /api/guides/:recipeId/pin` - Toggle pin
- `GET /api/guides/stats/:userId` - Get stats

### AI Recipe Generation
- `POST /api/recipes/quick-generate` - Generate quick recipes
- `POST /api/recipes/from-ingredients` - Generate from ingredients
- `POST /api/recipes/save-selected` - Save selected recipe

### Article Processing
- `POST /api/article/process` - Process article URL

## 📱 Platform-Specific Connection

### iOS Simulator
- **URL**: `http://localhost:3002`
- Works directly (same network)

### Android Emulator
- **URL**: `http://10.0.2.2:3002` (Android emulator maps localhost)
- **OR**: `http://localhost:3002` (if using newer emulator)

### Physical Device (Development)
- **URL**: `http://YOUR_COMPUTER_IP:3002`
  - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
  - Example: `http://192.168.1.100:3002`
- **Important**: Both device and computer must be on same WiFi network

### Production
- **URL**: Your deployed server URL
  - Example: `https://api.recipehunter.com`
- Update in `app.json`:
  ```json
  {
    "extra": {
      "apiUrl": "https://api.recipehunter.com"
    }
  }
  ```

## 🔐 Authentication (Current)

Currently, the app uses **simple user ID** authentication:

1. **User ID Generation**: 
   - Generated on first app launch
   - Stored in AsyncStorage as `breakfree_user_id`
   - Location: `src/lib/userid.ts`

2. **Request Format**:
   ```typescript
   // User ID is sent in request body or query params
   POST /api/video/process-url
   {
     "url": "...",
     "userId": "user-uuid-here"
   }
   ```

3. **Future**: Can add JWT tokens via interceptor:
   ```typescript
   // In src/lib/api.ts (currently commented out)
   api.interceptors.request.use(async (config) => {
     const token = await getAuthToken();
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

## 🔄 Request/Response Flow

### Example: Processing a Video URL

```typescript
// 1. User submits video URL in mobile app
// Location: app/add-guide.tsx

// 2. App calls API
const response = await videoAPI.processUrl(url, userId);
// → POST http://localhost:3002/api/video/process-url

// 3. Backend processes request
// Location: recipehunter-server/src/routes/video.ts

// 4. Backend returns job ID
{
  "success": true,
  "jobId": "job-uuid",
  "status": "pending"
}

// 5. App polls for status
const status = await videoAPI.getJobStatus(jobId, userId);
// → GET http://localhost:3002/api/video/job/:jobId?userId=...

// 6. Backend returns progress
{
  "status": "processing",
  "progress": 50,
  "step": "Transcribing audio..."
}

// 7. When complete, app receives recipe
{
  "status": "completed",
  "progress": 100,
  "recipe": { ... }
}
```

## 🛠️ Testing the Connection

### 1. Check Backend is Running
```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Recipe Hunter API is running"
}
```

### 2. Test from Mobile App

**In the app console/logs**, you should see:
- ✅ Successful API calls
- ❌ Connection errors if backend is down

**Common Errors**:
- `Network Error` - Backend not running or wrong URL
- `Timeout` - Backend too slow or network issue
- `404 Not Found` - Wrong endpoint URL
- `500 Internal Server Error` - Backend error

### 3. Debug Connection

Add logging in `src/lib/api.ts`:
```typescript
api.interceptors.request.use((config) => {
  console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);
```

## 📝 Configuration Files

### Mobile App
- **`app.json`** - API URL configuration
- **`src/lib/api.ts`** - HTTP client setup
- **`src/lib/userid.ts`** - User ID management

### Backend Server
- **`index.ts`** - Server setup, CORS configuration
- **`.env`** - Environment variables (DATABASE_URL, OPENAI_API_KEY)

## 🔧 Troubleshooting

### Problem: "Network Error" or "Connection Refused"

**Solutions**:
1. ✅ Check backend is running: `npm run dev` in `recipehunter-server`
2. ✅ Check backend port: Should be `3002`
3. ✅ Check API URL in `app.json` matches backend port
4. ✅ For physical device: Use computer's IP address, not `localhost`
5. ✅ Check firewall allows connections on port 3002

### Problem: "Timeout" errors

**Solutions**:
1. ✅ Increase timeout in `src/lib/api.ts` (currently 30 seconds)
2. ✅ Check network connection
3. ✅ Check backend is processing requests (check server logs)

### Problem: "404 Not Found"

**Solutions**:
1. ✅ Verify endpoint path is correct
2. ✅ Check backend routes are mounted in `index.ts`
3. ✅ Verify API URL doesn't have trailing slash

### Problem: CORS errors (web/browser)

**Solutions**:
1. ✅ Check CORS configuration in backend `index.ts`
2. ✅ Add your origin to allowed origins list
3. ✅ For development, backend allows all origins

## 🚀 Production Setup

### 1. Update API URL
```json
// app.json
{
  "extra": {
    "apiUrl": "https://api.recipehunter.com"
  }
}
```

### 2. Rebuild App
```bash
# For production build
eas build --platform ios
eas build --platform android
```

### 3. Environment Variables
For production, use EAS Secrets:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.recipehunter.com"
```

## 📊 Connection Status

The app handles connection failures gracefully:
- ✅ Falls back to cached recipes if backend unavailable
- ✅ Shows error messages to user
- ✅ Retries failed requests automatically (via axios)
- ✅ Polls job status with intervals

## 🔗 Related Files

- **API Client**: `src/lib/api.ts`
- **User ID**: `src/lib/userid.ts`
- **Config**: `app.json`
- **Backend Routes**: `recipehunter-server/src/routes/*`
- **Backend Server**: `recipehunter-server/index.ts`
