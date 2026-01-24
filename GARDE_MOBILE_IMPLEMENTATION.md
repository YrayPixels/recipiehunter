# Garde Mobile App Implementation

This document describes the implementation of all Garde features as a mobile app using React Native/Expo.

## Overview

The mobile app has been transformed from a habit tracking app to a comprehensive recipe and guide management app (Garde). All features from the web version have been implemented for mobile.

## Features Implemented

### ✅ Core Features

1. **Guides Management**
   - View all guides (recipes, DIY, crafts)
   - Create guides from video URLs, uploads, or AI generation
   - View guide details with ingredients, steps, tips
   - Delete guides
   - Pin/unpin guides

2. **Video Processing**
   - Process videos from YouTube, TikTok, Instagram URLs
   - Upload video files from device
   - Background job processing with status polling
   - Real-time progress updates

3. **AI Recipe Generator**
   - Quick Recipe Generator (meal type, servings, vibe, cuisine, spice level)
   - Cook With What I Have (ingredients-based generation)
   - Integration with garde server API

4. **Meal Planner**
   - View meal plans for date ranges
   - Add guides to meal plans
   - Calendar view of planned meals

5. **Shopping Lists**
   - Auto-generated shopping lists from guides
   - Create lists from meal plans
   - Check off items as you shop
   - Multiple lists support

6. **Activity Planner**
   - Schedule DIY projects and activities
   - View activities by date
   - Time-based scheduling

7. **My Ingredients (Pantry Tracker)**
   - Track ingredients in your pantry
   - Generate recipes from available ingredients
   - Quantity tracking

8. **Reminders**
   - Existing reminder system (from Break Free app)
   - Custom notifications
   - Time-based reminders

9. **Dashboard**
   - Quick stats (total guides, recent guides)
   - Quick access to all features
   - Modern card-based UI

## File Structure

```
app/
├── index.tsx              # Main dashboard
├── guides.tsx            # Guides list
├── add-guide.tsx         # Add guide (URL, upload, AI)
├── guide-detail.tsx      # View/edit guide
├── meal-planner.tsx      # Meal planning
├── shopping.tsx          # Shopping lists
├── activity-planner.tsx  # Activity planning
├── ingredients.tsx       # Pantry tracker
├── reminders.tsx         # Reminders (existing)
└── settings.tsx          # Settings (existing)

src/lib/
└── api.ts                # API client for garde server
```

## API Integration

The app connects to the garde server using the API client in `src/lib/api.ts`. The server URL is configured in `app.json`:

```json
{
  "extra": {
    "apiUrl": "http://localhost:3001"
  }
}
```

For production, update this to your garde server URL.

### API Endpoints Used

- `/api/video/*` - Video processing
- `/api/article/*` - Article processing
- `/api/guides/*` - Guides CRUD
- `/api/shopping/*` - Shopping lists
- `/api/meal-planner/*` - Meal planning
- `/api/activity-plans/*` - Activity planning
- `/api/recipes/*` - AI recipe generation
- `/api/activities/*` - AI activity generation
- `/api/reminders/*` - Reminders

## Packages Added

The following packages were added to `package.json`:

- `expo-document-picker` - For file selection
- `expo-file-system` - For file operations
- `expo-image-picker` - For video/image selection

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure API URL in `app.json`:
```json
{
  "extra": {
    "apiUrl": "YOUR_GARDE_SERVER_URL"
  }
}
```

3. Start the development server:
```bash
npm start
```

## Usage

### Adding a Guide

1. Tap "Add Guide" from dashboard or guides screen
2. Choose mode:
   - **URL**: Paste YouTube/TikTok/Instagram link
   - **Upload**: Select video from device
   - **AI Recipe**: Generate recipe from preferences
   - **Ingredients**: Generate recipe from ingredients you have

### Viewing Guides

1. Tap "My Guides" from dashboard
2. Tap any guide to view details
3. View ingredients, steps, tips, and metadata

### Meal Planning

1. Tap "Meal Planner" from dashboard
2. View planned meals by date
3. Add guides to meal plan (from guide detail screen)

### Shopping Lists

1. Tap "Shopping Lists" from dashboard
2. View all shopping lists
3. Check off items as you shop
4. Create lists from guides or meal plans

### Activity Planning

1. Tap "Activity Planner" from dashboard
2. View scheduled activities
3. Add activities from guides

### My Ingredients

1. Tap "My Ingredients" from dashboard
2. Add ingredients you have
3. Generate recipes from available ingredients

## Server Requirements

The mobile app requires the garde server to be running. The server should be accessible at the configured API URL.

### Server Features Used

- Video processing (YouTube, TikTok, Instagram)
- Article processing
- AI recipe generation (Claude Sonnet 4)
- AI activity generation
- Meal planning
- Shopping list generation
- Reminders

## User Authentication

Currently, the app uses a simple user ID stored in AsyncStorage. For production, you may want to implement proper authentication with Supabase or another auth provider.

The user ID is generated automatically on first launch and stored in `breakfree_user_id` in AsyncStorage.

## Next Steps

1. **Authentication**: Implement proper user authentication
2. **Offline Support**: Add offline caching for guides
3. **Push Notifications**: Integrate with garde server push notifications
4. **Image Upload**: Add support for guide images
5. **Sharing**: Add guide sharing functionality
6. **Search**: Enhance search with filters
7. **Favorites**: Add favorites/pinned guides feature
8. **Export**: Add PDF export for guides

## Notes

- The app maintains compatibility with the existing Break Free features (reminders, settings)
- All API calls are made to the garde server
- Video processing happens in the background on the server
- The app polls for job status when processing videos
- All guides are stored on the server, not locally

## Troubleshooting

### API Connection Issues

- Check that the garde server is running
- Verify the API URL in `app.json`
- Check network connectivity

### Video Upload Issues

- Ensure file size is under 100MB
- Check device permissions for file access
- Verify server has sufficient storage

### AI Generation Issues

- Check server API keys (OpenAI, Anthropic)
- Verify user has premium subscription (if required)
- Check server logs for errors

## Support

For issues or questions, refer to the garde server documentation or check the server logs.
