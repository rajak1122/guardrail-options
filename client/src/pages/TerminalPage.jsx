import React, { useState } from "react";
import AccountHeader from "../components/terminal/AccountHeader";
import OrderTicket from "../components/terminal/OrderTicket";
import PositionTray from "../components/terminal/PositionsTray";
import OptionChainTable from "../components/optionchain/OptionChainTable";
import PremiumChart from "../components/charts/PremiumChart";
import SpotChart from "../components/charts/SpotChart";

export default function TerminalPage({ account, logout }) {
  const [selectedContract, setSelectedContract] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-10">
      <AccountHeader account={account} />
      <main className="mx-auto max-w-7xl grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <SpotChart />
          <OptionChainTable
            onSelectContract={(contract) => setSelectedContract(contract)}
          />
          <PositionTray account={account} />
        </div>
        <div className="grid content-start gap-4">
          <PremiumChart selectedContract={selectedContract} />
          <OrderTicket account={account} selectedContract={selectedContract} />
        </div>
      </main>
    </div>
  );
}
