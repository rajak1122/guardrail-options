import React from "react";
import { FiPlusCircle } from "react-icons/fi";

export default function CapitalTierSetup({
  selectedTier,
  setSelectedTier,
  needsNewAccount,
  initializing,
  onInitialize,
}) {
  const tiers = [50000, 100000, 200000, 500000, 1000000];

  return (
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
        {tiers.map((tier) => (
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
        onClick={onInitialize}
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
  );
}
