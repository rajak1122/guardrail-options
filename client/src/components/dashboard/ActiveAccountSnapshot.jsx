import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiArrowUpRight,
  FiShield,
  FiCreditCard,
} from "react-icons/fi";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export default function ActiveAccountSnapshot({ account, metrics }) {
  const navigate = useNavigate();

  if (!account) {
    return (
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            No Trading Account
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Create a virtual account to start trading with Guardrail.
          </p>
        </div>

        <button
          onClick={() => navigate("/accounts")}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-5 py-3 rounded-xl"
        >
          Set Up Account
        </button>
      </section>
    );
  }

  const hasLiveEquity = Number.isFinite(metrics?.currentEquity);
  const hasDailyMetrics = Number.isFinite(metrics?.daily?.pnl);

  const currentEquity = hasLiveEquity
    ? metrics.currentEquity
    : account.currentBalance;

  const dailyPnL = hasDailyMetrics ? metrics.daily.pnl : null;

  const isActive = account.status === "ACTIVE";

  const accountTier =
    account.accountSize >= 100000
      ? `${account.accountSize / 100000}L`
      : `${account.accountSize / 1000}K`;

  return (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <FiShield className="w-4 h-4 text-emerald-400" />

            <h2 className="text-sm font-bold text-slate-200">
              Active Account Snapshot
            </h2>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Your current trading account at a glance
          </p>
        </div>

        <span
          className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
            isActive
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {account.status}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <FiCreditCard className="w-4 h-4" />{" "}
            <span className="text-xs">Account Tier</span>
          </div>

          <p className="text-xl font-mono font-bold text-emerald-400">
            ₹{accountTier}
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-2">
            {hasLiveEquity ? "Current Equity" : "Realized Balance"}
          </span>

          <p className="text-xl font-mono font-bold text-slate-100">
            {formatCurrency(currentEquity)}
          </p>

          {!hasLiveEquity && (
            <p className="text-[10px] text-amber-400 mt-1">
              Live valuation unavailable
            </p>
          )}
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <FiActivity className="w-4 h-4" />
            <span className="text-xs">Today's P&L</span>
          </div>

          <p
            className={`text-xl font-mono font-bold ${
              dailyPnL === null
                ? "text-slate-400"
                : dailyPnL >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
            }`}
          >
            {dailyPnL === null
              ? "Unavailable"
              : `${dailyPnL >= 0 ? "+" : ""}${formatCurrency(dailyPnL)}`}
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-2">
            High-Water Mark
          </span>

          <p className="text-xl font-mono font-bold text-blue-400">
            {formatCurrency(account.highWaterMark)}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs text-slate-400">
          Journal Status:{" "}
          <span
            className={
              account.hasUnjournaledTrade
                ? "text-amber-400"
                : "text-emerald-400"
            }
          >
            {account.hasUnjournaledTrade ? "Action Required" : "Clear"}
          </span>
        </span>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/accounts")}
            className="text-sm text-slate-300 hover:text-white"
          >
            Manage Account
          </button>

          {isActive && (
            <button
              onClick={() => navigate("/terminal")}
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Open Terminal
              <FiArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
