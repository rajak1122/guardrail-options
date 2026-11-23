import React from "react";
import { FiTrendingUp, FiAward, FiPercent, FiDollarSign } from "react-icons/fi";

export default function PerformanceStats({ analytics }) {
  const totalTrades = analytics?.totalTrades ?? 0;
  const winRate = analytics?.winRate ?? 0;
  const profitFactor = analytics?.profitFactor ?? 0;

  const grossProfit = Number(analytics?.grossProfit ?? 0);
  const grossLoss = Number(analytics?.grossLoss ?? 0);
  const netPnL = grossProfit - grossLoss;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono">JOURNALED TRADES</span>
          <FiTrendingUp className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-2xl font-mono font-bold text-slate-100">
          {totalTrades}
        </span>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono">WIN RATE</span>
          <FiPercent className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="text-2xl font-mono font-bold text-emerald-400">
          {winRate}%
        </span>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono">PROFIT FACTOR</span>
          <FiAward className="w-4 h-4 text-purple-400" />
        </div>
        <span className="text-2xl font-mono font-bold text-purple-400">
          {profitFactor}
        </span>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono">GROSS P&L</span>
          <FiDollarSign className="w-4 h-4 text-amber-400" />
        </div>
        <span
          className={`text-2xl font-mono font-bold ${
            netPnL >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          ₹{netPnL.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
