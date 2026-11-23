const assert = require("node:assert/strict");
const { calculateAccountRisk } = require("../src/services/riskCalculator");
const account = {
  startingBalance: 50000,
  accountSize: 50000,
  currentBalance: 52000,
  dailyStartingBalance: 50000,
  highWaterMark: 60000,
  dailyLossLimitPercent: 5,
  maxTrailingDrawdownPercent: 10,
};

// TEST 1: ₹2K realised profit, followed by ₹4.5K floating loss.
const test1 = calculateAccountRisk(account, -4500);

assert.equal(test1.currentEquity, 47500);
assert.equal(test1.daily.pnl, -2500);
assert.equal(test1.daily.breached, true);
assert.equal(test1.trailingDrawdown.maxDrawdownFloor, 45000);
assert.equal(test1.trailingDrawdown.breached, false);

console.log("TEST 1 PASSED: Daily loss breach");

// TEST 2: Equity reaches the fixed ₹45K floor.
const test2 = calculateAccountRisk(account, -7000);

assert.equal(test2.currentEquity, 45000);
assert.equal(test2.trailingDrawdown.breached, true);

console.log("TEST 2 PASSED: Fixed drawdown breach");

// TEST 3: Profit must not move the drawdown floor.
const profitableAccount = {
  ...account,
  currentBalance: 60000,
};

const test3 = calculateAccountRisk(profitableAccount, 0);

assert.equal(test3.currentEquity, 60000);
assert.equal(test3.trailingDrawdown.maxDrawdownFloor, 45000);
assert.equal(test3.trailingDrawdown.breached, false);

console.log("TEST 3 PASSED: Fixed floor remains unchanged");

console.log("\nAll risk calculator tests passed!");
