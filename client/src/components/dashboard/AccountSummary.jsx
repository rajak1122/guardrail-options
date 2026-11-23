import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export default function AccountSummary({ account, accountMetrics }) {
  const navigate = useNavigate();

  return (
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
                {Number.isFinite(accountMetrics?.currentEquity)
                  ? "Current Equity"
                  : "Realized Balance"}
              </span>

              <span className="text-xl font-mono font-bold text-slate-100">
                {Number.isFinite(accountMetrics?.currentEquity)
                  ? `₹${accountMetrics.currentEquity.toLocaleString("en-IN")}`
                  : `₹${account.currentBalance.toLocaleString("en-IN")}`}
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
            You don't have an active trading account yet. Select a capital tier
            on the right to start simulating with real-time risk guardrails.
          </p>
        )}
      </div>

      {account?.status === "ACTIVE" && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Journal Lock:{" "}
            {account.hasUnjournaledTrade ? "LOCKED (Pending Entry)" : "CLEAR"}
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
  );
}
