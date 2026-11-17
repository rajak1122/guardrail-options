import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { placeOrder } from "../../api/tradingApi";
import { FiActivity, FiXCircle, FiRefreshCw } from "react-icons/fi";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = `${SOCKET_URL}/api`;

export default function PositionsTray({
  account,
  refreshTrigger = 0,
  onPnLUpdate,
  onPositionClosed,
}) {
  const { user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [exitingSymbol, setExitingSymbol] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPositions = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/orders/positions/${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch open positions");
      const data = await res.json();
      setPositions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Fetch on mount and whenever an order is placed/closed
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions, refreshTrigger]);

  // Listen to live option chain snapshots to track LTP for open positions
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("option_chain_snapshot", (snapshot) => {
      if (!snapshot?.chain) return;
      setLivePrices((prev) => {
        const updated = { ...prev };
        snapshot.chain.forEach((row) => {
          if (row.ce?.symbol) updated[row.ce.symbol] = row.ce.ltp;
          if (row.pe?.symbol) updated[row.pe.symbol] = row.pe.ltp;
        });
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Calculate total floating P&L and notify parent header
  useEffect(() => {
    if (!onPnLUpdate) return;
    const totalPnL = positions.reduce((acc, pos) => {
      const currentLtp = livePrices[pos.symbol] ?? pos.averageEntryPrice;
      return acc + (currentLtp - pos.averageEntryPrice) * pos.quantity;
    }, 0);
    onPnLUpdate(totalPnL);
  }, [positions, livePrices, onPnLUpdate]);

  const handleExitPosition = async (pos) => {
    setErrorMsg("");
    const currentLtp = livePrices[pos.symbol] ?? pos.averageEntryPrice;
    const lotsToExit = Math.max(
      1,
      Math.round(pos.quantity / (pos.lotSize || 75)),
    );

    try {
      setExitingSymbol(pos.symbol);
      const payload = {
        firebaseUid: account?.userId || user?.uid,
        currentTickPrice: currentLtp,
        orderData: {
          symbol: pos.symbol,
          underlying: pos.underlying,
          strikePrice: pos.strikePrice,
          optionType: pos.optionType,
          expiryDate: pos.expiryDate || "2026-11-19",
          side: "SELL",
          orderType: "MARKET",
          quantity: lotsToExit,
          lotSize: pos.lotSize || (pos.underlying === "BANKNIFTY" ? 30 : 75),
        },
      };

      const res = await placeOrder(payload);
      await fetchPositions();
      if (onPositionClosed) onPositionClosed(res);
    } catch (err) {
      setErrorMsg(err.message || "Failed to exit position.");
    } finally {
      setExitingSymbol(null);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <FiActivity className="text-emerald-400 w-4 h-4" />
          <h3 className="font-bold text-sm text-slate-200">
            Positions {positions.length > 0 && `(${positions.length})`}
          </h3>
        </div>
        <button
          onClick={fetchPositions}
          title="Refresh Positions"
          className="text-slate-400 hover:text-slate-200 transition p-1"
        >
          <FiRefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {errorMsg && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {positions.length === 0 ? (
        <p className="text-xs text-slate-400">
          {loading ? "Loading open positions..." : "No open positions."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2 pr-3">CONTRACT</th>
                <th className="py-2 px-3">QTY</th>
                <th className="py-2 px-3">AVG ENTRY</th>
                <th className="py-2 px-3">LTP</th>
                <th className="py-2 px-3">P&L</th>
                <th className="py-2 pl-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {positions.map((pos) => {
                const currentLtp =
                  livePrices[pos.symbol] ?? pos.averageEntryPrice;
                const pnl = (currentLtp - pos.averageEntryPrice) * pos.quantity;
                const pnlPercent =
                  pos.averageEntryPrice > 0
                    ? ((currentLtp - pos.averageEntryPrice) /
                        pos.averageEntryPrice) *
                      100
                    : 0;
                const isProfit = pnl >= 0;

                return (
                  <tr
                    key={pos._id}
                    className="hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3 pr-3 font-semibold text-slate-200">
                      {pos.symbol}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{pos.quantity}</td>
                    <td className="py-3 px-3 text-slate-300">
                      ₹{pos.averageEntryPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-semibold">
                      ₹{currentLtp.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-3 font-bold ${
                        isProfit ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isProfit ? "+" : ""}₹{pnl.toFixed(2)}{" "}
                      <span className="text-[10px] opacity-80">
                        ({isProfit ? "+" : ""}
                        {pnlPercent.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        onClick={() => handleExitPosition(pos)}
                        disabled={exitingSymbol === pos.symbol}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 font-bold transition disabled:opacity-50"
                      >
                        <FiXCircle className="w-3.5 h-3.5" />
                        {exitingSymbol === pos.symbol ? "Exiting..." : "Exit"}
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
