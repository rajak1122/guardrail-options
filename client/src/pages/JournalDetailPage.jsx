import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchTradeHistory } from "../api/journalApi";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTag,
  FiHeart,
  FiFileText,
} from "react-icons/fi";

export default function JournalDetailPage() {
  const { tradeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trade, setTrade] = useState(location.state?.trade || null);
  const [loading, setLoading] = useState(!location.state?.trade);

  useEffect(() => {
    if (trade || !user) return;

    const loadTrade = async () => {
      try {
        setLoading(true);
        const allTrades = await fetchTradeHistory(user.uid);
        const found = allTrades.find((t) => t._id === tradeId);
        setTrade(found || null);
      } catch (err) {
        console.error("Error loading trade details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTrade();
  }, [trade, tradeId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-sm animate-pulse">
        Loading Journal Record...
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <p className="text-slate-400 mb-4">Trade journal record not found.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isWin = trade.netPnL >= 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Main Header Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-mono font-bold text-slate-100">
                {trade.symbol}
              </h1>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {trade.optionType} • Strike {trade.strikePrice}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <FiClock className="w-3.5 h-3.5" />
              <span>
                {new Date(trade.entryTime).toLocaleString()} →{" "}
                {new Date(trade.exitTime).toLocaleString()}
              </span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-mono text-slate-400 block mb-1">
              REALIZED P&L
            </span>
            <span
              className={`text-3xl font-mono font-extrabold ${
                isWin ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isWin ? "+" : ""}₹{trade.netPnL.toFixed(2)} (
              {trade.pnlPercent?.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Execution Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Quantity</span>
            <span className="font-mono font-bold text-base">
              {trade.quantity}
            </span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">
              Entry Price
            </span>
            <span className="font-mono font-bold text-base">
              ₹{trade.entryPrice.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">
              Exit Price
            </span>
            <span className="font-mono font-bold text-base">
              ₹{trade.exitPrice.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">
              Exit Trigger
            </span>
            <span className="font-mono font-bold text-xs text-amber-400">
              {trade.exitReason}
            </span>
          </div>
        </div>

        {/* Psychological & Setup Reflection Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">
            Post-Trade Psychological Reflection
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1.5">
                <FiTag className="text-emerald-400" />
                <span>SETUP TAG</span>
              </div>
              <span className="font-mono font-semibold text-sm text-slate-100">
                {trade.journal?.setupTag || "Not Logged"}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1.5">
                <FiHeart className="text-purple-400" />
                <span>EMOTIONAL STATE</span>
              </div>
              <span className="font-mono font-semibold text-sm text-slate-100">
                {trade.journal?.emotionTag || "Not Logged"}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1.5">
                {trade.journal?.followedPlan ? (
                  <FiCheckCircle className="text-emerald-400" />
                ) : (
                  <FiXCircle className="text-rose-400" />
                )}
                <span>PLAN ADHERENCE</span>
              </div>
              <span
                className={`font-mono font-semibold text-sm ${
                  trade.journal?.followedPlan
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {trade.journal?.followedPlan
                  ? "Followed Plan Strictly"
                  : "Deviated From Plan"}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
              <FiFileText className="text-blue-400" />
              <span>TRADER NOTES & EXECUTION REVIEW</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {trade.journal?.notes ||
                "No written notes provided for this execution."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
