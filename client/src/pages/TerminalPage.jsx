import AccountHeader from '../components/terminal/AccountHeader'
import OrderTicket from '../components/terminal/OrderTicket'
import PositionsTray from '../components/terminal/PositionsTray'
import OptionChainTable from '../components/optionchain/OptionChainTable'
import PremiumChart from '../components/charts/PremiumChart'
import SpotChart from '../components/charts/SpotChart'

function TerminalPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AccountHeader />
      <main className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4"><SpotChart /><OptionChainTable /><PositionsTray /></div>
        <div className="grid content-start gap-4"><PremiumChart /><OrderTicket /></div>
      </main>
    </div>
  )
}

export default TerminalPage
