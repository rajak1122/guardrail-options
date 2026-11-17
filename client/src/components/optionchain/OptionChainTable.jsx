import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { FiTrendingUp, FiActivity } from "react-icons/fi";

export default function OptionChainTable({ onSelectContract }) {
  const [symbol, setSymbol] = useState("NIFTY");
  const [spotPrice, setSpotPrice] = useState(25350.0);
  const [optionChain, setOptionChain] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to backend Socket.io server
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to market data feed socket");
    });

    socket.on("market_tick", (data) => {
      if (data.symbol === symbol) {
        setSpotPrice(data.ltp);
      }
    });

    socket.on("option_chain_snapshot", (snapshot) => {
      if (snapshot.symbol === symbol) {
        setOptionChain(snapshot.chain || []);
        setLoading(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [symbol]);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiActivity className="text-emerald-400 w-5 h-5 animate-pulse" />
          <h2 className="font-bold text-sm text-slate-200">
            Live Option Chain
          </h2>
        </div>

        {/* Symbol Toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {["NIFTY", "BANKNIFTY"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSymbol(s);
                setLoading(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition ${
                symbol === s
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Spot Price Banner */}
      <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between font-mono text-xs">
        <span className="text-slate-400">
          Spot Index: <strong className="text-slate-100">{symbol}</strong>
        </span>
        <span className="text-emerald-400 font-bold text-sm">
          ₹{spotPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Chain Table */}
      {loading ? (
        <div className="p-10 text-center font-mono text-xs text-slate-500 animate-pulse">
          Awaiting market data stream...
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800 z-10">
              <tr>
                <th className="py-3 px-4">CE Delta</th>
                <th className="py-3 px-4">CE LTP (₹)</th>
                <th className="py-3 px-6 text-center">Strike</th>
                <th className="py-3 px-4 text-right">PE LTP (₹)</th>
                <th className="py-3 px-4 text-right">PE Delta</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {optionChain.map((row) => {
                const isAtm =
                  Math.abs(row.strike - spotPrice) <=
                  (symbol === "NIFTY" ? 50 : 100);
                return (
                  <tr
                    key={row.strike}
                    className={`hover:bg-slate-800/40 transition ${
                      isAtm
                        ? "bg-emerald-500/5 border-l-2 border-emerald-400"
                        : ""
                    }`}
                  >
                    {/* Call Side */}
                    <td className="py-3 px-4 text-slate-400">
                      {row.ce?.delta?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      ₹{row.ce?.ltp?.toFixed(2)}
                    </td>

                    {/* Strike */}
                    <td className="py-3 px-6 text-center font-bold text-slate-100 bg-slate-950/40">
                      {row.strike}
                      {isAtm && (
                        <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          ATM
                        </span>
                      )}
                    </td>

                    {/* Put Side */}
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      ₹{row.pe?.ltp?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {row.pe?.delta?.toFixed(2)}
                    </td>

                    {/* Trade Buttons */}
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() =>
                          onSelectContract &&
                          onSelectContract({
                            symbol: row.ce.symbol,
                            strike: row.strike,
                            optionType: "CE",
                            ltp: row.ce.ltp,
                          })
                        }
                        className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded transition font-bold"
                      >
                        Buy CE
                      </button>
                      <button
                        onClick={() =>
                          onSelectContract &&
                          onSelectContract({
                            symbol: row.pe.symbol,
                            strike: row.strike,
                            optionType: "PE",
                            ltp: row.pe.ltp,
                          })
                        }
                        className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 rounded transition font-bold"
                      >
                        Buy PE
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
