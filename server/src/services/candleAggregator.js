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

    try {
      const c = this.activeCandles[candleKey];
      await Candle.findOneAndUpdate(
        { symbol: c.symbol, timeframe: c.timeframe, time: c.time },
        {
          $set: {
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          },
        },
        { upsert: true, new: true },
      );
    } catch (err) {
      console.error("Error saving candle aggregation:", err.message);
    }
  }
}

module.exports = new CandleAggregator();
