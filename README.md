# Crypto Market Overview (PAY3 Assignment 1)

A Figma-inspired frontend application built with TypeScript and Vite using only basic CSS (no UI libraries).

## Live Features Implemented

### Level 1 - Market Viewer

- Fetches top cryptocurrencies from CoinGecko Markets API.
- Displays:
  - Coin name
  - Symbol
  - Current price (USD)
  - 24h price change (%)
- Positive change is shown in green, negative change in red.
- Auto-refreshes market data every 30 seconds.
- Shows an error banner if API calls fail.

### Level 2 - Search and Watchlist

- Search input filters coins by name in real time.
- Each coin includes an `Add to Watchlist` / `Remove from Watchlist` action.
- Watchlist section is rendered separately from market overview.
- Watchlist is persisted to `localStorage`.
- Watchlist is restored on page load.

## Architecture

- `src/main.ts`
  - App bootstrap and UI template rendering
  - CoinGecko API integration
  - Auto-refresh timer logic
  - Search filtering
  - Watchlist state management and `localStorage` persistence
- `src/style.css`
  - Full custom styling for dark Figma-inspired layout
  - Responsive behavior for smaller screens
  - Card states and color system for market changes

## Tech Stack

- Vite
- TypeScript
- Vanilla DOM API
- Basic CSS

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Deployment

This app can be deployed to Vercel, Netlify, or GitHub Pages.

### Vercel (recommended)

1. Push this repo to GitHub.
2. Import the project into Vercel.
3. Build command: `npm run build`
4. Output directory: `dist`

### Netlify

1. Connect repository.
2. Build command: `npm run build`
3. Publish directory: `dist`

> Add your deployed URL to this README once deployed.
