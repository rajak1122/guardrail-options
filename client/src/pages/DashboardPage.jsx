import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchJournalAnalytics, fetchTradeHistory } from "../api/journalApi";
import { initializeAccount } from "../api/tradingApi";
import {
  FiShield,
  FiTrendingUp,
  FiAlertTriangle,
  FiPlusCircle,
  FiArrowRight,
  FiFileText,
  FiLogOut,
  FiAward,
  FiPercent,
  FiDollarSign,
} from "react-icons/fi";

export default function DashboardPage({ account, setAccount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedTier, setSelectedTier] = useState(500000);
  const [initializing, setInitializing] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalTrades: 0,
    winRate: 0,
    profitFactor: 0,
    grossProfit: 0,
    grossLoss: 0,
  });
  const [trades, setTrades] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        setLoadingData(true);
        const [analyticsData, historyData] = await Promise.all([
          fetchJournalAnalytics(user.uid),
          fetchTradeHistory(user.uid),
        ]);
        setAnalytics(analyticsData);
        setTrades(historyData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user, account]);

  const handleCreateOrResetAccount = async () => {
    try {
      setInitializing(true);
      const data = await initializeAccount({
        firebaseUid: user.uid,
        email: user.email,
        accountSize: selectedTier,
      });
      setAccount(data.account);
    } catch (err) {
      alert(err.message);
    } finally {
      setInitializing(false);
    }
  };

  const needsNewAccount = !account || account.status === "BREACHED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">
                Guardrail{" "}
                <span className="text-emerald-400">Command Center</span>
              </span>
              <span className="block text-[11px] font-mono text-slate-500">
                {user?.email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {account && account.status === "ACTIVE" && (
              <button
                onClick={() => navigate("/terminal")}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/15"
              >
                <span>Open Terminal</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-400 text-sm flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Breach Warning Banner */}
        {account?.status === "BREACHED" && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <FiAlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-rose-300 text-sm">
                  Account Breached — Trading Locked
                </h3>
                <p className="text-xs text-rose-200/80 mt-1">
                  Reason: {account.breachReason || "Drawdown limit exceeded"}.
                  Review your past journals below, then initialize a fresh
                  capital tier to resume trading.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Active Account Summary OR New Account Setup */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Prop Account Status
                </span>
                {account ? (
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                      account.status === "ACTIVE"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    }`}
                  >
                    {account.status}
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    NOT INITIALIZED
                  </span>
                )}
              </div>

              {account ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1">
                      Current Equity
                    </span>
                    <span className="text-xl font-mono font-bold text-slate-100">
                      ₹{account.currentBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1">
                      Account Tier
                    </span>
                    <span className="text-xl font-mono font-bold text-emerald-400">
                      ₹
                      {account.accountSize >= 100000
                        ? `${account.accountSize / 100000}L`
                        : `${account.accountSize / 1000}K`}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-xs text-slate-400 block mb-1">
                      High-Water Mark
                    </span>
                    <span className="text-xl font-mono font-bold text-blue-400">
                      ₹{account.highWaterMark.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4">
                  You don't have an active trading account yet. Select a capital
                  tier on the right to start simulating with real-time risk
                  guardrails.
                </p>
              )}
            </div>

            {account?.status === "ACTIVE" && (
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Journal Lock:{" "}
                  {account.hasUnjournaledTrade
                    ? "LOCKED (Pending Entry)"
                    : "CLEAR"}
                </span>
                <button
                  onClick={() => navigate("/terminal")}
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                >
                  <span>Enter Live Terminal</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <FiPlusCircle className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200">
                {needsNewAccount
                  ? "Initialize New Capital Tier"
                  : "Reset / Switch Capital Tier"}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {needsNewAccount
                ? "Select a simulated capital tier to activate your trading terminal."
                : "Resetting initializes a fresh balance and clears current drawdown metrics."}
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[50000, 100000, 200000, 500000, 1000000].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`py-2.5 px-3 rounded-xl font-mono text-xs border transition ${
                    selectedTier === tier
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  ₹{tier >= 100000 ? `${tier / 100000}L` : `${tier / 1000}K`}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateOrResetAccount}
              disabled={initializing}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm py-3 rounded-xl transition"
            >
              {initializing
                ? "Provisioning Account..."
                : needsNewAccount
                  ? "Create Account & Start"
                  : "Reset Account Balance"}
            </button>
          </div>
        </div>

        {/* Section 2: Performance Analytics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">JOURNALED TRADES</span>
              <FiTrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-mono font-bold text-slate-100">
              {analytics.totalTrades}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">WIN RATE</span>
              <FiPercent className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-mono font-bold text-emerald-400">
              {analytics.winRate}%
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">PROFIT FACTOR</span>
              <FiAward className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-2xl font-mono font-bold text-purple-400">
              {analytics.profitFactor}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">GROSS P&L</span>
              <FiDollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <span
              className={`text-2xl font-mono font-bold ${
                analytics.grossProfit - analytics.grossLoss >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              ₹
              {(analytics.grossProfit - analytics.grossLoss).toLocaleString(
                "en-IN",
              )}
            </span>
          </div>
        </div>

        {/* Section 3: Journaled Trades Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-slate-200">
                Trade History & Post-Trade Journals
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {trades.length} Records
            </span>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-sm font-mono text-slate-500 animate-pulse">
              Loading trade logs...
            </div>
          ) : trades.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              No closed trades yet. Open the terminal and execute your first
              disciplined setup.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[11px] font-mono uppercase text-slate-400 bg-slate-950/50">
                    <th className="py-3.5 px-6">Contract</th>
                    <th className="py-3.5 px-4">Qty</th>
                    <th className="py-3.5 px-4">Entry / Exit</th>
                    <th className="py-3.5 px-4">Net P&L</th>
                    <th className="py-3.5 px-4">Setup Tag</th>
                    <th className="py-3.5 px-4">Journal Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {trades.map((trade) => (
                    <tr
                      key={trade._id}
                      className="hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-200">
                        {trade.symbol}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {trade.quantity}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        ₹{trade.entryPrice.toFixed(2)} → ₹
                        {trade.exitPrice.toFixed(2)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-mono font-bold ${
                          trade.netPnL >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {trade.netPnL >= 0 ? "+" : ""}₹{trade.netPnL.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                          {trade.journal?.setupTag || "UNSET"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {trade.isJournaled ? (
                          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() =>
                            navigate(`/journal/${trade._id}`, {
                              state: { trade },
                            })
                          }
                          className="text-xs font-semibold bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 px-3.5 py-1.5 rounded-lg transition"
                        >
                          View Detailed Journal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
