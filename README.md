# SquadLift

SquadLift is a private workout tracking prototype for a squad of 4 friends. It is inspired by Hevy and focuses on fast gym logging, reusable routines, a shared squad feed, comments, fist bumps, streaks, and a collaborative exercise library.

## Current Status

This repo is currently a local-first React/Vite PWA prototype. App data is saved through a versioned local storage adapter, so workouts, routines, exercises, comments, reactions, active user, and local streaks persist on the current device only.

Supabase schema code is included as a future backend reference, but the app does not currently connect to Supabase, authenticate users, or sync data across devices.

The current production path is PWA-first for iOS and Android. A native Expo/React Native app should be treated as a later separate track after storage, auth, and sync are stable.

## Requirements

- Node.js 18+
- npm

## Run Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open the local URL printed by Vite. By default the app serves on:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev      # Start Vite dev server on port 3000
npm run lint     # Run TypeScript checks with no emitted files
npm run build    # Create a production build
npm run preview  # Preview the production build
npm run clean    # Remove generated dist/server artifacts
npm run test:storage # Verify local storage adapter fallback/import behavior
```

## Notes

- The current shell is mobile-first and centered for phone-sized use on desktop.
- The active user switcher, friend workout generator, local backup tools, build label, and Supabase schema reference live in the developer tools drawer.
- Real cross-device squad sync is planned for a later Supabase integration pass.
- Expo Go is useful for future experiments, but production native builds should use Expo development builds / EAS rather than Expo Go.
