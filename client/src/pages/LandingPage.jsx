import React from "react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold">
              G
            </div>
            <span className="font-bold tracking-tight text-lg">
              Guardrail <span className="text-emerald-400">Options</span>
            </span>
          </div>
          <button
            onClick={loginWithGoogle}
            className="text-sm font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg transition"
          >
            Trader Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6">
            <span>NIFTY & BANK NIFTY OPTIONS BUYING SIMULATOR</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Master Options Discipline Before Risking Real Capital.
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Simulate institutional prop-firm guardrails with live Black-Scholes
            Greeks, real-time trailing drawdown watchdogs, and a mandatory
            post-trade journal lock that stops revenge trading cold.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={loginWithGoogle}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-7 py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/15 flex items-center gap-3"
            >
              <span>Continue with Google</span>
            </button>
            <span className="text-xs font-mono text-slate-500">
              Free Simulated Tiers: ₹50K – ₹10L
            </span>
          </div>
        </div>

        {/* Core Mechanics Preview Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Active Guardrail Engine
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded">
              LIVE WATCHDOG
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <h3 className="font-semibold text-slate-200 text-sm mb-1">
                1. Real-Time Trailing Drawdown & Daily Loss Caps
              </h3>
              <p className="text-xs text-slate-400">
                Floating unrealized P&L is tracked tick-by-tick. Breach your 2%
                daily limit or 5% max drawdown and open positions auto-liquidate
                instantly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <h3 className="font-semibold text-slate-200 text-sm mb-1">
                2. Mandatory Post-Trade Journal Gate
              </h3>
              <p className="text-xs text-slate-400">
                Every exit locks the order ticket until you log your setup tag,
                plan adherence, and emotional state.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <h3 className="font-semibold text-slate-200 text-sm mb-1">
                3. Live Black-Scholes Greeks & Simulated Feed
              </h3>
              <p className="text-xs text-slate-400">
                Practice Nifty & Bank Nifty setups anytime with dynamic Delta,
                Theta, Gamma, Vega, and 1-minute TradingView charts.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        Guardrail Options • Educational & Simulation Environment Only
      </footer>
    </div>
  );
}
