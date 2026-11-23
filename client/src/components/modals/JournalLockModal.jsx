import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiArrowRight } from "react-icons/fi";

export default function JournalLockModal({ isOpen, tradeId, tradeSummary }) {
  const navigate = useNavigate();

  if (!isOpen || !tradeId) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/40 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
            <FiLock className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Journal Required • Trading Locked
            </h3>

            <p className="text-xs text-slate-400">
              Complete your previous trade journal to unlock new orders. You can
              continue viewing the terminal.
            </p>

            {tradeSummary && (
              <p className="mt-1 font-mono text-xs text-amber-400">
                {tradeSummary.symbol} • Realized P&L: ₹
                {Number(tradeSummary.netPnL).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() =>
            navigate(`/journal/${tradeId}`, {
              state: tradeSummary ? { trade: tradeSummary } : undefined,
            })
          }
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          Complete Journal
          <FiArrowRight />
        </button>
      </div>
    </div>
  );
}
