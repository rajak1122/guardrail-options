const { calculateGreeks } = require("./greeksEngine");
const matchingEngine = require("./matchingEngine");
const candleAggregator = require("./candleAggregator");
const marketPriceStore = require("./marketPriceStore");
const PropAccount = require("../models/PropAccount");
const Position = require("../models/Position");
const riskWatchdog = require("./riskWatchdog");

class BrokerFeedManager {
  constructor() {
    this.isLive = false;
    this.isRiskEvaluationInProgress = false;

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

  getSimulatedOptionLtp(spotPrice, strike, optionType) {
    const diff = strike - spotPrice;

    const intrinsicValue =
      optionType === "CE" ? spotPrice - strike : strike - spotPrice;

    const timeValue = 150 * Math.exp(-Math.pow(diff / 300, 2));

    const randomValue = Math.random() * 5;

    const premium = Math.max(5, intrinsicValue + timeValue + randomValue);

    return Number(premium.toFixed(2));
  }

  generateOptionChain(spotPrice, symbol) {
    const strikes = [];
    const atmStrike = Math.round(spotPrice / 50) * 50; // 50-point intervals

    // Generate 6 strikes above and below ATM
    for (let i = -6; i <= 6; i++) {
      const strike = atmStrike + i * 50;
      const diff = strike - spotPrice;

      // Intrinsic + time value simulation for options buying
      const ceLtp = this.getSimulatedOptionLtp(spotPrice, strike, "CE");

      const peLtp = this.getSimulatedOptionLtp(spotPrice, strike, "PE");

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

      // Evaluate risk for every active trading account.
      if (!this.isRiskEvaluationInProgress) {
        this.isRiskEvaluationInProgress = true;

        try {
          // Fetch active accounts.
          const activeAccounts = await PropAccount.find({
            status: "ACTIVE",
          })
            .select("_id")
            .lean();

          const activeAccountIds = activeAccounts.map((account) => account._id);

          if (activeAccountIds.length > 0) {
            // Fetch all open positions belonging to active accounts.
            const openPositions = await Position.find({
              accountId: { $in: activeAccountIds },
            })
              .select("accountId symbol underlying strikePrice optionType")
              .lean();

            // Ensure every open position has a current simulated price.
            for (const position of openPositions) {
              const existingPrice = Number(currentPrices[position.symbol]);

              if (Number.isFinite(existingPrice) && existingPrice > 0) {
                continue;
              }

              const spotPrice = Number(this.spotPrices[position.underlying]);

              const strike = Number(position.strikePrice);

              if (
                !Number.isFinite(spotPrice) ||
                spotPrice <= 0 ||
                !Number.isFinite(strike) ||
                strike <= 0 ||
                !["CE", "PE"].includes(position.optionType)
              ) {
                continue;
              }

              currentPrices[position.symbol] = this.getSimulatedOptionLtp(
                spotPrice,
                strike,
                position.optionType,
              );
            }

            // Publish the latest market prices for other backend services.
            marketPriceStore.updatePrices(currentPrices);

            // Evaluate accounts independently.
            const evaluations = await Promise.allSettled(
              activeAccounts.map((account) =>
                riskWatchdog.evaluateAccountRisk(account._id, currentPrices),
              ),
            );

            evaluations.forEach((evaluation, index) => {
              const accountId = activeAccountIds[index];

              if (evaluation.status === "rejected") {
                console.error(
                  `Risk evaluation failed for account ${accountId}:`,
                  evaluation.reason,
                );
                return;
              }

              const result = evaluation.value;

              if (result?.breached) {
                console.log(
                  `🚨 Risk breach processed for account ${accountId}: ${result.breachReason}`,
                );
              } else if (result?.reason === "MISSING_POSITION_PRICES") {
                console.warn(
                  `Risk evaluation incomplete for account ${accountId}.`,
                );
              }
            });
          }
        } catch (err) {
          console.error("Error running account risk evaluations:", err);
        } finally {
          this.isRiskEvaluationInProgress = false;
        }
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
