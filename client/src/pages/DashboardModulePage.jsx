import React from "react";

export default function DashboardModulePage({ title, description }) {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-8 md:px-8">
      <div>
        <p className="text-[10px] font-mono tracking-widest text-emerald-500">
          GUARDRAIL WORKSPACE
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-slate-100">{title}</h2>

        <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>
      </div>

      <section className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          This workspace is being prepared. Its features will be implemented in
          the upcoming development phase.
        </p>
      </section>
    </main>
  );
}
