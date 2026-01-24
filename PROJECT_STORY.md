# The Story Behind Garde 🍳

## What Inspired This Project

You know that moment when you're scrolling through social media and you see an amazing recipe video—maybe it's your grandmother sharing her secret jollof rice technique on WhatsApp, or a Yoruba chef explaining how to make the perfect pounded yam—and you think, _"I need to save this!"_ But then what? You save it to your phone, bookmark it, or worse, try to frantically type out the ingredients while the video plays. A week later, you can't find it anymore.

That's exactly where **Garde** was born.

I wanted to build something that would preserve these precious moments—not just recipes, but _any_ kind of knowledge shared through video. Whether it's a craft tutorial in Yoruba, a furniture-making guide, or a family recipe passed down through generations, these videos contain knowledge that deserves to be easily accessible and searchable.

The real kicker? Most transcription services don't support Yoruba and many other African languages properly. I wanted to change that.

## How I Built It

Building Garde felt like assembling a complex puzzle with pieces from different boxes. Here's how it came together:

### The Foundation

I started with a **Next.js 14** frontend because I wanted that snappy, modern feel with server-side rendering. The backend runs on **Express.js** with **Supabase** handling both authentication and the database. I chose this stack because it's scalable, developer-friendly, and most importantly—affordable for users.

### The AI Magic

The heart of Garde is the AI pipeline:

```javascript
// The extraction flow looks something like this:
Video URL → yt-dlp downloads → FFmpeg extracts audio → 
Whisper transcribes (99 languages!) → Claude extracts structured recipe
```

I integrated **OpenAI's Whisper API** for transcription because it genuinely supports Yoruba and dozens of other languages—not just as an afterthought, but _really_ understands them. Then **Anthropic's Claude** takes that transcription and intelligently extracts the recipe or guide structure.

### The Mobile Experience

The web app became a PWA (Progressive Web App) so users can "install" it on their phones like a native app. But I also built a **React Native/Expo** companion app for a true mobile experience, complete with:

- Shopping list management with comparison features
- Meal planning with calendar integration
- Nutrition tracking and goal setting
- Activity journals
- Offline support with biometric authentication
- Push notifications for reminders

The mobile app uses **Zustand** for state management and **React Native Paper** for UI components, all styled with **NativeWind** (TailwindCSS for React Native).

## What I Learned

### Technical Lessons

**1. Streaming is Everything**

Initially, users would stare at a loading spinner for 60 seconds while the AI processed videos. That felt like an eternity. I implemented **Server-Sent Events (SSE)** to stream progress updates in real-time. Now users see: _"Downloading video... Transcribing... Extracting recipe..."_ The processing time didn't change, but the _experience_ improved dramatically.

**2. Prompt Caching is a Game-Changer**

My API bills were getting expensive until I discovered Claude's prompt caching. By caching the system instructions, I cut costs by **90%** and sped things up by **2x**. That's the difference between a sustainable project and an expensive hobby.

**3. Mobile-First Means Mobile-ONLY First**

I designed on desktop and adapted for mobile. Big mistake. I redesigned everything starting from a 320px phone screen, and the result was a much cleaner, more intuitive interface everywhere.

**4. State Management Matters**

I initially used React Context for everything. As the app grew, performance tanked. Switching to Zustand for the mobile app's shopping list and meal planner was like night and day—instant updates, no unnecessary re-renders, and the code became much cleaner.

**5. Offline-First is Hard but Worth It**

Building offline support meant thinking about sync conflicts, cache invalidation, and data consistency. I implemented a queue system for actions taken offline that automatically sync when the device comes back online. Users love being able to use the app anywhere—even in their kitchen with spotty WiFi.

### Human Lessons

**Real users don't read documentation**

I had to make the UI so intuitive that people could use it without instructions. Every error message needed to be actionable, every button needed to be obvious.

**Different cultures, different needs**

Testing with Nigerian users taught me that people don't just want to save recipes—they want to save soap-making tutorials, furniture assembly guides, and sewing patterns. That's why Garde supports _any_ how-to content, not just food.

**Accessibility isn't optional**

I initially thought biometric auth was just a "nice to have." After seeing how much faster it made the login experience, and how much users with accessibility needs appreciated proper keyboard navigation and screen reader support, I realized it should have been there from day one.

## The Challenges I Faced

### Challenge #1: The TikTok/Instagram Blocking Nightmare 😤

Social media platforms _really_ don't want you downloading videos. They constantly change their APIs and block automated tools. 

**Solution:** I implemented a fallback system. If `yt-dlp` fails to download, users can upload the video file directly. Not elegant, but it works.

### Challenge #2: Video File Sizes

Users wanted to upload 20-minute cooking shows in 4K. Great for quality, terrible for servers and API costs.

**Solution:** I added intelligent compression using FFmpeg. The app now:
- Extracts only audio (not video) for transcription
- Compresses audio to 64kbps (perfectly fine for speech)
- Limits uploads to 100MB with clear messaging

### Challenge #3: The "It Works on My Machine" Syndrome

I developed on a Mac. My first tester was on Windows. Nothing worked. FFmpeg wasn't in PATH, the file paths were wrong, environment variables weren't loading...

**Solution:** I created comprehensive setup scripts (`start-app.bat` for Windows, proper shell scripts for Mac/Linux) and documented _everything_. I also built in better error messages that actually tell users what's wrong.

### Challenge #4: The Yoruba Testing Problem

I'm not a native Yoruba speaker. How do I know if the transcription is actually accurate?

**Solution:** I reached out to native speakers in the Nigerian tech community. They tested it with cooking videos, voice notes, and even church sermons. The feedback was invaluable and led to better prompt engineering for Claude to understand cultural context.

### Challenge #5: Making It Affordable

At first, processing a 5-minute video cost $0.50. For casual users, that would add up fast.

**Solution:** Multiple optimizations:
- Implemented prompt caching (90% cost reduction)
- Removed unnecessary image fetching
- Used more efficient audio encoding
- Now costs ~$0.03-0.05 per video 🎉

### Challenge #6: The Shopping List Race Condition

Users would add items to their shopping list, the app would crash, and they'd lose everything. Turns out, multiple rapid updates to Zustand were causing state conflicts.

**Solution:** I implemented a proper action queue with debouncing. Now all updates are batched and persisted immediately to AsyncStorage. The app can crash (it doesn't anymore, but still), and users won't lose data.

### Challenge #7: Android Build Hell

Getting the React Native app to build for Android was a nightmare. Gradle errors, SDK version mismatches, keystore issues...

**Solution:** I created detailed setup guides (`ANDROID_SETUP_CLI_GUIDE.md`) and automated scripts (`setup-android-sdk.ps1`). I also learned to love EAS Build from Expo—it handles all the complexity in the cloud.

## The Tech Stack

### Frontend (Web)
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Beautiful, customizable icons
- **PWA** - Installable web app

### Mobile App
- **React Native** with **Expo**
- **NativeWind** - Tailwind for React Native
- **Zustand** - State management
- **React Native Paper** - UI components
- **Expo Router** - File-based routing
- **AsyncStorage** - Local persistence
- **Expo Notifications** - Push notifications

### Backend
- **Node.js + Express.js** - REST API
- **Supabase** - PostgreSQL database + authentication
- **OpenAI Whisper API** - Multilingual transcription
- **Anthropic Claude API** - AI extraction
- **yt-dlp** - Video downloading
- **FFmpeg** - Audio extraction and processing

### DevOps
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **EAS Build** - Mobile app building
- **Git** - Version control

## Key Features

### Web App
✅ Video URL processing (TikTok, YouTube, Instagram)  
✅ Direct video file upload  
✅ AI-powered transcription (99 languages including Yoruba)  
✅ Intelligent recipe/guide extraction  
✅ Google Keep-style card interface  
✅ Real-time streaming progress updates  
✅ Full CRUD operations on guides  
✅ Search and filtering  
✅ Mobile-responsive design  
✅ PWA support  

### Mobile App
✅ Native iOS and Android support  
✅ Shopping list with checkbox tracking  
✅ Shopping list comparison (planned vs actual)  
✅ Meal planner with calendar  
✅ Nutrition tracking  
✅ Goal setting (weight, fitness, dietary)  
✅ Activity journal  
✅ Reminders and notifications  
✅ Biometric authentication  
✅ Offline mode  
✅ Beautiful native UI  

## What's Next?

Garde is live and working, but there's so much more I want to add:

### Short Term
- [ ] Recipe sharing with friends and family
- [ ] Collections and folders for organizing guides
- [ ] Voice notes — just record yourself explaining a recipe
- [ ] Export to PDF for printing
- [ ] Recipe remixing — combine multiple guides

### Medium Term
- [ ] Meal planning with auto-generated grocery lists
- [ ] Cooking timers integrated into recipes
- [ ] Smart ingredient substitutions
- [ ] Nutritional analysis for recipes
- [ ] Social features — follow other users, like recipes

### Long Term
- [ ] Computer vision for extracting recipes from photos
- [ ] Live cooking mode with step-by-step guidance
- [ ] Smart kitchen device integration
- [ ] Recipe marketplace
- [ ] Multi-language recipe translation

## Deployment & Costs

### Development Setup
- **Time to set up:** ~30 minutes
- **Cost:** Free (except API credits)

### API Costs (Pay-as-you-go)
- **Light use** (10-20 videos/month): $2-4/month
- **Moderate use** (50-100 videos/month): $5-10/month
- **Heavy use** (200+ videos/month): $15-25/month

### Hosting (Optional always-on)
- **Free tier:** Vercel + Render + Supabase = $0/month
- **Paid tier:** ~$7-10/month for better performance

## Lessons for Other Developers

**1. Start simple, then optimize**
My first version didn't have streaming, caching, or half the features it has now. Ship something that works, then make it better based on real usage.

**2. Test with real users early**
I thought I knew what users wanted. I was wrong. Testing with actual people in Nigeria taught me more in a week than months of solo development.

**3. Document as you go**
I created 50+ documentation files during development. Future me (and my users) thank past me every day.

**4. Error messages are UX**
Don't just say "Error processing video." Say "We couldn't download this TikTok video. Try uploading the video file directly instead."

**5. Mobile users are your primary users**
Even though I built a web app first, 80% of usage is on mobile. Design for the smallest screen first.

**6. Offline support isn't optional**
In many parts of Nigeria (my target market), internet is spotty. Building offline-first made the app usable everywhere.

**7. Use the right tool for the job**
I spent weeks fighting with custom state management before discovering Zustand solved my problems in an afternoon.

## Try It Out!

The code is open source and the app is live. You can:
- **Self-host** for complete control and privacy
- **Use the hosted version** for convenience
- **Fork and customize** for your own needs

Whether you're preserving your grandmother's recipes, learning new crafts, or just tired of losing good videos, Garde is here to help.

---

## Links

- **Web App:** [https://garde-app.vercel.app](#)
- **GitHub (Backend/Web):** [https://github.com/yourusername/garde](#)
- **GitHub (Mobile):** [https://github.com/yourusername/recipiehunter](#)
- **Documentation:** See README.md files in each repo

## Contact

Built by [Your Name] with ❤️ for preserving knowledge in all languages.

- Email: your.email@example.com
- Twitter: [@yourhandle](#)
- LinkedIn: [Your Profile](#)

---

_"Every recipe saved is a story preserved. Every guide shared is knowledge passed down."_
