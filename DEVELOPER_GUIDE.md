# Developer Guide - Thingy App

## What is Thingy?

Thingy is a **React Native mobile application** for cricket prediction gaming. Users can predict outcomes of live cricket matches, participate in 1v1 battles, join community contests, and earn tokens through correct predictions.

**Tagline:** PREDICT · BATTLE · WIN

## Core Features

### 1. Authentication
- Google OAuth sign-in via Supabase
- Automatic session management
- Deep link handling for OAuth callbacks
- 1,000 free tokens on signup

### 2. Home Dashboard
- Live cricket match display (currently mock data)
- Open contests listing with entry fees and prize pools
- Ball Rush game availability
- User token balance display
- Real-time updates via Socket.io

### 3. 1v1 Battles
- Real-time head-to-head prediction battles
- Matchmaking system to find opponents
- Ball-by-ball predictions
- Points system (exact vs near predictions)
- Win/loss tracking with streaks

### 4. Ball Rush
- Predict every ball outcome in live matches
- Time-limited prediction windows
- Crowd predictions display
- Token betting system
- Leaderboard integration

### 5. Community Contests
- Match winner predictions
- Over-based predictions (e.g., "8+ runs in next over")
- Prize pool distribution
- Participant limits and time limits

### 6. Wallet & Economy
- Token balance tracking
- Earning methods (wins, streaks, referrals, daily bonuses)
- Statistics display (wins, streak, level)
- Transaction history

### 7. Profile
- User profile management
- Gaming statistics
- Achievement tracking

## Architecture Overview

### Frontend Stack
- **Framework:** React Native 0.84.1
- **Language:** TypeScript
- **Navigation:** React Navigation (Native Stack + Bottom Tabs)
- **State Management:** Zustand
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Icons:** React Native Vector Icons
- **Networking:** Socket.io-client, Axios
- **Authentication:** Supabase Auth
- **Animations:** React Native Reanimated

### Backend Stack (Planned)
- **Server:** Node.js with Express
- **Real-time:** Socket.io
- **Database:** PostgreSQL/Supabase
- **Caching:** Redis
- **Data Source:** Cricket API (CricAPI/SportRadar)

### Current State
- Frontend: ✅ Fully functional with mock data
- Backend: ❌ Not implemented (using mock socket service)
- Real-time Data: ❌ Using hardcoded mock data
- Authentication: ✅ Connected to Supabase

## Project Structure

```
thingy/
├── src/
│   ├── components/        # Reusable UI components
│   ├── config/           # Configuration files (Supabase, theme, constants)
│   ├── constants/        # App constants
│   ├── navigation/       # Navigation setup (Stack, Tabs)
│   ├── screens/          # Screen components
│   │   ├── AuthScreen.tsx          # Google sign-in
│   │   ├── HomeScreen.tsx          # Main dashboard
│   │   ├── BattleScreen.tsx        # 1v1 battle gameplay
│   │   ├── BallRushScreen.tsx      # Ball-by-ball predictions
│   │   ├── ContestScreen.tsx       # Contest details
│   │   ├── MatchmakingScreen.tsx   # Finding opponents
│   │   ├── ResultScreen.tsx        # Battle results
│   │   ├── WalletScreen.tsx        # Token balance & stats
│   │   ├── ProfileScreen.tsx       # User profile
│   │   └── SplashScreen.tsx        # App loading screen
│   ├── services/         # External service integrations
│   │   ├── gameService.ts         # Game logic
│   │   └── notificationService.ts  # Push notifications
│   ├── socket/           # Socket.io client
│   │   └── socketService.ts       # Real-time communication (currently mocked)
│   ├── store/            # Zustand state management
│   │   ├── authStore.ts           # Authentication state
│   │   ├── gameStore.ts           # Game state
│   │   └── userStore.ts           # User data
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   │   └── mockData.ts           # Mock data generators
│   └── assets/           # Images, fonts, etc.
├── android/              # Android native code
├── ios/                  # iOS native code
├── App.tsx               # Root component
├── package.json          # Dependencies
└── ROADMAP.md            # Feature roadmap
```

## Key Files Explained

### Entry Points

**`App.tsx`** - Root component that sets up:
- Gesture handler for gestures
- Safe area provider for notched devices
- Status bar configuration
- Main navigation (AppNavigator)

**`index.js`** - React Native entry point that registers the app

### Navigation

**`src/navigation/AppNavigator.tsx`** - Main navigation stack:
- Handles splash screen → auth → main app flow
- Deep link handling for OAuth callbacks
- Screen configuration and animations
- Session state management

**`src/navigation/TabNavigator.tsx`** - Bottom tab navigation:
- Home, Wallet, Profile tabs
- Tab icon configuration

### State Management

**`src/store/authStore.tsx`** - Authentication state:
- User session management
- Google OAuth functions
- Token balance
- User statistics (wins, streak, level)
- Session persistence

**`src/store/gameStore.ts`** - Game state:
- Current battle state
- Opponent data
- Score tracking
- Prediction history

**`src/store/userStore.ts`** - User profile data:
- Profile information
- Settings

### Socket Service

**`src/socket/socketService.ts`** - Real-time communication:
- Currently uses `MockSocketService` (no backend)
- Switches to `RealSocketService` when `BACKEND_URL` is set
- Handles events: matchFound, ballResult, liveMatches, contests, Ball Rush events
- **To enable real backend:** Set `BACKEND_URL` to your server URL

### Screens

**`src/screens/HomeScreen.tsx`** - Main dashboard:
- Displays live matches (currently `MOCK_MATCHES`)
- Shows open contests (currently `MOCK_CONTESTS`)
- Ball Rush match list
- Socket listeners for real-time updates
- Pull-to-refresh functionality

**`src/screens/BattleScreen.tsx`** - 1v1 battle gameplay:
- Match scenario display
- Prediction options (dot, single, boundary, six, wicket, extra)
- Ball-by-ball progression
- Score comparison with opponent
- Real-time socket events

**`src/screens/BallRushScreen.tsx`** - Ball-by-ball predictions:
- Live match score display
- Prediction window timer
- Crowd prediction percentages
- Token betting
- Ball result display

**`src/screens/WalletScreen.tsx`** - Token management:
- Balance display
- Statistics (wins, streak, level)
- How to earn tokens guide

### Configuration

**`src/config/supabase.ts`** - Supabase client:
- Database connection
- Authentication client
- Environment variables

**`src/config/theme.ts`** - App theme:
- Color palette (primary, gold, live, etc.)
- Typography settings
- Shadow configurations

**`src/config/constants.ts`** - Game constants:
- Point values (exact, near)
- Timing configurations
- Game rules

## How Things Work

### Authentication Flow

1. User opens app → `SplashScreen`
2. No session found → `AuthScreen`
3. User taps "Continue with Google"
4. Opens Google sign-in in browser
5. User authenticates
6. Browser redirects to `thingy://auth/callback`
7. `AppNavigator` detects deep link
8. `handleOAuthCallback` processes the session
9. User redirected to main app (`Tabs`)
10. User data fetched and stored in `authStore`

### 1v1 Battle Flow

1. User taps "Find Opponent" on home
2. Navigates to `MatchmakingScreen`
3. Socket emits `findMatch` event
4. Backend finds opponent (or mock simulates)
5. Socket emits `matchFound` event
6. Navigates to `BattleScreen`
7. Each ball:
   - User selects prediction
   - Socket emits `submitPrediction`
   - Opponent predicts (mock: random delay)
   - Socket emits `ballResult` with outcome
   - Points calculated and displayed
8. After all balls: `gameEnd` event
9. Navigate to `ResultScreen`

### Ball Rush Flow

1. User sees live Ball Rush matches on home
2. Taps match → navigates to `BallRushScreen`
3. Socket emits `subscribeBallRush`
4. Socket emits `ballRushWindow` with prediction options
5. User selects prediction and bets tokens
6. Socket emits `submitBallRushPrediction`
7. Window closes after timer
8. Socket emits `ballRushResult` with actual outcome
9. Tokens won/lost calculated

### Data Flow (Current - Mock)

```
HomeScreen
  ↓ (uses)
MOCK_MATCHES (hardcoded)
MOCK_CONTESTS (hardcoded)
  ↓ (receives)
SocketService (Mock)
  ↓ (simulates)
Random data generation
```

### Data Flow (Planned - Real)

```
HomeScreen
  ↓ (connects)
SocketService (Real)
  ↓ (connects to)
Backend Server (Node.js + Socket.io)
  ↓ (fetches from)
Cricket API (CricAPI/SportRadar)
  ↓ (caches in)
Redis
  ↓ (persists in)
PostgreSQL/Supabase
```

## Development Setup

### Prerequisites

- Node.js >= 22.11.0
- npm or yarn
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS, macOS only)
- CocoaPods (for iOS)

### Installation

```bash
# Install dependencies
npm install

# For iOS only (first time)
cd ios
bundle install
bundle exec pod install
cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Environment Variables

Create a `.env` file in the root:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (when implemented)
BACKEND_URL=http://localhost:3001
```

### Key Dependencies

- `@react-navigation/native` - Navigation
- `zustand` - State management
- `@supabase/supabase-js` - Backend/auth
- `socket.io-client` - Real-time communication
- `nativewind` - Tailwind CSS for React Native
- `react-native-reanimated` - Animations

## Current Limitations

1. **No Real Backend** - Using mock socket service
2. **No Real Match Data** - Hardcoded IPL matches
3. **No Real-time Updates** - Simulated via timers
4. **No Payment Integration** - Tokens are virtual only
5. **No Push Notifications** - Notification service exists but not configured

## Development Workflow

### Adding a New Screen

1. Create screen in `src/screens/`
2. Add to navigation in `src/navigation/AppNavigator.tsx`
3. Add types to `RootStackParamList`
4. Import and use in navigation

### Adding a New Socket Event

1. Add event name to `SocketEvent` type in `src/socket/socketService.ts`
2. Implement handler in `RealSocketService` and `MockSocketService`
3. Add listener in relevant screen
4. Clean up listener in `useEffect` cleanup

### Updating Theme

Edit `src/config/theme.ts`:
- Colors: Update color palette
- Typography: Update font sizes/weights
- Shadows: Update shadow configurations

### Testing

```bash
# Run tests
npm test

# Run linting
npm run lint
```

## Common Tasks

### Switch from Mock to Real Backend

1. Set up backend server (see ROADMAP.md)
2. In `src/socket/socketService.ts`, set:
   ```typescript
   export const BACKEND_URL: string | null = 'http://your-backend-url';
   ```
3. Remove mock data from screens
4. Test with real backend

### Add New Contest Type

1. Update `Contest` type in relevant screen
2. Add to mock data generator
3. Update UI to handle new type
4. Add socket event for new contest type

### Change Game Rules

1. Update constants in `src/config/constants.ts`
2. Update point calculation logic in `src/socket/socketService.ts`
3. Update UI to reflect new rules
4. Test thoroughly

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache
npm start -- --reset-cache

# Clear Metro cache
rm -rf node_modules/.cache
```

### iOS Build Issues

```bash
# Reinstall pods
cd ios
bundle exec pod install
cd ..

# Clean build folder
# In Xcode: Product → Clean Build Folder
```

### Android Build Issues

```bash
# Clean gradle
cd android
./gradlew clean
cd ..

# Rebuild
npm run android
```

### Socket Connection Issues

- Check `BACKEND_URL` is set correctly
- Verify backend server is running
- Check CORS configuration on backend
- Test with `MockSocketService` first

## Resources

- [React Native Docs](https://reactnative.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Supabase Docs](https://supabase.com/docs)
- [Socket.io Docs](https://socket.io/docs/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)

## Next Steps for New Developers

1. Read this guide completely
2. Set up development environment
3. Run the app with mock data
4. Explore each screen and understand the flow
5. Read `ROADMAP.md` for planned features
6. Start with small tasks (UI changes, bug fixes)
7. Gradually move to backend integration

## Questions?

If you have questions about:
- **Architecture:** Check the project structure section
- **Specific feature:** Look at the relevant screen file
- **State management:** Check the store files
- **Socket events:** Check `socketService.ts`
- **Navigation:** Check navigation files
- **Theming:** Check `theme.ts`

---

**Last Updated:** April 2026
**App Version:** 0.0.1
**Status:** Development (Mock Data Phase)
