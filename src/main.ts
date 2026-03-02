import './style.css';

type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
};

const APP_TITLE = 'Crypto Market Overview';
const STORAGE_KEY = 'crypto-watchlist';
const REFRESH_INTERVAL_MS = 30_000;
const API_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=16&page=1&sparkline=false';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element not found');
}

app.innerHTML = `
  <main class="page-shell">
    <header class="top-bar">
      <div>
        <p class="eyebrow">${APP_TITLE}</p>
        <h1>CryptoPulse Market</h1>
      </div>
      <p class="refresh-state" id="refresh-state">Loading market data...</p>
    </header>

    <section class="controls-card">
      <label class="search-group">
        <span>Search assets</span>
        <input id="search-input" type="text" placeholder="Search by coin name..." />
      </label>
      <button id="refresh-button" class="ghost-btn" type="button">Refresh now</button>
    </section>

    <section class="error-banner hidden" id="error-banner" role="alert"></section>

    <section class="section-block">
      <div class="section-head">
        <h2>My Watchlist</h2>
      </div>
      <div class="cards-grid" id="watchlist-grid"></div>
      <p id="watchlist-empty" class="empty-message">No watchlist coins yet. Add from Market Overview.</p>
    </section>

    <section class="section-block">
      <div class="section-head">
        <h2>Market Overview</h2>
      </div>
      <div class="cards-grid" id="market-grid"></div>
    </section>
  </main>
`;

const marketGrid = document.querySelector<HTMLDivElement>('#market-grid');
const watchlistGrid = document.querySelector<HTMLDivElement>('#watchlist-grid');
const watchlistEmpty = document.querySelector<HTMLParagraphElement>('#watchlist-empty');
const searchInput = document.querySelector<HTMLInputElement>('#search-input');
const refreshButton = document.querySelector<HTMLButtonElement>('#refresh-button');
const refreshState = document.querySelector<HTMLParagraphElement>('#refresh-state');
const errorBanner = document.querySelector<HTMLElement>('#error-banner');

if (
  !marketGrid ||
  !watchlistGrid ||
  !watchlistEmpty ||
  !searchInput ||
  !refreshButton ||
  !refreshState ||
  !errorBanner
) {
  throw new Error('One or more required DOM elements are missing');
}

const marketGridEl = marketGrid;
const watchlistGridEl = watchlistGrid;
const watchlistEmptyEl = watchlistEmpty;
const searchInputEl = searchInput;
const refreshButtonEl = refreshButton;
const refreshStateEl = refreshState;
const errorBannerEl = errorBanner;

let allCoins: Coin[] = [];
let watchlistIds = new Set<string>(readWatchlist());
let searchTerm = '';
let refreshTimer: number | null = null;

function readWatchlist(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function persistWatchlist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(watchlistIds)));
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

function formatChange(change: number | null): string {
  if (change === null) return 'N/A';
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
}

function createCoinCard(coin: Coin, isWatchlistSection: boolean): string {
  const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0;
  const isSelected = watchlistIds.has(coin.id);
  const buttonLabel = isSelected ? 'Remove from Watchlist' : 'Add to Watchlist';
  return `
    <article class="coin-card">
      <div class="coin-header">
        <div class="coin-meta">
          <img class="coin-icon" src="${coin.image}" alt="${coin.name} logo" />
          <div>
            <p class="coin-name">${coin.name}</p>
            <p class="coin-symbol">${coin.symbol.toUpperCase()}</p>
          </div>
        </div>
      </div>
      <p class="coin-price">${formatPrice(coin.current_price)}</p>
      <p class="coin-change ${isPositive ? 'is-up' : 'is-down'}">${formatChange(coin.price_change_percentage_24h)}</p>
      <button
        class="watch-btn ${isSelected ? 'watch-btn-active' : ''}"
        data-id="${coin.id}"
        data-origin="${isWatchlistSection ? 'watchlist' : 'market'}"
        type="button"
      >
        ${buttonLabel}
      </button>
    </article>
  `;
}

function renderWatchlist(): void {
  const watchlistCoins = allCoins.filter((coin) => watchlistIds.has(coin.id));
  watchlistGridEl.innerHTML = watchlistCoins.map((coin) => createCoinCard(coin, true)).join('');
  watchlistEmptyEl.classList.toggle('hidden', watchlistCoins.length > 0);
}

function renderMarket(): void {
  const filtered = allCoins.filter((coin) =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  if (filtered.length === 0) {
    marketGridEl.innerHTML = `<p class="empty-message">No coins found for "${searchTerm}".</p>`;
    return;
  }

  marketGridEl.innerHTML = filtered.map((coin) => createCoinCard(coin, false)).join('');
}

function renderAll(): void {
  renderWatchlist();
  renderMarket();
}

function setError(message: string): void {
  errorBannerEl.textContent = message;
  errorBannerEl.classList.remove('hidden');
}

function clearError(): void {
  errorBannerEl.textContent = '';
  errorBannerEl.classList.add('hidden');
}

async function fetchMarketData(): Promise<void> {
  refreshStateEl.textContent = 'Refreshing data...';
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as Coin[];
    allCoins = payload;
    clearError();
    renderAll();
    refreshStateEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  } catch {
    setError('Failed to fetch market data. Please try again in a few moments.');
    refreshStateEl.textContent = 'Live data unavailable';
  }
}

function toggleWatchlist(coinId: string): void {
  if (watchlistIds.has(coinId)) {
    watchlistIds.delete(coinId);
  } else {
    watchlistIds.add(coinId);
  }
  persistWatchlist();
  renderAll();
}

searchInputEl.addEventListener('input', (event) => {
  searchTerm = (event.target as HTMLInputElement).value;
  renderMarket();
});

refreshButtonEl.addEventListener('click', () => {
  void fetchMarketData();
});

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (!target.matches('.watch-btn')) {
    return;
  }
  const coinId = target.dataset.id;
  if (!coinId) {
    return;
  }
  toggleWatchlist(coinId);
});

void fetchMarketData();
refreshTimer = window.setInterval(() => {
  void fetchMarketData();
}, REFRESH_INTERVAL_MS);

window.addEventListener('beforeunload', () => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
  }
});
