# Crypto Market Overview

A placement-ready frontend project that recreates a Figma crypto dashboard with live market data, fast interactions, and persistent personalization using plain TypeScript and CSS.

## Live Links

- **Deployed App:** `https://pay3-a0h6khzyr-rishits-projects-95675e60.vercel.app/`
- **Repository:** `https://github.com/51riu5/pay3_assignment1`

## Why This Stands Out

- Figma-to-code UI reproduction without component libraries
- Real API integration with resilient error states
- Live data refresh every 30 seconds
- Search and watchlist UX with local persistence
- Clean architecture using modular rendering/state functions

## Features

### Level 1 - Market Viewer

- Fetches top cryptocurrencies from CoinGecko
- Displays coin name, symbol, current price, and 24h percentage change
- Visual gain/loss states:
  - Green for positive
  - Red for negative
- Auto-refreshes market data every 30 seconds
- Shows API warning state on request failures

### Level 2 - Search & Watchlist

- Real-time search filtering by coin name
- `Add to Watchlist` / `Remove from Watchlist` actions on cards
- Dedicated watchlist section
- Watchlist persisted in `localStorage`
- Watchlist restored on app load

### Level 3 - Deployment

- App deployed on Vercel with public URL

## Technical Overview

- **Stack:** TypeScript, Vite, Vanilla DOM APIs, custom CSS
- **No UI frameworks:** no Bootstrap, MUI, Tailwind, etc.
- **API Source:** CoinGecko Markets API
- **State:** in-memory app state + `localStorage` for watchlist

## Code Structure

- `src/main.ts`
  - API fetch + refresh cycle
  - Rendering logic for market and watchlist
  - Search and watchlist interactions
  - Error/warning handling and UI states
- `src/style.css`
  - Figma-inspired dark theme
  - Responsive layout and component styles
  - Interaction states (hover/focus/active/error)

## Run Locally

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```
