function aggregateTick(tick) {
  if (!tick) throw new TypeError('A market tick is required.');
  throw new Error('Candle aggregation is not implemented yet.');
}

module.exports = { aggregateTick };
