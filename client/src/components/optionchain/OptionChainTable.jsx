import StrikeRow from './StrikeRow'

function OptionChainTable() {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-700">
      <h2 className="border-b border-slate-700 p-4 text-lg font-semibold">Option chain</h2>
      <table className="w-full text-left text-sm">
        <thead className="text-slate-400">
          <tr><th className="p-3">Call</th><th className="p-3">Strike</th><th className="p-3">Put</th></tr>
        </thead>
        <tbody><StrikeRow strike="—" /></tbody>
      </table>
    </section>
  )
}

export default OptionChainTable
