import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchTradeHistory } from "../api/journalApi";

import {
  FiFileText,
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const SETUP_OPTIONS = [
  "ORB",
  "FVG_RETEST",
  "LIQUIDITY_SWEEP",
  "BREAK_OF_STRUCTURE",
  "MOMENTUM_SCALP",
  "IMPULSE_NO_SETUP",
];

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function JournalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [setupFilter, setSetupFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all closed trades belonging to the active account.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadTrades = async () => {
      try {
        setLoading(true);
        setError("");

        const history = await fetchTradeHistory(user.uid);

        if (!cancelled) {
          setTrades(Array.isArray(history) ? history : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load journal history:", err);
          setError(err.message || "Failed to load trade history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTrades();

    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  // Journal statistics.
  const pendingCount = trades.filter(
    (trade) => trade.isJournaled !== true,
  ).length;

  const completedCount = trades.length - pendingCount;

  // Apply search and filters.
  const filteredTrades = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...trades]
      .sort((a, b) => new Date(b.exitTime || 0) - new Date(a.exitTime || 0))
      .filter((trade) => {
        const isJournaled = trade.isJournaled === true;

        if (statusFilter === "PENDING" && isJournaled) {
          return false;
        }

        if (statusFilter === "COMPLETED" && !isJournaled) {
          return false;
        }

        const pnl = Number(trade.netPnL || 0);

        if (resultFilter === "WIN" && pnl <= 0) return false;
        if (resultFilter === "LOSS" && pnl >= 0) return false;
        if (resultFilter === "BREAKEVEN" && pnl !== 0) return false;

        const setup = trade.journal?.setupTag || "UNSET";

        if (setupFilter !== "ALL" && setup !== setupFilter) {
          return false;
        }

        const searchableText = [
          trade.symbol,
          trade.underlying,
          trade.optionType,
          trade.strikePrice,
          setup,
        ]
          .join(" ")
          .toLowerCase();

        return !search || searchableText.includes(search);
      });
  }, [trades, statusFilter, resultFilter, setupFilter, searchTerm]);

  const statusOptions = [
    { value: "ALL", label: "All Trades", count: trades.length },
    { value: "PENDING", label: "Pending", count: pendingCount },
    { value: "COMPLETED", label: "Completed", count: completedCount },
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <section>
        <p className="text-[10px] font-mono tracking-widest text-emerald-500">
          GUARDRAIL WORKSPACE
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              Trading Journals
            </h1>

            <p className="text-sm text-slate-400 mt-2">
              Review your executions, reflect on decisions and track trading
              discipline.
            </p>
          </div>

          <button
            onClick={() => setRefreshKey((previous) => previous + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">Total Trades</span>
            <FiFileText className="text-blue-400" />
          </div>

          <p className="text-2xl font-mono font-bold text-slate-100">
            {trades.length}
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">Pending Journals</span>
            <FiAlertCircle className="text-amber-400" />
          </div>

          <p className="text-2xl font-mono font-bold text-amber-400">
            {pendingCount}
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">Completed Journals</span>
            <FiCheckCircle className="text-emerald-400" />
          </div>

          <p className="text-2xl font-mono font-bold text-emerald-400">
            {completedCount}
          </p>
        </div>
      </section>

      {/* Journal Library */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-800 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                Trade Journal Library
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                {filteredTrades.length} matching records
              </p>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
                  statusFilter === option.value
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contract..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Results</option>
              <option value="WIN">Winning Trades</option>
              <option value="LOSS">Losing Trades</option>
              <option value="BREAKEVEN">Breakeven Trades</option>
            </select>

            <select
              value={setupFilter}
              onChange={(e) => setSetupFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Setups</option>

              {SETUP_OPTIONS.map((setup) => (
                <option key={setup} value={setup}>
                  {setup.replace(/_/g, " ")}
                </option>
              ))}

              <option value="UNSET">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 animate-pulse">
            Loading your trading journals...
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-rose-400">{error}</p>

            <button
              onClick={() => setRefreshKey((previous) => previous + 1)}
              className="mt-4 text-xs text-emerald-400 hover:text-emerald-300"
            >
              Try Again
            </button>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="p-12 text-center">
            <FiFileText className="w-9 h-9 text-slate-600 mx-auto mb-3" />

            <p className="text-sm font-semibold text-slate-300">
              No matching trade records
            </p>

            <p className="text-xs text-slate-500 mt-2">
              Try changing your filters or execute your first trade.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Contract</th>
                  <th className="px-4 py-4">Closed At</th>
                  <th className="px-4 py-4">Quantity</th>
                  <th className="px-4 py-4">Entry / Exit</th>
                  <th className="px-4 py-4">Net P&L</th>
                  <th className="px-4 py-4">Setup</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredTrades.map((trade) => {
                  const isJournaled = trade.isJournaled === true;
                  const pnl = Number(trade.netPnL || 0);

                  return (
                    <tr
                      key={trade._id}
                      className="hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-slate-200">
                          {trade.symbol}
                        </span>

                        <p className="text-[10px] text-slate-500 mt-1">
                          {trade.optionType} · {trade.strikePrice}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <FiClock className="w-3 h-3" />
                          {formatDate(trade.exitTime)}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-mono text-slate-300">
                        {trade.quantity}
                      </td>

                      <td className="px-4 py-4 font-mono text-xs text-slate-300">
                        {formatCurrency(trade.entryPrice)}
                        <span className="text-slate-500 mx-1">→</span>
                        {formatCurrency(trade.exitPrice)}
                      </td>

                      <td
                        className={`px-4 py-4 font-mono font-bold ${
                          pnl > 0
                            ? "text-emerald-400"
                            : pnl < 0
                              ? "text-rose-400"
                              : "text-slate-300"
                        }`}
                      >
                        {pnl > 0 ? "+" : ""}
                        {formatCurrency(pnl)}
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
                          {trade.journal?.setupTag?.replace(/_/g, " ") ||
                            "UNSET"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {isJournaled ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            COMPLETED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
                            <FiAlertCircle className="w-3.5 h-3.5" />
                            PENDING
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            navigate(`/journal/${trade._id}`, {
                              state: { trade },
                            })
                          }
                          className={`text-xs font-semibold px-3.5 py-2 rounded-lg transition ${
                            isJournaled
                              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950"
                          }`}
                        >
                          {isJournaled ? "View Journal" : "Complete Journal"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
