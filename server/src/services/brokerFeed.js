const { calculateGreeks } = require("./greeksEngine");

class BrokerFeedManager {
  constructor() {
    this.isLive = false;
    this.spotPrices = {
      NIFTY: 23500.0,
      BANKNIFTY: 51200.0,
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
      this.startSimulator();
    }
  }

  initAngelOneWebSocket() {
    // TODO: Plug in official smartapi-javascript WebSocket connection here when live trading keys are ready
    console.log("🔌 Connecting to Angel One SmartAPI WebSocket...");
  }

  startSimulator() {
    // Simulate real-time Nifty & Bank Nifty ticks every 1 second
    setInterval(() => {
      // Random walk price shift (-5 to +5 points for Nifty, -15 to +15 for Bank Nifty)
      const niftyShift = (Math.random() - 0.49) * 10;
      const bankNiftyShift = (Math.random() - 0.49) * 30;

      this.spotPrices.NIFTY = Number(
        (this.spotPrices.NIFTY + niftyShift).toFixed(2),
      );
      this.spotPrices.BANKNIFTY = Number(
        (this.spotPrices.BANKNIFTY + bankNiftyShift).toFixed(2),
      );

      // Generate Option Chain snapshot for ATM strikes
      const niftyAtm = Math.round(this.spotPrices.NIFTY / 50) * 50;
      const callGreeks = calculateGreeks(
        "CE",
        this.spotPrices.NIFTY,
        niftyAtm,
        2 / 365,
        0.06,
        0.16,
      );
      const putGreeks = calculateGreeks(
        "PE",
        this.spotPrices.NIFTY,
        niftyAtm,
        2 / 365,
        0.06,
        0.18,
      );

      const tickPacket = {
        timestamp: Date.now(),
        spot: {
          NIFTY: this.spotPrices.NIFTY,
          BANKNIFTY: this.spotPrices.BANKNIFTY,
        },
        optionChainSample: {
          strike: niftyAtm,
          ce: { ...callGreeks, symbol: `NIFTY${niftyAtm}CE` },
          pe: { ...putGreeks, symbol: `NIFTY${niftyAtm}PE` },
        },
      };

      // Broadcast to all connected frontend clients via Socket.io
      if (global.io) {
        global.io.emit("market_tick", tickPacket);
      }
    }, 1000);
  }
}

module.exports = new BrokerFeedManager();
