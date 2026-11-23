const prices = new Map();

const DEFAULT_MAX_AGE_MS = 5000;
const RETAIN_FOR_MS = 60000;

/**
 * Store the latest valid market prices.
 * Each symbol keeps its own update timestamp.
 */
function updatePrices(priceMap = {}) {
  const updatedAt = Date.now();
  let updatedCount = 0;

  for (const [symbol, rawPrice] of Object.entries(priceMap)) {
    const price = Number(rawPrice);

    if (!symbol || !Number.isFinite(price) || price <= 0) {
      continue;
    }

    prices.set(symbol, {
      price,
      updatedAt,
    });

    updatedCount++;
  }

  // Remove old symbols to prevent unbounded memory growth.
  for (const [symbol, entry] of prices.entries()) {
    if (updatedAt - entry.updatedAt > RETAIN_FOR_MS) {
      prices.delete(symbol);
    }
  }

  return updatedCount;
}

/**
 * Return prices only when they are fresh enough.
 */
function getPriceSnapshot(symbols = [], maxAgeMs = DEFAULT_MAX_AGE_MS) {
  const currentPrices = {};
  const missingSymbols = [];
  const staleSymbols = [];

  const now = Date.now();

  for (const symbol of symbols) {
    const entry = prices.get(symbol);

    if (!entry) {
      missingSymbols.push(symbol);
      continue;
    }

    const ageMs = now - entry.updatedAt;

    if (ageMs > maxAgeMs) {
      staleSymbols.push(symbol);
      continue;
    }

    currentPrices[symbol] = entry.price;
  }

  return {
    currentPrices,
    missingSymbols,
    staleSymbols,
  };
}

module.exports = {
  updatePrices,
  getPriceSnapshot,
  DEFAULT_MAX_AGE_MS,
};
