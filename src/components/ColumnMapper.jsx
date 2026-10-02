import { fieldLabel, MAP_FIELDS } from '../lib/columns'

export function ColumnMapper({
  headers,
  map,
  onChange,
  onApply,
  onCancel,
  visible,
  sampleRows = [],
}) {
  if (!visible) return null

  // Helper to extract a sample value for a given header
  function getSampleValue(header) {
    if (!header || !sampleRows.length) return null
    for (const r of sampleRows) {
      const val = r[header]
      if (val != null && String(val).trim() !== '') {
        return String(val).trim()
      }
    }
    return null
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 to-slate-900/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-xs font-bold text-amber-300">
              !
            </span>
            <h2 className="text-base font-semibold text-amber-100">Column Mapping</h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-amber-200/70">
            Verify or re-map your spreadsheet headers to standard contact fields. 
            <strong className="text-amber-300"> Phone number is required.</strong>
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MAP_FIELDS.map((field) => {
          const selectedHeader = map[field] || ''
          const sample = getSampleValue(selectedHeader)

          return (
            <label
              key={field}
              className="block rounded-xl border border-white/5 bg-slate-950/60 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">
                  {fieldLabel(field)}
                  {field === 'phone' && (
                    <span className="ml-1 text-rose-400 font-bold">*</span>
                  )}
                </span>
                {selectedHeader && (
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    Mapped
                  </span>
                )}
              </div>

              <select
                value={selectedHeader}
                onChange={(event) =>
                  onChange({ ...map, [field]: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">— Select header —</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>

              {/* Sample preview for selected header */}
              {sample ? (
                <div className="mt-2 truncate font-mono text-[11px] text-slate-400">
                  <span className="text-slate-500">Preview:</span> {sample}
                </div>
              ) : selectedHeader ? (
                <div className="mt-2 text-[11px] italic text-slate-500">
                  (Column appears empty in preview)
                </div>
              ) : null}
            </label>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <span className="text-xs text-slate-400">
          {!map.phone ? (
            <span className="text-rose-400 font-medium">
              ⚠️ Please select a column for Phone Number to proceed.
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">
              ✓ Ready to process contacts
            </span>
          )}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!map.phone}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply Mapping
          </button>
        </div>
      </div>
    </section>
  )
}

