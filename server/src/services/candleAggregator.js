const Candle = require("../models/Candle");

class CandleAggregator {
  constructor() {
    this.activeCandles = {};
  }

  async processTick(symbol, ltp, volumeIncrement = 75) {
    const now = Date.now();
    const minuteTimestamp = Math.floor(now / 60000) * 60000;
    const tvTime = Math.floor(minuteTimestamp / 1000);

    const candleKey = `${symbol}_1m_${minuteTimestamp}`;

    if (!this.activeCandles[candleKey]) {
      this.activeCandles[candleKey] = {
        symbol,
        timeframe: "1m",
        time: tvTime,
        open: ltp,
        high: ltp,
        low: ltp,
        close: ltp,
        volume: volumeIncrement,
      };
    } else {
      const c = this.activeCandles[candleKey];
      c.high = Math.max(c.high, ltp);
      c.low = Math.min(c.low, ltp);
      c.close = ltp;
      c.volume += volumeIncrement;
    }

    const currentCandle = this.activeCandles[candleKey];

    try {
      await Candle.findOneAndUpdate(
        {
          symbol: currentCandle.symbol,
          timeframe: currentCandle.timeframe,
          time: currentCandle.time,
        },
        {
          $set: {
            open: currentCandle.open,
            high: currentCandle.high,
            low: currentCandle.low,
            close: currentCandle.close,
            volume: currentCandle.volume,
          },
        },
        { upsert: true, new: true },
      );
    } catch (err) {
      console.error("Error saving candle aggregation:", err.message);
    }

    return currentCandle;
  }

  // Generate 40 synthetic 1-minute historical bars if DB has fewer than 5 bars for immediate chart rendering
  async getHistoricalCandles(symbol, currentLtp = 25350) {
    let existing = await Candle.find({ symbol, timeframe: "1m" })
      .sort({ time: 1 })
      .limit(200)
      .lean();

    if (existing.length >= 5) return existing;

    const nowSec = Math.floor((Math.floor(Date.now() / 60000) * 60000) / 1000);
    const seedBars = [];
    let price = currentLtp - (Math.random() - 0.5) * (currentLtp * 0.005);

    for (let i = 40; i >= 1; i--) {
      const time = nowSec - i * 60;
      const open = Number(price.toFixed(2));
      const change = (Math.random() - 0.49) * (currentLtp * 0.0015);
      const close = Number(Math.max(5, open + change).toFixed(2));
      const high = Number(
        (Math.max(open, close) + Math.random() * (currentLtp * 0.0008)).toFixed(
          2,
        ),
      );
      const low = Number(
        Math.max(
          5,
          Math.min(open, close) - Math.random() * (currentLtp * 0.0008),
        ).toFixed(2),
      );
      seedBars.push({
        symbol,
        timeframe: "1m",
        time,
        open,
        high,
        low,
        close,
        volume: Math.floor(500 + Math.random() * 2500),
      });
      price = close;
    }

    await Candle.insertMany(seedBars, { ordered: false }).catch(() => {});
    return seedBars;
  }
}

module.exports = new CandleAggregator();
