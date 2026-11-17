import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiArrowRight,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

export default function JournalLockModal({ isOpen, tradeId, tradeSummary }) {
  const navigate = useNavigate();

  if (!isOpen || !tradeId) return null;

  const isWin = (tradeSummary?.netPnL ?? 0) >= 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FiLock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Position Closed • Journal Required
            </h3>
            <p className="text-xs text-slate-400">
              Guardrail discipline lock is active until you review this trade.
            </p>
          </div>
        </div>

        {tradeSummary && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Contract:</span>
              <span className="text-slate-100 font-bold">
                {tradeSummary.symbol}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Trigger:</span>
              <span className="text-amber-400">
                {tradeSummary.exitReason || "EXECUTED"}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Realized P&L:</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  isWin ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isWin ? <FiTrendingUp /> : <FiTrendingDown />}
                {isWin ? "+" : ""}₹{Number(tradeSummary.netPnL).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() =>
            navigate(`/journal/${tradeId}`, {
              state: tradeSummary ? { trade: tradeSummary } : undefined,
            })
          }
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
        >
          <span>Journal Last Closed Trade</span>
          <FiArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full text-xs font-mono text-slate-400 hover:text-slate-200 transition py-1"
        >
          Return to Command Center
        </button>
      </div>
    </div>
  );
}
