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
    <p class="page-title">${APP_TITLE}</p>

    <section class="dashboard">
      <header class="dashboard-nav">
        <div class="brand-wrap">
          <p class="brand-logo">B</p>
          <p class="brand-name">Crypto<span>Pulse</span></p>
          <nav class="nav-tabs">
            <a class="tab-link tab-active" href="#">Market</a>
            <a class="tab-link" href="#">Portfolio</a>
            <a class="tab-link" href="#">Exchange</a>
          </nav>
        </div>
        <div class="nav-actions">
          <label class="search-input-wrap">
            <span class="search-icon">Q</span>
            <input id="search-input" type="text" placeholder="Search assets..." />
          </label>
          <button class="icon-btn" type="button" aria-label="Notifications">!</button>
          <p class="avatar">JD</p>
        </div>
      </header>

      <section class="section-block">
        <div class="section-head section-head-watch">
          <div>
            <h2>My Watchlist</h2>
            <p class="section-subtitle">Your personalized collection of assets</p>
          </div>
          <a class="text-link" href="#">Edit List</a>
        </div>
        <div class="cards-grid" id="watchlist-grid"></div>
        <button id="watchlist-add-slot" class="add-card hidden" type="button">
          <span class="plus-circle">+</span>
          <span>Add asset to watchlist</span>
        </button>
        <p id="watchlist-empty" class="empty-message hidden">No watchlist coins yet. Add from Market Overview.</p>
      </section>

      <section class="section-block">
        <div class="section-head section-head-market">
          <div>
            <h2>Market Overview</h2>
            <p class="section-subtitle">Real-time data for top performing assets</p>
          </div>
          <button class="primary-chip" type="button">All Assets</button>
        </div>
        <div class="cards-grid" id="market-grid"></div>
      </section>

      <footer class="bottom-row">
        <button class="outline-pill" type="button">View All Cryptocurrencies</button>
        <section id="api-warning" class="warning-card" role="alert">
          <div class="warning-icon">!</div>
          <div class="warning-text">
            <p id="warning-title" class="warning-title">API Connection Stable</p>
            <p id="warning-message" class="warning-message">Last update pending...</p>
          </div>
        </section>
      </footer>
    </section>
  </main>
`;

const marketGrid = document.querySelector<HTMLDivElement>('#market-grid');
const watchlistGrid = document.querySelector<HTMLDivElement>('#watchlist-grid');
const watchlistAddSlot = document.querySelector<HTMLButtonElement>('#watchlist-add-slot');
const watchlistEmpty = document.querySelector<HTMLParagraphElement>('#watchlist-empty');
const searchInput = document.querySelector<HTMLInputElement>('#search-input');
const apiWarning = document.querySelector<HTMLElement>('#api-warning');
const warningTitle = document.querySelector<HTMLParagraphElement>('#warning-title');
const warningMessage = document.querySelector<HTMLParagraphElement>('#warning-message');

if (
  !marketGrid ||
  !watchlistGrid ||
  !watchlistAddSlot ||
  !watchlistEmpty ||
  !searchInput ||
  !apiWarning ||
  !warningTitle ||
  !warningMessage
) {
  throw new Error('One or more required DOM elements are missing');
}

const marketGridEl = marketGrid;
const watchlistGridEl = watchlistGrid;
const watchlistAddSlotEl = watchlistAddSlot;
const watchlistEmptyEl = watchlistEmpty;
const searchInputEl = searchInput;
const apiWarningEl = apiWarning;
const warningTitleEl = warningTitle;
const warningMessageEl = warningMessage;

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
        <button class="star-btn" data-id="${coin.id}" type="button" aria-label="Toggle watchlist">
          ${isSelected ? '★' : '☆'}
        </button>
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
  watchlistEmptyEl.classList.toggle('hidden', watchlistCoins.length !== 0);
  watchlistAddSlotEl.classList.toggle('hidden', watchlistCoins.length >= 4);
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
  apiWarningEl.classList.add('warning-error');
  warningTitleEl.textContent = 'API Connection Warning';
  warningMessageEl.textContent = message;
}

function clearError(): void {
  apiWarningEl.classList.remove('warning-error');
  warningTitleEl.textContent = 'API Connection Stable';
}

async function fetchMarketData(): Promise<void> {
  warningMessageEl.textContent = 'Fetching latest market data...';
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as Coin[];
    allCoins = payload;
    clearError();
    renderAll();
    warningMessageEl.textContent = `Last updated at ${new Date().toLocaleTimeString()}. Auto-refresh every 30 seconds.`;
  } catch {
    setError('Real-time prices may be delayed by up to 30 seconds. Checking connection...');
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

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (!target.matches('.watch-btn, .star-btn')) {
    return;
  }
  const coinId = target.dataset.id;
  if (!coinId) {
    return;
  }
  toggleWatchlist(coinId);
});

watchlistAddSlotEl.addEventListener('click', () => {
  searchInputEl.focus();
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
