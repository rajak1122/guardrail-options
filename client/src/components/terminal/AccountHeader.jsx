import React from "react";
import { useNavigate } from "react-router-dom";
import { FiShield, FiArrowLeft, FiLock } from "react-icons/fi";

export default function AccountHeader({ account = {}, floatingPnL = 0 }) {
  const navigate = useNavigate();

  const currentBalance = account?.currentBalance || 0;
  const accountSize = account?.accountSize || 500000;
  const currentEquity = currentBalance + floatingPnL;
  const totalReturn = currentEquity - accountSize;
  const returnPercent = accountSize > 0 ? (totalReturn / accountSize) * 100 : 0;

  return (
    <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition"
            title="Back to Dashboard"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-100 text-base">
                  Guardrail Terminal
                </h1>
                <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded">
                  LIVE FEED
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Tier: ₹
                {accountSize >= 100000
                  ? `${accountSize / 100000}L`
                  : `${accountSize / 1000}K`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Key Metrics */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Equity */}
          <div className="bg-slate-950/80 border border-slate-800/80 px-4 py-2 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block">
              CURRENT EQUITY
            </span>
            <span className="font-mono font-bold text-slate-100 text-sm sm:text-base">
              ₹
              {currentEquity.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Floating P&L */}
          <div className="bg-slate-950/80 border border-slate-800/80 px-4 py-2 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block">
              FLOATING P&L
            </span>
            <span
              className={`font-mono font-bold text-sm sm:text-base ${
                floatingPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {floatingPnL >= 0 ? "+" : ""}₹
              {floatingPnL.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Total Return */}
          <div className="bg-slate-950/80 border border-slate-800/80 px-4 py-2 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block">
              TOTAL RETURN
            </span>
            <span
              className={`font-mono font-bold text-sm sm:text-base ${
                totalReturn >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalReturn >= 0 ? "+" : ""}
              {returnPercent.toFixed(2)}%
            </span>
          </div>

          {/* Journal Lock Status */}
          <div
            className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${
              account?.hasUnjournaledTrade
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-slate-950/80 border-slate-800 text-slate-400"
            }`}
          >
            <FiLock className="w-4 h-4" />
            <span className="text-xs font-mono">
              {account?.hasUnjournaledTrade
                ? "Journal Lock: ACTIVE"
                : "Journal: CLEAR"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
