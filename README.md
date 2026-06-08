# SquadLift

SquadLift is a private workout tracking prototype for a squad of 4 friends. It is inspired by Hevy and focuses on fast gym logging, reusable routines, a shared squad feed, comments, fist bumps, streaks, and a collaborative exercise library.

## Current Status

This repo is currently a local-first React/Vite prototype. App data is saved in browser `localStorage`, so workouts, routines, exercises, comments, and reactions persist on the current device only.

Supabase schema code is included as a future backend reference, but the app does not currently connect to Supabase, authenticate users, or sync data across devices.

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
```

## Notes

- The current shell is mobile-first and centered for phone-sized use on desktop.
- The active user switcher, friend workout generator, and Supabase schema reference live in the developer tools drawer.
- Real cross-device squad sync is planned for a later Supabase integration pass.
