function JournalModal({ open = false, onClose }) {
  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="journal-title" className="fixed inset-0 grid place-items-center bg-black/60 p-4">
      <section className="w-full max-w-lg rounded-lg bg-slate-900 p-6">
        <h2 id="journal-title" className="text-lg font-semibold">Trade journal</h2>
        <button type="button" className="mt-4 rounded bg-slate-700 px-3 py-2" onClick={onClose}>Close</button>
      </section>
    </div>
  )
}

export default JournalModal
