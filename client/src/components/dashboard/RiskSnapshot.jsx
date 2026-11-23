import React from "react";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function RiskCard({
  title,
  pnl,
  used,
  allowed,
  remaining,
  utilisation,
  breached,
  floor,
}) {
  const percentage = Math.max(0, Math.min(100, utilisation || 0));

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>

        <span
          className={`text-xs font-mono px-2 py-1 rounded-md ${
            breached
              ? "bg-rose-500/10 text-rose-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {breached ? "BREACHED" : "WITHIN LIMIT"}
        </span>
      </div>

      <div className="mb-5">
        <p className="text-xs text-slate-400 mb-1">
          {title === "Daily Loss" ? "Today's P&L" : "Current Drawdown"}
        </p>

        <p className="text-2xl font-mono font-bold text-slate-100">
          {title === "Daily Loss" ? formatCurrency(pnl) : formatCurrency(used)}
        </p>
      </div>

      <div className="mb-2 flex justify-between text-xs">
        <span className="text-slate-400">Risk utilisation</span>
        <span className="font-mono text-slate-200">
          {Number(utilisation || 0).toFixed(1)}%
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-5">
        <div
          className={`h-full rounded-full ${
            breached ? "bg-rose-500" : "bg-emerald-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Allowed Limit</p>
          <p className="text-sm font-mono text-slate-200">
            {formatCurrency(allowed)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Remaining</p>
          <p className="text-sm font-mono text-emerald-400">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {Number.isFinite(floor) && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">Fixed Equity Floor</p>
          <p className="text-sm font-mono text-slate-200 mt-1">
            {formatCurrency(floor)}
          </p>
        </div>
      )}
    </div>
  );
}

export default function RiskSnapshot({ metrics }) {
  if (!metrics) {
    return (
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-slate-200 mb-2">
          Account Risk Snapshot
        </h2>

        <p className="text-sm text-amber-400">
          Risk data unavailable. Waiting for fresh market prices.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100">
          Account Risk Snapshot
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Live risk utilisation and remaining trading allowance
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <RiskCard
          title="Daily Loss"
          pnl={metrics.daily.pnl}
          used={metrics.daily.lossUsed}
          allowed={metrics.daily.allowedLossAmount}
          remaining={metrics.daily.remainingAllowance}
          utilisation={metrics.daily.utilisationPercent}
          breached={metrics.daily.breached}
        />

        <RiskCard
          title="Maximum Drawdown"
          used={metrics.trailingDrawdown.currentDrawdownAmount}
          allowed={metrics.trailingDrawdown.allowedDrawdownAmount}
          remaining={metrics.trailingDrawdown.remainingAllowance}
          utilisation={metrics.trailingDrawdown.utilisationPercent}
          breached={metrics.trailingDrawdown.breached}
          floor={metrics.trailingDrawdown.maxDrawdownFloor}
        />
      </div>
    </section>
  );
}
