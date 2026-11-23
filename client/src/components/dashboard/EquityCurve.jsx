import React, { useEffect, useMemo, useState } from "react";
import { FiTrendingUp, FiActivity } from "react-icons/fi";
import { fetchEquityCurve } from "../../api/tradingApi";

const RANGES = ["1D", "1W", "1M", "ALL"];

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatAxisDate = (value, range) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  if (range === "1D") {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

export default function EquityCurve({ userId }) {
  const [range, setRange] = useState("1D");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const loadEquityCurve = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetchEquityCurve(userId, range);

        if (!cancelled) {
          setData(response);

          const latestTrade = response.points?.at(-1);

          setSelectedTradeId(latestTrade?.tradeId || null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load equity curve:", err);
          setError(true);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEquityCurve();

    return () => {
      cancelled = true;
    };
  }, [userId, range]);

  const points = data?.points || [];

  const chart = useMemo(() => {
    if (!points.length) return null;

    const width = 760;
    const height = 270;

    const left = 82;
    const right = 22;
    const top = 20;
    const bottom = 43;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const balances = points.map((point) => Number(point.balanceAfter));

    const startingBalance = Number(data?.account?.startingBalance || 0);

    let minimum = Math.min(...balances, startingBalance);
    let maximum = Math.max(...balances, startingBalance);

    if (maximum === minimum) {
      const padding = Math.max(100, Math.abs(maximum) * 0.01);
      minimum -= padding;
      maximum += padding;
    } else {
      const padding = (maximum - minimum) * 0.15;
      minimum -= padding;
      maximum += padding;
    }

    const yPosition = (value) =>
      top + ((maximum - value) / (maximum - minimum)) * plotHeight;

    const coordinates = points.map((point, index) => ({
      ...point,
      x:
        points.length === 1
          ? left + plotWidth / 2
          : left + (index / (points.length - 1)) * plotWidth,
      y: yPosition(Number(point.balanceAfter)),
    }));

    const gridLines = Array.from({ length: 4 }, (_, index) => {
      const value = maximum - (index / 3) * (maximum - minimum);

      return {
        value,
        y: yPosition(value),
      };
    });

    const axisIndexes = [
      ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
    ];

    return {
      width,
      height,
      left,
      right,
      top,
      bottom,
      coordinates,
      gridLines,
      axisIndexes,
      startingBalanceY: yPosition(startingBalance),
      linePoints: coordinates.map((point) => `${point.x},${point.y}`).join(" "),
    };
  }, [points, data]);

  const selectedTrade =
    points.find((point) => point.tradeId === selectedTradeId) ||
    points.at(-1) ||
    null;

  const realizedPnL = Number(data?.summary?.realizedPnL || 0);

  return (
    <section className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4 text-emerald-400" />

            <h2 className="text-sm font-bold text-slate-200">Equity Curve</h2>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Realized balance after every closed trade
          </p>
        </div>

        <div className="flex gap-1.5">
          {RANGES.map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                range === item
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {!loading && !error && points.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <p className="text-xs text-slate-400">Realized P&L</p>

            <p
              className={`text-xl font-mono font-bold mt-1 ${
                realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {realizedPnL >= 0 ? "+" : ""}
              {formatCurrency(realizedPnL)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Closed Trades</p>

            <p className="text-xl font-mono font-bold text-slate-200 mt-1">
              {data.summary.closedTrades}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="min-h-[260px] flex items-center justify-center text-sm text-slate-400 animate-pulse">
          Loading equity history...
        </div>
      ) : error ? (
        <div className="min-h-[260px] flex items-center justify-center text-sm text-rose-400">
          Unable to load equity history.
        </div>
      ) : points.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center text-center">
          <FiActivity className="w-9 h-9 text-slate-500 mb-3" />

          <p className="text-sm font-medium text-slate-300">
            No closed trades in this period
          </p>

          <p className="text-xs text-slate-500 mt-2 max-w-xs">
            Once you close a position, your realized equity progression will
            appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              className="w-full min-w-[420px]"
              role="img"
              aria-label="Realized account equity after each closed trade"
            >
              {/* Horizontal grid lines */}
              {chart.gridLines.map((line, index) => (
                <g key={index}>
                  <line
                    x1={chart.left}
                    y1={line.y}
                    x2={chart.width - chart.right}
                    y2={line.y}
                    stroke="currentColor"
                    opacity="0.12"
                    strokeDasharray="4 5"
                  />

                  <text
                    x={chart.left - 10}
                    y={line.y + 4}
                    fontSize="11"
                    fill="currentColor"
                    opacity="0.65"
                    textAnchor="end"
                  >
                    ₹{(line.value / 1000).toFixed(1)}K
                  </text>
                </g>
              ))}

              {/* Starting capital reference */}
              <line
                x1={chart.left}
                y1={chart.startingBalanceY}
                x2={chart.width - chart.right}
                y2={chart.startingBalanceY}
                stroke="#D69E36"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                opacity="0.8"
              />

              {/* Equity curve */}
              {chart.coordinates.length > 1 && (
                <polyline
                  points={chart.linePoints}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Closed trade points */}
              {chart.coordinates.map((point) => (
                <circle
                  key={point.tradeId}
                  cx={point.x}
                  cy={point.y}
                  r={selectedTradeId === point.tradeId ? 6 : 4}
                  fill="#10B981"
                  stroke="#0F172A"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onMouseEnter={() => setSelectedTradeId(point.tradeId)}
                  onClick={() => setSelectedTradeId(point.tradeId)}
                >
                  <title>
                    {`${point.symbol} | ${formatCurrency(point.balanceAfter)}`}
                  </title>
                </circle>
              ))}

              {/* X-axis date labels */}
              {chart.axisIndexes.map((index) => {
                const point = chart.coordinates[index];

                return (
                  <text
                    key={point.tradeId}
                    x={point.x}
                    y={chart.height - 12}
                    fontSize="10"
                    fill="currentColor"
                    opacity="0.65"
                    textAnchor="middle"
                  >
                    {formatAxisDate(point.exitTime, range)}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Chart legend */}
          <div className="flex items-center gap-5 flex-wrap mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400">
                Realized Equity
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 border-t border-dashed border-amber-500" />
              <span className="text-[10px] text-slate-400">
                Starting Capital
              </span>
            </div>
          </div>

          {/* Selected trade details */}
          {selectedTrade && (
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Contract</p>
                <p className="text-xs font-mono text-slate-200">
                  {selectedTrade.symbol}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 mb-1">Trade P&L</p>
                <p
                  className={`text-xs font-mono font-bold ${
                    selectedTrade.netPnL >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {selectedTrade.netPnL >= 0 ? "+" : ""}
                  {formatCurrency(selectedTrade.netPnL)}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 mb-1">
                  Balance After Trade
                </p>
                <p className="text-xs font-mono text-slate-200">
                  {formatCurrency(selectedTrade.balanceAfter)}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 mb-1">Closed At</p>
                <p className="text-xs text-slate-200">
                  {formatAxisDate(selectedTrade.exitTime, range)}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
