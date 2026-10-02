export function Toast({ toast, onDismiss }) {
  if (!toast) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-in fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-400/40 bg-slate-950/95 px-5 py-3.5 text-sm text-slate-100 shadow-2xl shadow-emerald-950/60 backdrop-blur-md"
    >
      {/* Pulsing Green Call Beacon */}
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
      </span>

      <div>
        <p className="font-medium text-emerald-300">
          Dialing <span className="font-semibold text-white">{toast.label}</span> via Zoiper...
        </p>
        {toast.uri && (
          <p className="font-mono text-[11px] text-slate-400 truncate max-w-xs">
            Triggered: <span className="text-emerald-400">{toast.uri}</span>
          </p>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss toast"
        >
          ✕
        </button>
      )}
    </div>
  )
}

