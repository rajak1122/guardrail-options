const RISK_POLICIES = Object.freeze({
  50000: Object.freeze({
    dailyLossLimitPercent: 5,
    maxTrailingDrawdownPercent: 10,
  }),

  100000: Object.freeze({
    dailyLossLimitPercent: 5,
    maxTrailingDrawdownPercent: 10,
  }),

  200000: Object.freeze({
    dailyLossLimitPercent: 5,
    maxTrailingDrawdownPercent: 10,
  }),

  500000: Object.freeze({
    dailyLossLimitPercent: 2,
    maxTrailingDrawdownPercent: 10,
  }),

  1000000: Object.freeze({
    dailyLossLimitPercent: 2,
    maxTrailingDrawdownPercent: 10,
  }),
});

function getRiskPolicy(accountSize) {
  const policy = RISK_POLICIES[Number(accountSize)];

  if (!policy) {
    throw new Error(
      `No risk policy configured for account size: ${accountSize}`,
    );
  }

  return { ...policy };
}

module.exports = {
  getRiskPolicy,
  RISK_POLICIES,
};
