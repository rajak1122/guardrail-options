import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import TerminalPage from "./pages/TerminalPage";
import HistoryPage from "./pages/HistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function CapitalTierSetup({ user, logout, onAccountCreated }) {
  const [selectedTier, setSelectedTier] = useState(500000);
  const [submitting, setSubmitting] = useState(false);

  const handleInitializeAccount = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:5000/api/accounts/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          accountSize: selectedTier,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onAccountCreated(data.account);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to initialize account:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">
            Select Starting Capital Tier
          </h2>
          <button
            onClick={logout}
            className="text-xs text-rose-400 hover:underline"
          >
            Sign Out
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Choose your simulated account size to initialize your risk guardrails,
          daily loss limits, and trailing drawdowns.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[50000, 100000, 200000, 500000, 1000000].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`py-3 px-4 rounded-xl font-mono text-sm border transition ${
                selectedTier === tier
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              ₹{tier >= 100000 ? `${tier / 100000}L` : `${tier / 1000}k`}
            </button>
          ))}
        </div>

        <button
          onClick={handleInitializeAccount}
          disabled={submitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold py-3 rounded-xl transition duration-200"
        >
          {submitting ? "Initializing Account..." : "Launch Terminal"}
        </button>
      </div>
    </div>
  );
}

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

    const fetchAccountDetails = async () => {
      try {
        setLoadingAccount(true);
        const res = await fetch(
          `http://localhost:5000/api/accounts/${user.uid}`,
        );
        if (res.ok) {
          const data = await res.json();
          setAccount(data.account);
        } else {
          setAccount(null);
        }
      } catch (err) {
        console.error("Error fetching account:", err);
      } finally {
        setLoadingAccount(false);
      }
    };

    fetchAccountDetails();
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <p className="animate-pulse font-mono">Syncing Guardrail Account...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <CapitalTierSetup
        user={user}
        logout={logout}
        onAccountCreated={(newAcc) => setAccount(newAcc)}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/terminal"
        element={<TerminalPage account={account} logout={logout} />}
      />
      <Route
        path="/history"
        element={<HistoryPage account={account} logout={logout} />}
      />
      <Route
        path="/analytics"
        element={<AnalyticsPage account={account} logout={logout} />}
      />
      <Route path="*" element={<Navigate to="/terminal" replace />} />
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
