import React, { useState, useEffect } from "react";
import { placeOrder } from "../../api/tradingApi";
import { useAuth } from "../../context/AuthContext";
import { FiShoppingCart, FiAlertCircle, FiCheck, FiZap } from "react-icons/fi";

export default function OrderTicket({
  account,
  selectedContract,
  executionEvent,
  onOrderPlaced,
}) {
  const { user } = useAuth();
  const [lots, setLots] = useState(1); // Number of lots (1 lot = 75 NIFTY / 30 BANKNIFTY)
  const [orderType, setOrderType] = useState("MARKET");
  const [limitPrice, setLimitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [orderFeedbackStatus, setOrderFeedbackStatus] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState(null);

  useEffect(() => {
    if (selectedContract?.ltp) {
      setLimitPrice(selectedContract.ltp.toFixed(2));
    }
    setErrorMsg("");
    setSuccessMsg("");
  }, [selectedContract]);

  useEffect(() => {
    if (!executionEvent || !pendingOrderId) return;

    // Ignore execution events belonging to other orders
    if (executionEvent.orderId !== pendingOrderId) return;

    if (executionEvent.status !== "EXECUTED") return;

    const executedPrice = Number(executionEvent.executedPrice);

    setOrderFeedbackStatus("EXECUTED");

    setSuccessMsg(
      `${executionEvent.side} ${executionEvent.quantity} QTY filled @ ₹${executedPrice.toFixed(2)}`,
    );

    // Clear the completed pending order
    setPendingOrderId(null);

    console.log("Pending order updated to EXECUTED:", executionEvent);
  }, [executionEvent, pendingOrderId]);

  if (!selectedContract) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
          <FiShoppingCart className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-sm text-slate-200 mb-1">Order Ticket</h3>
        <p className="text-xs text-slate-400">
          Select an option strike from the live Option Chain below to prepare
          your execution.
        </p>
      </div>
    );
  }

  const underlying = selectedContract.symbol?.startsWith("BANKNIFTY")
    ? "BANKNIFTY"
    : "NIFTY";
  const lotSize = underlying === "BANKNIFTY" ? 30 : 75;
  const totalQty = lots * lotSize;
  const contractPrice =
    orderType === "MARKET"
      ? selectedContract.ltp
      : Number(limitPrice) || selectedContract.ltp;
  const estimatedCost = contractPrice * totalQty;

  const handleExecuteOrder = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setOrderFeedbackStatus("");

    if (account?.hasUnjournaledTrade) {
      setErrorMsg(
        "Journal Lock Active: You must complete your previous trade journal before opening a new position.",
      );
      return;
    }

    if (estimatedCost > (account?.currentBalance || 0)) {
      setErrorMsg("Insufficient balance for this order size.");
      return;
    }

    const resolvedUid =
      account?.firebaseUid || account?.userId || account?.uid || user?.uid;
    if (!resolvedUid) {
      setErrorMsg("Authentication Error: User ID not found in session.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        firebaseUid: resolvedUid,
        currentTickPrice: selectedContract.ltp,
        orderData: {
          symbol: selectedContract.symbol,
          underlying,
          strikePrice: selectedContract.strike,
          optionType: selectedContract.optionType,
          expiryDate: selectedContract.expiryDate || "2026-11-19",
          side: "BUY",
          orderType,
          quantity: Number(lots), // matchingEngine multiplies quantity (lots) * lotSize
          lotSize,
          limitPrice: orderType === "LIMIT" ? Number(limitPrice) : null,
        },
      };

      const res = await placeOrder(payload);

      const orderStatus = res?.order?.status;

      if (orderStatus === "PENDING") {
        setPendingOrderId(res.order._id);
      }

      if (orderStatus === "PENDING") {
        setOrderFeedbackStatus("PENDING");

        setSuccessMsg(
          `LIMIT BUY ${totalQty} QTY (${lots} lot${lots > 1 ? "s" : ""}) placed. Waiting for price ₹${Number(limitPrice).toFixed(2)}.`,
        );
      } else if (orderStatus === "EXECUTED") {
        setOrderFeedbackStatus("EXECUTED");

        const executedPrice = Number(
          res.order.executedPrice ?? selectedContract.ltp,
        );

        setSuccessMsg(
          `BUY ${totalQty} QTY (${lots} lot${lots > 1 ? "s" : ""}) filled @ ₹${executedPrice.toFixed(2)}`,
        );
      } else {
        setOrderFeedbackStatus("SUCCESS");
        setSuccessMsg(res?.message || "Order submitted successfully.");
      }

      if (onOrderPlaced) onOrderPlaced(res);
    } catch (err) {
      setErrorMsg(err.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FiZap className="text-emerald-400 w-4 h-4" />
          <h3 className="font-bold text-sm text-slate-200">
            Order Execution Ticket
          </h3>
        </div>
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
            selectedContract.optionType === "CE"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
          }`}
        >
          BUY {selectedContract.optionType} • {selectedContract.strike}
        </span>
      </div>

      {/* Contract Details */}
      <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-2 font-mono text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Contract Symbol:</span>
          <span className="text-slate-200 font-semibold">
            {selectedContract.symbol}
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Live LTP:</span>
          <span className="text-emerald-400 font-bold">
            ₹{selectedContract.ltp?.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Lot Size ({underlying}):</span>
          <span className="text-slate-200">{lotSize} Qty / Lot</span>
        </div>
      </div>

      {/* Order Type & Lots Inputs */}
      <div className="space-y-4 font-mono text-xs">
        <div>
          <label className="text-slate-400 block mb-1.5">Order Type</label>
          <div className="grid grid-cols-2 gap-2">
            {["MARKET", "LIMIT"].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`py-2 rounded-xl border transition font-bold ${
                  orderType === type
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {orderType === "LIMIT" && (
          <div>
            <label className="text-slate-400 block mb-1.5">
              Limit Price (₹)
            </label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        <div>
          <label className="text-slate-400 block mb-1.5">
            Lots ({totalQty} Total Qty)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 5].map((lotCount) => (
              <button
                key={lotCount}
                onClick={() => setLots(lotCount)}
                className={`flex-1 py-2 rounded-xl border transition font-bold ${
                  lots === lotCount
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {lotCount} {lotCount === 1 ? "Lot" : "Lots"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Estimate & Warnings */}
      <div className="border-t border-slate-800 pt-4 space-y-2 font-mono text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Estimated Margin Required:</span>
          <span className="text-slate-100 font-bold">
            ₹
            {estimatedCost.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 ${
              orderFeedbackStatus === "PENDING"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {orderFeedbackStatus === "PENDING" ? (
              <FiAlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <FiCheck className="w-4 h-4 shrink-0" />
            )}

            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecuteOrder}
        disabled={submitting}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/15"
      >
        {submitting
          ? "Executing Order..."
          : `BUY ${totalQty} QTY (${lots}L) @ ₹${contractPrice.toFixed(2)}`}
      </button>
    </div>
  );
}
