export function StatsBar({
  contacts,
  history,
  filterMode,
  onFilterChange,
  onDialNext,
  onExportReport,
  nextContact,
}) {
  const total = contacts.length
  const dialedCount = Object.keys(history).length
  const pendingCount = Math.max(0, total - dialedCount)
  const percentage = total > 0 ? Math.round((dialedCount / total) * 100) : 0

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
      {/* Top row: Metrics & Quick Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Metric pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 px-3 py-1.5 ring-1 ring-white/5">
            <span className="text-xs text-slate-400">Total:</span>
            <span className="font-mono text-sm font-semibold text-white">{total}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 ring-1 ring-emerald-500/20">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-300">Dialed:</span>
            <span className="font-mono text-sm font-semibold text-emerald-400">{dialedCount}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 px-3 py-1.5 ring-1 ring-white/5">
            <span className="flex h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-xs text-slate-400">Pending:</span>
            <span className="font-mono text-sm font-semibold text-slate-200">{pendingCount}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Export Report */}
          {dialedCount > 0 && (
            <button
              type="button"
              onClick={onExportReport}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition active:scale-95"
              title="Download dialing report as CSV"
            >
              <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export Report</span>
            </button>
          )}

          {/* Quick Dial Next */}
          <button
            type="button"
            disabled={!nextContact}
            onClick={onDialNext}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none"
            title={nextContact ? `Dial next pending contact: ${nextContact.name || nextContact.phone}` : 'All contacts dialed!'}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.25 1.01l-2.2 2.22Z" />
            </svg>
            <span>Dial Next Contact</span>
            {nextContact && (
              <span className="hidden sm:inline font-normal text-emerald-900 opacity-80">
                ({nextContact.name || nextContact.phone})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="font-mono text-xs font-medium text-slate-400">{percentage}% completed</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-t border-white/5 pt-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mr-1">
          Show:
        </span>
        {[
          { id: 'all', label: 'All Contacts', count: total },
          { id: 'pending', label: 'Ready / Uncalled', count: pendingCount },
          { id: 'dialed', label: 'Dialed', count: dialedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              filterMode === tab.id
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {tab.label} <span className="font-mono text-[10px] opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>
    </div>
  )
}
