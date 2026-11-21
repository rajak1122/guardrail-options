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
  FiLock,
  FiUnlock,
} from "react-icons/fi";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const SETUP_TAGS = [
  "ORB_BREAKOUT",
  "FVG_RETEST",
  "LIQUIDITY_SWEEP",
  "MOMENTUM_SCALP",
  "VWAP_REJECTION",
  "IMPULSE_FOMO",
];

const EMOTION_TAGS = [
  "CALM_DISCIPLINED",
  "CONFIDENT_PATIENT",
  "OVERCONFIDENT",
  "FOMO_RUSHED",
  "REVENGE_TILT",
];

export default function JournalDetailPage({ onJournalSubmitted }) {
  const { tradeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trade, setTrade] = useState(location.state?.trade || null);
  const [loading, setLoading] = useState(!location.state?.trade);

  // Form states for unjournaled trades
  const [setupTag, setSetupTag] = useState("ORB_BREAKOUT");
  const [emotionTag, setEmotionTag] = useState("CALM_DISCIPLINED");
  const [followedPlan, setFollowedPlan] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleSubmitJournal = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!notes.trim()) {
      setErrorMsg(
        "Please write a brief execution review before unlocking your terminal.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/journal/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          tradeId: trade._id,
          setupTag,
          emotionTag,
          followedPlan,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit journal");

      setTrade(data.trade);

      // Update the parent account state immediately
      if (data.account) {
        onJournalSubmitted?.(data.account);
      }

      // Return to terminal without requiring a manual refresh
      navigate("/terminal", { replace: true });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          {!trade.isJournaled && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <FiLock className="w-3.5 h-3.5" />
              TERMINAL LOCKED UNTIL SUBMITTED
            </span>
          )}
        </div>

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

        {/* Interactive Form if Pending vs Read-Only Summary if Completed */}
        {!trade.isJournaled ? (
          <form
            onSubmit={handleSubmitJournal}
            className="bg-slate-900/70 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">
                Complete Mandatory Post-Trade Reflection
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Log your setup and psychological state to unlock your terminal
                for the next execution.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 font-mono text-xs">
              <div>
                <label className="flex items-center gap-1.5 text-slate-400 mb-2">
                  <FiTag className="text-emerald-400" />
                  <span>SETUP TAG</span>
                </label>
                <select
                  value={setupTag}
                  onChange={(e) => setSetupTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {SETUP_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-slate-400 mb-2">
                  <FiHeart className="text-purple-400" />
                  <span>EMOTIONAL STATE</span>
                </label>
                <select
                  value={emotionTag}
                  onChange={(e) => setEmotionTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {EMOTION_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="font-mono text-xs">
              <label className="text-slate-400 block mb-2">
                DID YOU FOLLOW YOUR TRADING PLAN?
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setFollowedPlan(true)}
                  className={`py-2.5 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                    followedPlan
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <FiCheckCircle />
                  <span>Yes, Strictly</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFollowedPlan(false)}
                  className={`py-2.5 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                    !followedPlan
                      ? "bg-rose-500/15 border-rose-500 text-rose-400"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <FiXCircle />
                  <span>No, Deviated</span>
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-2">
                <FiFileText className="text-blue-400" />
                <span>EXECUTION REVIEW & LESSONS LEARNED</span>
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What triggered your entry? Was your stop-loss respected? What would you improve next time?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
            >
              <FiUnlock className="w-4 h-4" />
              <span>
                {submitting
                  ? "Submitting & Unlocking Terminal..."
                  : "Submit Journal & Unlock Trading"}
              </span>
            </button>
          </form>
        ) : (
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
        )}
      </div>
    </div>
  );
}
