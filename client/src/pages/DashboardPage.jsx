import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchTradeHistory } from "../api/journalApi";
import WelcomeSection from "../components/dashboard/WelcomeSection";
import ActiveAccountSnapshot from "../components/dashboard/ActiveAccountSnapshot";
import RiskSnapshot from "../components/dashboard/RiskSnapshot";
import RecentActivities from "../components/dashboard/RecentActivities";
import EquityCurve from "../components/dashboard/EquityCurve";
import { FiAlertTriangle, FiFileText } from "react-icons/fi";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function DashboardPage({ account, accountMetrics }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trades, setTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // Load trade history for the pending journal section.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadTradeHistory = async () => {
      try {
        setLoadingTrades(true);

        const historyData = await fetchTradeHistory(user.uid);

        if (!cancelled) {
          setTrades(Array.isArray(historyData) ? historyData : []);
        }
      } catch (error) {
        console.error("Failed to load dashboard trade history:", error);
      } finally {
        if (!cancelled) {
          setLoadingTrades(false);
        }
      }
    };

    loadTradeHistory();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Only trades that still need mandatory journals.
  const unjournaledTrades = trades.filter(
    (trade) => trade.isJournaled !== true,
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 1. Welcome */}
        <WelcomeSection user={user} account={account} />

        {/* Account breach alert */}
        {account?.status === "BREACHED" && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-start gap-3.5">
            <FiAlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />

            <div>
              <h3 className="font-bold text-rose-300 text-sm">
                Account Breached — Trading Locked
              </h3>

              <p className="text-xs text-rose-300/80 mt-1">
                Reason: {account.breachReason || "Risk limit exceeded"}. Trading
                is currently disabled.
              </p>

              {account.breachedAt && (
                <p className="text-xs text-slate-400 mt-2">
                  Breached at: {formatDate(account.breachedAt)}
                </p>
              )}

              <button
                onClick={() => navigate("/accounts")}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 mt-3"
              >
                Manage Account →
              </button>
            </div>
          </div>
        )}

        {/* 2. Active Account Snapshot */}
        <ActiveAccountSnapshot account={account} metrics={accountMetrics} />

        {/* 3. Risk Snapshot */}
        {account && <RiskSnapshot metrics={accountMetrics} />}

        {/* 4. Equity Curve + 5. Recent Activities */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Equity Curve */}
          <EquityCurve userId={user.uid} />
          {/* Recent Activities */}
          <RecentActivities userId={user.uid} limit={10} />
        </div>

        {/* 6. Unjournaled Trades */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-amber-400" />

              <h2 className="font-bold text-sm text-slate-200">
                Unjournaled Trades
              </h2>
            </div>

            <span className="text-xs font-mono text-amber-400">
              {unjournaledTrades.length} Pending
            </span>
          </div>

          {loadingTrades ? (
            <div className="p-8 text-center text-sm text-slate-500 animate-pulse">
              Loading pending journals...
            </div>
          ) : unjournaledTrades.length === 0 ? (
            <div className="p-10 text-center">
              <FiFileText className="w-8 h-8 text-emerald-400 mx-auto mb-3" />

              <p className="text-sm font-medium text-slate-200">
                All caught up!
              </p>

              <p className="text-xs text-slate-400 mt-1">
                No pending trade journals. Keep maintaining your discipline.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 bg-slate-950/50">
                    <th className="py-3.5 px-6">Contract</th>
                    <th className="py-3.5 px-4">Quantity</th>
                    <th className="py-3.5 px-4">Entry / Exit</th>
                    <th className="py-3.5 px-4">Net P&L</th>
                    <th className="py-3.5 px-4">Closed At</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {unjournaledTrades.map((trade) => (
                    <tr
                      key={trade._id}
                      className="hover:bg-slate-800/30 transition"
                    >
                      <td className="py-4 px-6 font-mono font-semibold text-slate-200">
                        {trade.symbol}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-400">
                        {trade.quantity}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-slate-300">
                        ₹{Number(trade.entryPrice).toFixed(2)}
                        {" → "}₹{Number(trade.exitPrice).toFixed(2)}
                      </td>

                      <td
                        className={`py-4 px-4 font-mono font-bold ${
                          trade.netPnL >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {trade.netPnL >= 0 ? "+" : ""}₹
                        {Number(trade.netPnL).toFixed(2)}
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-400">
                        {formatDate(trade.exitTime)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() =>
                            navigate(`/journal/${trade._id}`, {
                              state: { trade },
                            })
                          }
                          className="text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 px-3.5 py-2 rounded-lg transition"
                        >
                          Complete Journal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
