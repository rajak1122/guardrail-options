import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import TerminalPage from "./pages/TerminalPage";
import JournalDetailPage from "./pages/JournalDetailPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardModulePage from "./pages/DashboardModulePage";
import AccountsPage from "./pages/AccountsPage";
import JournalsPage from "./pages/JournalsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import { fetchAccountDetails } from "./api/tradingApi";

function AppRoutes() {
  const { user, logout } = useAuth();
  const [account, setAccount] = useState(null);
  const [accountMetrics, setAccountMetrics] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setAccount(null);
      setAccountMetrics(null);
      setLoadingAccount(false);
      return;
    }

    const loadAccount = async () => {
      try {
        const data = await fetchAccountDetails(user.uid);
        setAccount(data.account);
        setAccountMetrics(data.marketData?.available ? data.metrics : null);
      } catch (err) {
        // If account doesn't exist yet, setAccount to null so Dashboard handles provisioning
        setAccount(null);
        setAccountMetrics(null);
      } finally {
        setLoadingAccount(false);
      }
    };

    loadAccount();
  }, [user]);

  useEffect(() => {
    const dashboardRoutes = ["/dashboard", "/accounts"];

    if (
      !user ||
      !account?._id ||
      !dashboardRoutes.includes(location.pathname)
    ) {
      return;
    }

    let cancelled = false;

    const refreshAccountSnapshot = async () => {
      try {
        const data = await fetchAccountDetails(user.uid);

        if (cancelled) return;

        // Update account only when important fields change.
        if (data.account) {
          setAccount((previous) => {
            const next = data.account;

            if (!previous) return next;

            const fieldsToCompare = [
              "_id",
              "status",
              "accountSize",
              "currentBalance",
              "highWaterMark",
              "hasUnjournaledTrade",
              "lastUnjournaledTradeId",
              "breachReason",
              "breachedAt",
            ];

            const changed = fieldsToCompare.some(
              (field) =>
                String(previous[field] ?? "") !== String(next[field] ?? ""),
            );

            return changed ? next : previous;
          });
        }

        setAccountMetrics(
          data.marketData?.available === true ? data.metrics : null,
        );
      } catch (error) {
        if (!cancelled) {
          setAccountMetrics(null);
          console.error("Failed to refresh account risk snapshot:", error);
        }
      }
    };

    refreshAccountSnapshot();

    const intervalId = setInterval(refreshAccountSnapshot, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [user, account?._id, location.pathname]);

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
      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              account={account}
              setAccount={setAccount}
              accountMetrics={accountMetrics}
              setAccountMetrics={setAccountMetrics}
            />
          }
        />

        <Route
          path="/accounts"
          element={
            <AccountsPage
              account={account}
              setAccount={setAccount}
              accountMetrics={accountMetrics}
              setAccountMetrics={setAccountMetrics}
            />
          }
        />

        <Route path="/journals" element={<JournalsPage />} />

        <Route path="/analytics" element={<AnalyticsPage />} />

        <Route path="/profile" element={<ProfilePage />} />

        <Route
          path="/support"
          element={
            <DashboardModulePage
              title="Feedback & Support"
              description="Share feedback and report bugs or account-related complaints."
            />
          }
        />
      </Route>

      {/* Trading Terminal remains separate */}
      <Route
        path="/terminal"
        element={
          account && account.status === "ACTIVE" ? (
            <TerminalPage
              account={account}
              logout={logout}
              setAccount={setAccount}
            />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Journal detail remains separate */}
      <Route
        path="/journal/:tradeId"
        element={
          <JournalDetailPage
            onJournalSubmitted={(updatedAccount) => {
              setAccount(updatedAccount);
            }}
          />
        }
      />

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
