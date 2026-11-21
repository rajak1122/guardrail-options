function toFiniteNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid risk calculation input: ${fieldName}`);
  }

  return number;
}

function calculateAccountRisk(account, totalUnrealizedPnL = 0) {
  if (!account) {
    throw new Error("Account is required for risk calculation.");
  }

  // Read account values.
  const currentBalance = toFiniteNumber(
    account.currentBalance,
    "currentBalance",
  );

  const dailyStartingBalance = toFiniteNumber(
    account.dailyStartingBalance,
    "dailyStartingBalance",
  );

  const highWaterMark = toFiniteNumber(account.highWaterMark, "highWaterMark");

  const accountSize = toFiniteNumber(account.accountSize, "accountSize");

  const startingBalance = toFiniteNumber(
    account.startingBalance,
    "startingBalance",
  );

  const dailyLossLimitPercent = toFiniteNumber(
    account.dailyLossLimitPercent,
    "dailyLossLimitPercent",
  );

  const maxTrailingDrawdownPercent = toFiniteNumber(
    account.maxTrailingDrawdownPercent,
    "maxTrailingDrawdownPercent",
  );

  const floatingPnL = toFiniteNumber(totalUnrealizedPnL, "totalUnrealizedPnL");

  if (
    accountSize <= 0 ||
    startingBalance <= 0 ||
    dailyStartingBalance <= 0 ||
    highWaterMark <= 0 ||
    dailyLossLimitPercent <= 0 ||
    maxTrailingDrawdownPercent <= 0
  ) {
    throw new Error("Account risk configuration is invalid.");
  }

  // Current total equity includes realised and floating P&L.
  const currentEquity = currentBalance + floatingPnL;

  // -------------------------------
  // DAILY LOSS CALCULATIONS
  // -------------------------------

  const dailyPnL = currentEquity - dailyStartingBalance;

  const allowedDailyLossAmount =
    dailyStartingBalance * (dailyLossLimitPercent / 100);

  const dailyLossUsed = Math.max(0, -dailyPnL);

  const remainingDailyAllowance = Math.max(
    0,
    allowedDailyLossAmount - dailyLossUsed,
  );

  const dailyRiskUtilisation = (dailyLossUsed / allowedDailyLossAmount) * 100;

  const dailyPnLPercent = (dailyPnL / dailyStartingBalance) * 100;

  const dailyLossBreached = dailyLossUsed >= allowedDailyLossAmount;

  // -------------------------------
  // FIXED MAXIMUM DRAWDOWN CALCULATIONS
  // -------------------------------

  // Drawdown allowance is permanently based on initial capital.
  const allowedDrawdownAmount =
    startingBalance * (maxTrailingDrawdownPercent / 100);

  // The floor never moves when the trader makes profits.
  const maxDrawdownFloor = startingBalance - allowedDrawdownAmount;

  // Track how much equity has fallen from initial capital.
  const currentDrawdownAmount = Math.max(0, startingBalance - currentEquity);

  const remainingDrawdownAllowance = Math.max(
    0,
    allowedDrawdownAmount - currentDrawdownAmount,
  );

  const drawdownUtilisation =
    (currentDrawdownAmount / allowedDrawdownAmount) * 100;

  const currentDrawdownPercent =
    (currentDrawdownAmount / startingBalance) * 100;

  // Breach when equity reaches or falls below the fixed floor.
  const maxDrawdownBreached = currentEquity <= maxDrawdownFloor;

  return {
    currentBalance,
    totalUnrealizedPnL: floatingPnL,
    currentEquity,

    daily: {
      startingBalance: dailyStartingBalance,
      pnl: dailyPnL,
      pnlPercent: dailyPnLPercent,
      allowedLossAmount: allowedDailyLossAmount,
      lossUsed: dailyLossUsed,
      remainingAllowance: remainingDailyAllowance,
      utilisationPercent: dailyRiskUtilisation,
      breached: dailyLossBreached,
    },

    trailingDrawdown: {
      startingBalance,
      maxDrawdownFloor,
      highWaterMark,
      currentDrawdownAmount,
      currentDrawdownPercent,
      allowedDrawdownAmount,
      remainingAllowance: remainingDrawdownAllowance,
      utilisationPercent: drawdownUtilisation,
      breached: maxDrawdownBreached,
    },
  };
}

module.exports = {
  calculateAccountRisk,
};
