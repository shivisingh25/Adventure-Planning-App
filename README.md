# Adventure Planner

Adventure Planner is a React Native (Expo) app that helps users plan, search, and navigate routes with multiple milestones using interactive maps.

## Features

- **Search Places:** Find locations using GraphHopper API.
- **Route Optimization:** Automatically optimize the order of milestones for efficient travel.
- **Interactive Map:** View milestones, routes, and your current location on a map.
- **Navigation:** Step-by-step navigation through milestones.
- **Milestone Tracking:** Mark milestones as completed and track progress.
- **Customizable Duration:** Set time durations for each milestone.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Google Maps API Key (for Places and Maps)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Adventure-Planner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Create a `.env` file in the root directory:
     ```
     EXPO_PUBLIC_GRAPHHOPPER_API_KEY=your_google_maps_api_key
     ```

4. **Start the development server:**
   ```bash
   npx expo start
   ```

5. **Run on your device or emulator:**
   - Scan the QR code with Expo Go, or run on an emulator.

## Project Structure

```
Adventure-Planner/
├── app/                # App screens and navigation
│   ├── (tabs)/         # Tab screens: plan, navigate, profile
│   └── _layout.tsx     # App layout
├── components/         # Reusable UI components
├── constants/          # App-wide constants
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── types/              # TypeScript types
├── utils/              # Utility functions (API, location, route optimization)
├── assets/             # Fonts and images
├── .env                # Environment variables
├── package.json
└── README.md
```

## Key Files

- `app/(tabs)/plan.tsx` — Search and plan your route.
- `app/(tabs)/navigate.tsx` — Navigate your optimized route.
- `components/RouteMap.tsx` — Map display with milestones and routes.
- `utils/placeSearchService.ts` — GraphHopper API integration.
- `utils/routeOptimization.ts` — Route optimization algorithms.

## Configuration

- **GraphHopper API Key:**  
  Add your API key to `.env` and configure it in `app.json` for Android/iOS if needed.

---

**Enjoy planning your next