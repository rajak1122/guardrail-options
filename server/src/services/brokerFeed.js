const { calculateGreeks } = require("./greeksEngine");
const matchingEngine = require("./matchingEngine");
const candleAggregator = require("./candleAggregator");

class BrokerFeedManager {
  constructor() {
    this.isLive = false;
    this.spotPrices = {
      NIFTY: 25350.0,
      BANKNIFTY: 51800.0,
    };
    this.subscribers = [];
  }

  // Register socket.io server or listener for ticks
  onTick(callback) {
    this.subscribers.push(callback);
  }

  broadcast(tickData) {
    this.subscribers.forEach((cb) => cb(tickData));
  }

  startFeed(io) {
    console.log("⚡ Starting Guardrail Options Market Data Feed...");

    // Check if Angel One credentials are provided
    if (process.env.ANGEL_ONE_API_KEY && process.env.ANGEL_ONE_CLIENT_ID) {
      this.initAngelOneWebSocket();
    } else {
      console.log(
        "⚠️ No Angel One credentials detected in .env. Falling back to Built-in Market Simulator for weekend/local testing 🚀",
      );
      this.startSimulator(io);
    }
  }

  initAngelOneWebSocket() {
    // TODO: Plug in official smartapi-javascript WebSocket connection here when live trading keys are ready
    console.log("🔌 Connecting to Angel One SmartAPI WebSocket...");
  }

  generateOptionChain(spotPrice, symbol) {
    const strikes = [];
    const atmStrike = Math.round(spotPrice / 50) * 50; // 50-point intervals

    // Generate 6 strikes above and below ATM
    for (let i = -6; i <= 6; i++) {
      const strike = atmStrike + i * 50;
      const diff = strike - spotPrice;

      // Intrinsic + time value simulation for options buying
      let ceLtp = Math.max(
        5,
        spotPrice -
          strike +
          150 * Math.exp(-Math.pow(diff / 300, 2)) +
          Math.random() * 5,
      );
      let peLtp = Math.max(
        5,
        strike -
          spotPrice +
          150 * Math.exp(-Math.pow(diff / 300, 2)) +
          Math.random() * 5,
      );

      // Approximate Delta based on moneyness
      let ceDelta = 0.5 + (spotPrice - strike) / 400;
      ceDelta = Math.min(0.95, Math.max(0.05, ceDelta));
      let peDelta = -(1 - ceDelta);

      strikes.push({
        strike,
        ce: {
          symbol: `${symbol}24NOV${strike}CE`,
          ltp: Number(ceLtp.toFixed(2)),
          delta: Number(ceDelta.toFixed(2)),
        },
        pe: {
          symbol: `${symbol}24NOV${strike}PE`,
          ltp: Number(peLtp.toFixed(2)),
          delta: Number(peDelta.toFixed(2)),
        },
      });
    }

    return { symbol, spotPrice, chain: strikes };
  }

  startSimulator(io) {
    // Simulate real-time Nifty & Bank Nifty ticks every 1 second
    setInterval(async () => {
      // Random walk price shift (-5 to +5 points for Nifty, -12 to +12 for Bank Nifty)
      const niftyShift = (Math.random() - 0.49) * 12;
      const bankNiftyShift = (Math.random() - 0.49) * 25;

      this.spotPrices.NIFTY = Number(
        (this.spotPrices.NIFTY + niftyShift).toFixed(2),
      );
      this.spotPrices.BANKNIFTY = Number(
        (this.spotPrices.BANKNIFTY + bankNiftyShift).toFixed(2),
      );

      // Generate Option Chain snapshots
      const niftyChainData = this.generateOptionChain(
        this.spotPrices.NIFTY,
        "NIFTY",
      );
      const bankNiftyChainData = this.generateOptionChain(
        this.spotPrices.BANKNIFTY,
        "BANKNIFTY",
      );

      // Map current prices for matching engine evaluation
      const currentPrices = {};
      const currentGreeksMap = {};

      niftyChainData.chain.forEach((row) => {
        currentPrices[row.ce.symbol] = row.ce.ltp;
        currentPrices[row.pe.symbol] = row.pe.ltp;
        currentGreeksMap[row.ce.symbol] = {
          lcp: row.ce.ltp,
          delta: row.ce.delta,
        };
        currentGreeksMap[row.pe.symbol] = {
          lcp: row.pe.ltp,
          delta: row.pe.delta,
        };
      });

      // Evaluate pending limit / stop-loss orders against current tick prices
      try {
        await matchingEngine.evaluatePendingOrders(
          currentPrices,
          currentGreeksMap,
        );
      } catch (err) {
        console.error("Error evaluating pending orders:", err.message);
      }

      // Aggregate 1m candles for Spot indices & Option contracts
      const niftyCandle = await candleAggregator.processTick(
        "NIFTY",
        this.spotPrices.NIFTY,
        150,
      );
      const bankNiftyCandle = await candleAggregator.processTick(
        "BANKNIFTY",
        this.spotPrices.BANKNIFTY,
        150,
      );

      // Also aggregate candles for all active option strikes in NIFTY & BANKNIFTY
      const optionCandles = [];
      for (const row of [
        ...niftyChainData.chain,
        ...bankNiftyChainData.chain,
      ]) {
        const ceCandle = await candleAggregator.processTick(
          row.ce.symbol,
          row.ce.ltp,
          75,
        );
        const peCandle = await candleAggregator.processTick(
          row.pe.symbol,
          row.pe.ltp,
          75,
        );
        optionCandles.push(ceCandle, peCandle);
      }

      if (io) {
        io.emit("market_tick", { symbol: "NIFTY", ltp: this.spotPrices.NIFTY });
        io.emit("market_tick", {
          symbol: "BANKNIFTY",
          ltp: this.spotPrices.BANKNIFTY,
        });

        io.emit("candle_update", niftyCandle);
        io.emit("candle_update", bankNiftyCandle);
        optionCandles.forEach((c) => io.emit("candle_update", c));

        io.emit("option_chain_snapshot", niftyChainData);
        io.emit("option_chain_snapshot", bankNiftyChainData);
      }
    }, 1000);
  }
}

module.exports = new BrokerFeedManager();
