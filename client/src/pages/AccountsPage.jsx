import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { initializeAccount } from "../api/tradingApi";

import AccountSummary from "../components/dashboard/AccountSummary";
import CapitalTierSetup from "../components/dashboard/CapitalTierSetup";
import RiskSnapshot from "../components/dashboard/RiskSnapshot";

import { FiAlertTriangle } from "react-icons/fi";

export default function AccountsPage({
  account,
  setAccount,
  accountMetrics,
  setAccountMetrics,
}) {
  const { user } = useAuth();

  const [selectedTier, setSelectedTier] = useState(
    account?.accountSize ?? 500000,
  );
  const [initializing, setInitializing] = useState(false);

  const needsNewAccount = !account || account.status === "BREACHED";

  const handleCreateOrResetAccount = async () => {
    try {
      setInitializing(true);

      const data = await initializeAccount({
        firebaseUid: user.uid,
        email: user.email,
        accountSize: selectedTier,
      });

      setAccount(data.account);
      setAccountMetrics(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setInitializing(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <p className="text-[10px] font-mono tracking-widest text-emerald-500">
          GUARDRAIL WORKSPACE
        </p>

        <h1 className="text-2xl font-semibold text-slate-100 mt-2">
          Account Management
        </h1>

        <p className="text-sm text-slate-400 mt-2">
          Manage your trading account, capital tier and risk limits.
        </p>
      </div>

      {account?.status === "BREACHED" && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-start gap-3">
          <FiAlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />

          <div>
            <h3 className="font-bold text-rose-300 text-sm">
              Account Breached — Trading Locked
            </h3>

            <p className="text-xs text-rose-300/80 mt-1">
              Reason: {account.breachReason || "Risk limit exceeded"}
            </p>

            {account.breachedAt && (
              <p className="text-xs text-slate-400 mt-1">
                Breached at:{" "}
                {new Date(account.breachedAt).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Account Summary and Capital Tier Setup */}
      <section className="grid lg:grid-cols-12 gap-6">
        <AccountSummary account={account} accountMetrics={accountMetrics} />

        <CapitalTierSetup
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          needsNewAccount={needsNewAccount}
          initializing={initializing}
          onInitialize={handleCreateOrResetAccount}
        />
      </section>

      {/* Detailed Account Risk Intelligence */}
      <section>
        <RiskSnapshot metrics={accountMetrics} />
      </section>
    </main>
  );
}
