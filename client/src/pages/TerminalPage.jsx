import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAccountDetails } from "../api/tradingApi";
import { io } from "socket.io-client";
import AccountHeader from "../components/terminal/AccountHeader";
import OrderTicket from "../components/terminal/OrderTicket";
import PositionsTray from "../components/terminal/PositionsTray";
import OptionChainTable from "../components/optionchain/OptionChainTable";
import PremiumChart from "../components/charts/PremiumChart";
import SpotChart from "../components/charts/SpotChart";
import JournalLockModal from "../components/modals/JournalLockModal";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TerminalPage({ account, logout, setAccount }) {
  const [selectedContract, setSelectedContract] = useState(null);
  const [lockedTradeId, setLockedTradeId] = useState(null);
  const [closedTradeSummary, setClosedTradeSummary] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [executionEvent, setExecutionEvent] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. Check account lock status on initial load / refresh
  useEffect(() => {
    if (account?.hasUnjournaledTrade && account?.lastUnjournaledTradeId) {
      setLockedTradeId(account.lastUnjournaledTradeId);
    } else {
      // Clear stale journal lock after successful submission
      setLockedTradeId(null);
      setClosedTradeSummary(null);
    }
  }, [account?.hasUnjournaledTrade, account?.lastUnjournaledTradeId]);

  // 2. Listen for automated TP/SL lock events over Socket.io
  useEffect(() => {
    let socket;
    let cancelled = false;

    const connectTradingSocket = async () => {
      if (!user || !account?._id) return;

      try {
        // Get Firebase ID token
        const token = await user.getIdToken();

        if (cancelled) return;

        // Connect to authenticated trading namespace
        socket = io(`${SOCKET_URL}/trading`, {
          auth: {
            token,
          },
        });

        socket.on("connect", () => {
          console.log("Authenticated trading socket connected");
        });

        socket.on("connect_error", (error) => {
          console.error("Trading socket connection failed:", error.message);
        });

        socket.on("trading_locked", (data) => {
          if (data?.tradeId) {
            setLockedTradeId(data.tradeId);
          }
        });

        socket.on("order_executed", (data) => {
          console.log("Order executed event received:", data);

          setExecutionEvent(data);

          // Refresh positions after backend execution
          setRefreshTrigger((prev) => prev + 1);
        });

        socket.on("account_breached", async (data) => {
          console.log("Account breach event received:", data);

          // Ignore events belonging to another account.
          if (data?.accountId?.toString() !== account._id.toString()) {
            return;
          }

          // Immediately update the shared account state.
          setAccount((prev) => ({
            ...prev,
            status: "BREACHED",
            breachReason: data.reason,
            breachedAt: data.breachedAt,
          }));

          // Navigate immediately without waiting for the API.
          navigate("/dashboard", { replace: true });

          // Sync the complete account data after backend transaction.
          try {
            const latestData = await fetchAccountDetails(user.uid);

            if (latestData?.account) {
              setAccount(latestData.account);
            }
          } catch (error) {
            console.error("Failed to refresh breached account:", error);
          }
        });
      } catch (error) {
        console.error("Unable to initialize trading socket:", error);
      }
    };

    connectTradingSocket();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [account?._id, user]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-10">
      <AccountHeader account={account} />
      {/* Blocking Journal Lock Modal */}
      <JournalLockModal
        isOpen={Boolean(lockedTradeId)}
        tradeId={lockedTradeId}
        tradeSummary={closedTradeSummary}
      />
      <main className="mx-auto max-w-7xl grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <SpotChart />
          <OptionChainTable
            onSelectContract={(contract) => setSelectedContract(contract)}
          />
          {/* Positions Tray */}
          <PositionsTray
            account={account}
            refreshTrigger={refreshTrigger}
            onPositionClosed={(res) => {
              if (res?.tradeHistory) {
                setClosedTradeSummary(res.tradeHistory);
                setLockedTradeId(res.tradeHistory._id);
              }
            }}
          />
        </div>
        <div className="grid content-start gap-4">
          <PremiumChart selectedContract={selectedContract} />
          {/* Order Ticket */}
          <OrderTicket
            account={account}
            selectedContract={selectedContract}
            executionEvent={executionEvent}
            onOrderPlaced={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </div>
      </main>
    </div>
  );
}
