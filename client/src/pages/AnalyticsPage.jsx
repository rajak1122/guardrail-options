import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchJournalAnalytics } from "../api/journalApi";

import {
  FiActivity,
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiLayers,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";

const RANGE_OPTIONS = ["1D", "1W", "1M", "ALL"];

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);

  return `₹${new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount)}`;
};

const formatTag = (value) =>
  String(value || "UNSET")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatProfitFactor = (value) => {
  if (value === null) return "∞";

  return Number(value || 0).toFixed(2);
};

function MetricCard({ label, value, description, icon: Icon, tone = "blue" }) {
  const toneClasses = {
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    violet: "text-violet-400 bg-violet-500/10",
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs text-slate-400">{label}</span>

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            toneClasses[tone] || toneClasses.blue
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <p className="text-2xl font-mono font-bold text-slate-100">{value}</p>

      {description && (
        <p className="text-[11px] text-slate-500 mt-2">{description}</p>
      )}
    </div>
  );
}

function DailyPerformanceChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-500">
        No daily performance data available for this period.
      </div>
    );
  }

  const width = 900;
  const height = 290;

  const padding = {
    top: 24,
    right: 24,
    bottom: 42,
    left: 76,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const values = data.map((item) => Number(item.netPnL || 0));

  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);

  const range = maxValue - minValue || 1;

  const yMin = minValue - range * 0.12;
  const yMax = maxValue + range * 0.12;
  const yRange = yMax - yMin || 1;

  const scaleY = (value) =>
    padding.top + ((yMax - value) / yRange) * plotHeight;

  const zeroY = scaleY(0);

  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(34, slotWidth * 0.55);

  const tickCount = 4;

  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, index) => yMin + (yRange / tickCount) * index,
  );

  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[540px]"
        role="img"
        aria-label="Daily realized profit and loss chart"
      >
        {ticks.map((tick, index) => {
          const y = scaleY(tick);

          return (
            <g key={index}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray="4 5"
              />

              <text
                x={padding.left - 12}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500"
                fontSize="11"
              >
                {formatCompactCurrency(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={padding.left}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          stroke="currentColor"
          strokeOpacity="0.35"
        />

        {data.map((item, index) => {
          const pnl = Number(item.netPnL || 0);

          const x =
            padding.left + index * slotWidth + (slotWidth - barWidth) / 2;

          const valueY = scaleY(pnl);

          const barY = Math.min(valueY, zeroY);
          const barHeight = Math.max(2, Math.abs(zeroY - valueY));

          const dateLabel = formatDate(item.date);

          const showLabel =
            index % labelStep === 0 || index === data.length - 1;

          return (
            <g key={item.date}>
              <rect
                x={x}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx="5"
                className={pnl >= 0 ? "fill-emerald-500" : "fill-rose-500"}
                fillOpacity="0.85"
              >
                <title>
                  {`${dateLabel} · ${formatCurrency(pnl)} · ${item.totalTrades} trades`}
                </title>
              </rect>

              {showLabel && (
                <text
                  x={x + barWidth / 2}
                  y={height - 15}
                  textAnchor="middle"
                  className="fill-slate-500"
                  fontSize="11"
                >
                  {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                    "en-IN",
                    { day: "2-digit", month: "short" },
                  )}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-5 mt-2 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          Profit
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
          Loss
        </span>
      </div>
    </div>
  );
}

function BreakdownPanel({
  title,
  description,
  items = [],
  emptyMessage,
  icon: Icon,
}) {
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
            <Icon className="w-4 h-4" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-200">{title}</h2>

            <p className="text-[11px] text-slate-500 mt-1">{description}</p>
          </div>
        </div>
      </div>

      {!items.length ? (
        <div className="p-8 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="p-5 space-y-5">
          {items.map((item) => {
            const pnl = Number(item.netPnL || 0);
            const winRate = Math.max(
              0,
              Math.min(100, Number(item.winRate || 0)),
            );

            return (
              <div key={item.tag}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {formatTag(item.tag)}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-1">
                      {item.totalTrades} trades · {item.winRate}% win rate
                    </p>
                  </div>

                  <p
                    className={`text-xs font-mono font-bold ${
                      pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {pnl > 0 ? "+" : ""}
                    {formatCurrency(pnl)}
                  </p>
                </div>

                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${winRate}%` }}
                  />
                </div>

                <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                  <span>{item.winningTrades} wins</span>
                  <span>{item.losingTrades} losses</span>
                  <span>PF: {formatProfitFactor(item.profitFactor)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DisciplinePanel({ discipline = {} }) {
  const rate = Math.max(
    0,
    Math.min(100, Number(discipline.planFollowRate || 0)),
  );

  const tracked = Number(discipline.trackedTrades || 0);
  const followed = Number(discipline.followedPlanTrades || 0);
  const notFollowed = Number(discipline.notFollowedPlanTrades || 0);

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <FiShield className="w-4 h-4" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-200">
            Trading Discipline
          </h2>

          <p className="text-[11px] text-slate-500 mt-1">
            How consistently you followed your trading plan
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-7">
        <div
          className="w-36 h-36 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: `conic-gradient(#10b981 ${rate}%, #334155 ${rate}%)`,
          }}
        >
          <div className="w-[114px] h-[114px] rounded-full bg-slate-900 flex flex-col items-center justify-center">
            <p className="text-2xl font-mono font-bold text-slate-100">
              {rate.toFixed(1)}%
            </p>

            <p className="text-[10px] text-slate-500 mt-1">Plan Follow Rate</p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-400" />
              <span className="text-xs text-slate-300">Followed Plan</span>
            </div>

            <span className="text-sm font-mono font-bold text-emerald-400">
              {followed}
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${tracked ? (followed / tracked) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-amber-400" />
              <span className="text-xs text-slate-300">Deviated From Plan</span>
            </div>

            <span className="text-sm font-mono font-bold text-amber-400">
              {notFollowed}
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{
                width: `${tracked ? (notFollowed / tracked) * 100 : 0}%`,
              }}
            />
          </div>

          <p className="text-[10px] text-slate-500 pt-1">
            Based on {tracked} journaled trades with a recorded plan decision.
          </p>
        </div>
      </div>
    </section>
  );
}

function DailyHistoryTable({ data = [] }) {
  const recentDays = [...data].reverse().slice(0, 7);

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-800">
        <h2 className="text-sm font-bold text-slate-200">
          Daily Trading History
        </h2>

        <p className="text-[11px] text-slate-500 mt-1">
          Recent realized performance
        </p>
      </div>

      {!recentDays.length ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No daily trading history available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-950/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Trades</th>
                <th className="px-5 py-3 text-right">Net P&L</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {recentDays.map((day) => (
                <tr key={day.date}>
                  <td className="px-5 py-3 text-xs text-slate-300">
                    {formatDate(day.date)}
                  </td>

                  <td className="px-5 py-3 text-xs font-mono text-slate-400">
                    {day.totalTrades}
                  </td>

                  <td
                    className={`px-5 py-3 text-right text-xs font-mono font-bold ${
                      Number(day.netPnL) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {Number(day.netPnL) > 0 ? "+" : ""}
                    {formatCurrency(day.netPnL)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  const [range, setRange] = useState("ALL");
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchJournalAnalytics(user.uid, range);

        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load trading analytics:", err);
          setError(err.message || "Failed to load trading analytics.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [user, range, refreshKey]);

  const totalTrades = Number(analytics?.totalTrades || 0);
  const netPnL = Number(analytics?.netPnL || 0);

  const hasTrades = totalTrades > 0;

  const rangeLabel = {
    "1D": "Today",
    "1W": "Last 7 days",
    "1M": "Last 30 days",
    ALL: "Current account session",
  }[range];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <section>
        <p className="text-[10px] font-mono tracking-widest text-emerald-500">
          GUARDRAIL WORKSPACE
        </p>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              Trading Analytics
            </h1>

            <p className="text-sm text-slate-400 mt-2">
              Measure performance, understand your setups and improve trading
              discipline.
            </p>

            <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-slate-500">
              <FiClock className="w-3 h-3" />
              {rangeLabel}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setRange(option)}
                  disabled={loading}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    range === option
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              onClick={() => setRefreshKey((previous) => previous + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && !analytics ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center">
          <FiActivity className="w-7 h-7 text-emerald-400 mx-auto mb-3 animate-pulse" />

          <p className="text-sm text-slate-400">
            Loading your trading performance...
          </p>
        </div>
      ) : error ? (
        <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-12 text-center">
          <FiAlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />

          <p className="text-sm text-rose-400">{error}</p>

          <button
            onClick={() => setRefreshKey((previous) => previous + 1)}
            className="mt-4 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Try Again
          </button>
        </div>
      ) : analytics ? (
        <>
          {/* Primary Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              label="Net P&L"
              value={formatCurrency(analytics.netPnL)}
              description="Realized trading performance"
              icon={netPnL >= 0 ? FiTrendingUp : FiArrowDownRight}
              tone={netPnL >= 0 ? "emerald" : "rose"}
            />

            <MetricCard
              label="Win Rate"
              value={`${Number(analytics.winRate || 0).toFixed(2)}%`}
              description={`${analytics.winningTrades || 0} winning trades`}
              icon={FiTarget}
              tone="blue"
            />

            <MetricCard
              label="Profit Factor"
              value={formatProfitFactor(analytics.profitFactor)}
              description={
                analytics.profitFactor === null
                  ? "No gross losses in this range"
                  : "Gross profit / gross loss"
              }
              icon={FiActivity}
              tone="violet"
            />

            <MetricCard
              label="Total Trades"
              value={totalTrades}
              description={`${analytics.losingTrades || 0} losing trades`}
              icon={FiLayers}
              tone="amber"
            />
          </section>

          {/* Supporting Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              label="Average Win"
              value={formatCurrency(analytics.averageWin)}
              description={`${analytics.winningTrades || 0} profitable trades`}
              icon={FiArrowUpRight}
              tone="emerald"
            />

            <MetricCard
              label="Average Loss"
              value={formatCurrency(analytics.averageLoss)}
              description={`${analytics.losingTrades || 0} losing trades`}
              icon={FiArrowDownRight}
              tone="rose"
            />

            <MetricCard
              label="Trade Expectancy"
              value={formatCurrency(analytics.expectancy)}
              description="Average net P&L per trade"
              icon={FiBarChart2}
              tone="blue"
            />

            <MetricCard
              label="Plan Follow Rate"
              value={`${Number(
                analytics.discipline?.planFollowRate || 0,
              ).toFixed(2)}%`}
              description={`${analytics.discipline?.followedPlanTrades || 0} trades followed the plan`}
              icon={FiShield}
              tone="violet"
            />
          </section>

          {/* Empty Data Notice */}
          {!hasTrades && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
              <FiBarChart2 className="w-8 h-8 text-slate-500 mx-auto mb-3" />

              <h2 className="text-sm font-semibold text-slate-200">
                No journaled trades in this period
              </h2>

              <p className="text-xs text-slate-500 mt-2">
                Complete your trade journals to start analysing your
                performance.
              </p>
            </div>
          )}

          {/* P&L Analysis */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200">
                  Daily P&L Performance
                </h2>

                <p className="text-[11px] text-slate-500 mt-1">
                  Realized profit and loss grouped by trading date
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-500">Gross Profit</p>

                <p className="text-sm font-mono font-bold text-emerald-400">
                  {formatCurrency(analytics.grossProfit)}
                </p>

                <p className="text-[10px] text-slate-500 mt-2">Gross Loss</p>

                <p className="text-sm font-mono font-bold text-rose-400">
                  {formatCurrency(analytics.grossLoss)}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <DailyPerformanceChart data={analytics.dailyPerformance || []} />
            </div>
          </section>

          {/* Setup and Emotion Analysis */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <BreakdownPanel
              title="Setup Performance"
              description="Compare profitability across your trading setups"
              items={analytics.setupPerformance || []}
              icon={FiTarget}
              emptyMessage="No setup performance data available."
            />

            <BreakdownPanel
              title="Psychology & Emotions"
              description="Understand how emotional states relate to trade outcomes"
              items={analytics.emotionPerformance || []}
              icon={FiActivity}
              emptyMessage="No emotion performance data available."
            />
          </section>

          {/* Discipline and Daily History */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <DisciplinePanel discipline={analytics.discipline || {}} />

            <DailyHistoryTable data={analytics.dailyPerformance || []} />
          </section>

          {/* Footer Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-2">
              <FiCalendar className="w-3 h-3" />
              {rangeLabel}
            </span>

            <span>
              {analytics.scope === "CURRENT_SESSION"
                ? "Metrics are limited to the current account session."
                : "Metrics reflect the selected date range."}
            </span>
          </div>
        </>
      ) : null}
    </main>
  );
}
