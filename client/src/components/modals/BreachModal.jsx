function BreachModal({ open = false, onClose }) {
  if (!open) return null

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="breach-title" className="fixed inset-0 grid place-items-center bg-black/60 p-4">
      <section className="w-full max-w-lg rounded-lg bg-slate-900 p-6">
        <h2 id="breach-title" className="text-lg font-semibold">Risk limit reached</h2>
        <p className="mt-2 text-sm text-slate-300">Trading is paused for this practice account.</p>
        <button type="button" className="mt-4 rounded bg-slate-700 px-3 py-2" onClick={onClose}>Close</button>
      </section>
    </div>
  )
}

export default BreachModal
