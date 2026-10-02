export function UploadZone({
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFile,
  onDemo,
  onSampleDownload,
  disabled,
  sheetNames = [],
  activeSheet = '',
  onSelectSheet,
  compact = false,
}) {
  return (
    <section
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${
        dragging
          ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 scale-[1.005]'
          : 'border-white/15 bg-gradient-to-b from-slate-900/80 to-slate-950/80 hover:border-emerald-400/40 hover:bg-slate-900/90'
      } ${compact ? 'p-5' : 'p-8 sm:p-10'}`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Upload Icon */}
        <div
          className={`mb-4 flex items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 ${
            compact ? 'h-10 w-10' : 'h-14 w-14'
          }`}
        >
          <svg
            className={compact ? 'h-5 w-5' : 'h-7 w-7'}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-white">
          {compact ? 'Upload or Replace Contact List' : 'Drop your Excel or CSV file here'}
        </h3>
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-400">
          Client-side instant parsing for <code className="font-mono text-emerald-400">.xlsx</code>,{' '}
          <code className="font-mono text-emerald-400">.xls</code>, and{' '}
          <code className="font-mono text-emerald-400">.csv</code>. Your contact records never leave
          your browser.
        </p>

        {/* Format badges */}
        <div className="mt-3 flex items-center gap-2">
          {['.XLSX', '.XLS', '.CSV'].map((format) => (
            <span
              key={format}
              className="rounded-md border border-white/10 bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-300"
            >
              {format}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <label className="group relative inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Choose Spreadsheet</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              disabled={disabled}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onFile(file)
                event.target.value = ''
              }}
            />
          </label>

          <button
            type="button"
            onClick={onDemo}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <svg
              className="h-4 w-4 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
            <span>Load Demo Data</span>
          </button>

          <button
            type="button"
            onClick={onSampleDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span>Download Sample CSV</span>
          </button>
        </div>

        {/* Multi-sheet switcher if workbook has multiple sheets */}
        {sheetNames && sheetNames.length > 1 && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-2 text-xs">
            <span className="text-slate-400">Sheet:</span>
            <select
              value={activeSheet}
              onChange={(e) => onSelectSheet?.(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-slate-200 outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {sheetNames.map((sheet) => (
                <option key={sheet} value={sheet}>
                  {sheet}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </section>
  )
}

