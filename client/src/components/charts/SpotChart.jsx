import React, { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { io } from "socket.io-client";
import { FiTrendingUp } from "react-icons/fi";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SpotChart() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [lastPrice, setLastPrice] = useState(null);
  const chartContainerRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#020617" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#0f172a" },
        horzLines: { color: "#0f172a" },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: "#1e293b",
      },
      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 280,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
    });

    seriesRef.current = candleSeries;

    // Load initial historical bars
    fetch(`${SOCKET_URL}/api/candles/${symbol}`)
      .then((res) => res.json())
      .then((bars) => {
        if (Array.isArray(bars) && bars.length > 0) {
          const formatted = bars
            .sort((a, b) => a.time - b.time)
            .map((b) => ({
              time: b.time,
              open: b.open,
              high: b.high,
              low: b.low,
              close: b.close,
            }));
          candleSeries.setData(formatted);
          setLastPrice(formatted[formatted.length - 1].close);
          chart.timeScale().fitContent();
        }
      })
      .catch((err) => console.error("Error loading spot candles:", err));

    // Subscribe to live 1m candle updates
    const socket = io(SOCKET_URL);
    socket.on("candle_update", (candle) => {
      if (candle?.symbol === symbol && seriesRef.current) {
        seriesRef.current.update({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
        setLastPrice(candle.close);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.disconnect();
      chart.remove();
    };
  }, [symbol]);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="text-emerald-400 w-4 h-4" />
          <span className="font-bold text-sm text-slate-200">
            {symbol} Index Spot
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            1M
          </span>
          {lastPrice && (
            <span className="font-mono text-xs font-bold text-emerald-400 ml-1">
              ₹{lastPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        <div className="flex gap-1.5 font-mono text-xs">
          {["NIFTY", "BANKNIFTY"].map((idx) => (
            <button
              key={idx}
              onClick={() => setSymbol(idx)}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                symbol === idx
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {idx}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full rounded-xl overflow-hidden"
      />
    </div>
  );
}
