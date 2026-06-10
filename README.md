# SquadLift

SquadLift is a private workout tracking prototype for a squad of friends. It is inspired by Hevy and focuses on fast gym logging, reusable routines, workout history, profile stats, and a collaborative exercise library.

## Current Status

This repo is currently a local-first React/Vite PWA. App data is saved through a versioned local storage adapter first, so workouts, routines, exercises, active user, and local streaks still work from the current device.

Supabase sync is active for the private squad flow. Email/password sign-in persists per device, supported local saves auto-push to Supabase, safe app open/sign-in/reconnect events auto-pull shared data, and failed auto-pushes queue locally for retry. The current Supabase implementation plan lives in `docs/SUPABASE_PLAN.md`.

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
npm run test:supabase # Verify Supabase RLS and shared workout reads
```

## Notes

- The current shell is mobile-first and centered for phone-sized use on desktop.
- The active user switcher, friend workout generator, local backup tools, build label, and Supabase controls live in the developer tools drawer.
- Deployed two-account browser QA is passing; the remaining sync milestone is real friend-phone QA on iPhone Safari / installed PWA.
- Expo Go is useful for future experiments, but production native builds should use Expo development builds / EAS rather than Expo Go.
