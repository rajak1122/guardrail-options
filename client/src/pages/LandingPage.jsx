import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  FiShield,
  FiTrendingUp,
  FiLock,
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
  FiZap,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

export default function LandingPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 overflow-x-hidden relative">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg shadow-lg shadow-emerald-500/10">
              <FiShield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg block leading-none">
                Guardrail <span className="text-emerald-400">Options</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">
                Prop Trading Simulator
              </span>
            </div>
          </div>

          <button
            onClick={loginWithGoogle}
            className="group flex items-center gap-2 text-sm font-medium bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-200 px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm"
          >
            <FcGoogle className="w-4 h-4" />
            <span>Trader Login</span>
            <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column: Value Prop */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wide">
            <FiZap className="w-3.5 h-3.5 animate-pulse" />
            <span>NIFTY & BANK NIFTY OPTIONS BUYING SIMULATOR</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Master Options Discipline Before Risking{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Real Capital.
            </span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Simulate institutional prop-firm guardrails with live Black-Scholes
            Greeks, real-time trailing drawdown watchdogs, and a mandatory
            post-trade journal lock that stops revenge trading cold.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={loginWithGoogle}
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 text-base group transform hover:-translate-y-0.5"
            >
              <FcGoogle className="w-5 h-5 bg-white rounded-full p-0.5" />
              <span>Get Started with Google</span>
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-mono text-slate-400 border-t border-slate-900">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-400 w-4 h-4" />
              <span>Free Simulated Capital Tiers</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-400 w-4 h-4" />
              <span>₹50K to ₹10L Accounts</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Guardrail Preview Card */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative group hover:border-slate-700/80 transition-colors">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Active Guardrail Engine
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                LIVE WATCHDOG
              </span>
            </div>

            {/* Feature Item 1 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/50 hover:border-emerald-500/30 transition-all">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <FiActivity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm mb-1">
                  Trailing Drawdown & Daily Loss Caps
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Floating P&L tracked tick-by-tick. Breach your 2% daily limit
                  or 5% max drawdown and open positions auto-liquidate
                  instantly.
                </p>
              </div>
            </div>

            {/* Feature Item 2 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/50 hover:border-emerald-500/30 transition-all">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <FiLock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm mb-1">
                  Mandatory Post-Trade Journal Gate
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every exit locks the order ticket until you log your setup
                  tag, plan adherence, and emotional state.
                </p>
              </div>
            </div>

            {/* Feature Item 3 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/50 hover:border-emerald-500/30 transition-all">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <FiTrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm mb-1">
                  Live Black-Scholes Greeks & Charts
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Practice Nifty & Bank Nifty setups anytime with dynamic Delta,
                  Theta, Gamma, Vega, and 1-minute candlestick feeds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono relative z-10 bg-slate-950">
        Guardrail Options • Educational & Simulation Environment Only
      </footer>
    </div>
  );
}
