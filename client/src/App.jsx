import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import TerminalPage from "./pages/TerminalPage";
import JournalDetailPage from "./pages/JournalDetailPage";
import { fetchAccountDetails } from "./api/tradingApi";

function AppRoutes() {
  const { user, logout } = useAuth();
  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccount(null);
      setLoadingAccount(false);
      return;
    }

    const loadAccount = async () => {
      try {
        setLoadingAccount(true);
        const data = await fetchAccountDetails(user.uid);
        setAccount(data.account);
      } catch (err) {
        // If account doesn't exist yet, setAccount to null so Dashboard handles provisioning
        setAccount(null);
      } finally {
        setLoadingAccount(false);
      }
    };

    loadAccount();
  }, [user]);

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (loadingAccount) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-sm animate-pulse">
        Syncing Guardrail Account...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/dashboard"
        element={<DashboardPage account={account} setAccount={setAccount} />}
      />
      <Route
        path="/terminal"
        element={
          account && account.status === "ACTIVE" ? (
            <TerminalPage account={account} logout={logout} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route path="/journal/:tradeId" element={<JournalDetailPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
