/**
 * Black-Scholes Option Pricing & Greeks Calculator for Options Buying
 * Calculates Call/Put prices, Delta, Theta, Gamma, and Vega.
 */

// Standard Normal Cumulative Distribution Function
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let probability =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) probability = 1 - probability;
  return probability;
}

// Standard Normal Probability Density Function
function normalPDF(x) {
  return Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculate Option Price & Greeks
 * @param {string} type - 'CE' (Call) or 'PE' (Put)
 * @param {number} S - Spot Price (e.g., Nifty Spot)
 * @param {number} K - Strike Price
 * @param {number} T - Time to Expiry in Years (e.g., 2 days expiry = 2 / 365)
 * @param {number} r - Risk-free interest rate (e.g., 0.06 for 6%)
 * @param {number} sigma - Volatility / IV (e.g., 0.18 for 18%)
 */
function calculateGreeks(type, S, K, T, r = 0.06, sigma = 0.18) {
  if (T <= 0) T = 0.0001; // Prevent division by zero on expiry day

  const d1 =
    (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  let optionPrice = 0;
  let delta = 0;
  let gamma = 0;
  let theta = 0;
  let vega = 0;

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2.valueOf());
  const nd1 = normalPDF(d1);

  if (type === "CE") {
    optionPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    delta = Nd1;
    theta =
      ((-S * nd1 * sigma) / (2 * Math.sqrt(T)) -
        r * K * Math.exp(-r * T) * Nd2) /
      365; // Daily theta decay
  } else {
    const N_minus_d1 = normalCDF(-d1);
    const N_minus_d2 = normalCDF(-d2);
    optionPrice = K * Math.exp(-r * T) * N_minus_d2 - S * N_minus_d1;
    delta = Nd1 - 1;
    theta =
      ((-S * nd1 * sigma) / (2 * Math.sqrt(T)) +
        r * K * Math.exp(-r * T) * N_minus_d2) /
      365;
  }

  gamma = nd1 / (S * sigma * Math.sqrt(T));
  vega = (S * nd1 * Math.sqrt(T)) / 100; // Scaled for 1% change in IV

  return {
    lcp: Math.max(0.05, Number(optionPrice.toFixed(2))),
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(4)),
    theta: Number(theta.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    iv: Number((sigma * 100).toFixed(2)),
  };
}

module.exports = { calculateGreeks };
