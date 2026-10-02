import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColumnMapper } from './components/ColumnMapper'
import { ContactTable } from './components/ContactTable'
import { SettingsModal } from './components/SettingsModal'
import { StatsBar } from './components/StatsBar'
import { Toast } from './components/Toast'
import { UploadZone } from './components/UploadZone'
import { detectColumnMap, needsManualMapping } from './lib/columns'
import {
  buildDialUri,
  formatDialTime,
  loadSettings,
  playDialTone,
  saveSettings,
  triggerDial,
} from './lib/dial'
import {
  DEMO_HEADERS,
  DEMO_ROWS,
  SAMPLE_CSV,
  buildContacts,
  generateReportCsv,
  parseSpreadsheet,
} from './lib/parseContacts'
import { isDialable } from './lib/sanitize'

const EMPTY_MAP = {
  phone: '',
  name: '',
  firstName: '',
  lastName: '',
  company: '',
  email: '',
}

function sortContacts(contacts, sort) {
  const copy = [...contacts]
  copy.sort((a, b) => {
    const left = String(a[sort.key] || '').toLowerCase()
    const right = String(b[sort.key] || '').toLowerCase()
    if (left < right) return sort.direction === 'asc' ? -1 : 1
    if (left > right) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
  return copy
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [rawFile, setRawFile] = useState(null)
  const [sheetNames, setSheetNames] = useState([])
  const [activeSheet, setActiveSheet] = useState('')
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [map, setMap] = useState(EMPTY_MAP)
  const [mappingOpen, setMappingOpen] = useState(false)
  const [contacts, setContacts] = useState([])
  const [query, setQuery] = useState('')
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'pending' | 'dialed'
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' })
  const [history, setHistory] = useState({})
  const [dispositions, setDispositions] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  // Filter contacts by search query & status filter tab
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    let matched = contacts

    // Apply status filter
    if (filterMode === 'pending') {
      matched = matched.filter((c) => !history[c.id])
    } else if (filterMode === 'dialed') {
      matched = matched.filter((c) => Boolean(history[c.id]))
    }

    // Apply search query
    if (needle) {
      matched = matched.filter((contact) =>
        [contact.name, contact.company, contact.phone, contact.email, contact.sanitized]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
    }

    return sortContacts(matched, sort)
  }, [contacts, query, filterMode, history, sort])

  // Next dialable contact that hasn't been called yet
  const nextContact = useMemo(() => {
    return contacts.find((c) => !history[c.id] && isDialable(c.phone)) || null
  }, [contacts, history])

  function persistSettings(next) {
    setSettings(next)
    saveSettings(next)
  }

  function applyRows(nextRows, nextHeaders, nextMap, filename) {
    const built = buildContacts(nextRows, nextMap)
    setRows(nextRows)
    setHeaders(nextHeaders)
    setMap(nextMap)
    setContacts(built)
    setSourceName(filename)
    setHistory({})
    setDispositions({})
    setQuery('')
    setFilterMode('all')
    setError(built.length ? '' : 'No contact rows were found in this dataset.')
  }

  async function ingestFile(file, sheetName = null) {
    setBusy(true)
    setError('')
    try {
      const parsed = await parseSpreadsheet(file, sheetName)
      setRawFile(file)
      setSheetNames(parsed.sheetNames || [])
      setActiveSheet(parsed.sheetName || '')
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setSourceName(file.name)

      const detected = detectColumnMap(parsed.headers)
      setMap(detected)

      if (needsManualMapping(detected)) {
        setContacts([])
        setMappingOpen(true)
        setError('Please map the phone number column below to continue.')
      } else {
        setMappingOpen(false)
        applyRows(parsed.rows, parsed.headers, detected, file.name)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to parse that file.'
      setError(
        /html|cfb|zip/i.test(message)
          ? 'That file could not be read as Excel or CSV. Try .xlsx, .xls, or .csv.'
          : message,
      )
    } finally {
      setBusy(false)
    }
  }

  function handleSelectSheet(newSheet) {
    if (rawFile && newSheet) {
      ingestFile(rawFile, newSheet)
    }
  }

  function loadDemo() {
    const detected = detectColumnMap(DEMO_HEADERS)
    setHeaders(DEMO_HEADERS)
    setRows(DEMO_ROWS)
    setRawFile(null)
    setSheetNames([])
    setActiveSheet('')
    applyRows(DEMO_ROWS, DEMO_HEADERS, detected, 'demo-sales-leads.xlsx')
    setMappingOpen(false)
    setError('')
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample-contacts.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function clearTable() {
    setContacts([])
    setRows([])
    setHeaders([])
    setRawFile(null)
    setSheetNames([])
    setActiveSheet('')
    setMap(EMPTY_MAP)
    setSourceName('')
    setHistory({})
    setDispositions({})
    setQuery('')
    setFilterMode('all')
    setError('')
    setMappingOpen(false)
  }

  const dialContact = useCallback(
    (contact) => {
      if (!isDialable(contact.phone)) {
        setError(`No valid phone number for ${contact.name || 'this contact'}.`)
        return
      }

      const uri = buildDialUri(contact.phone, settings)
      const time = formatDialTime()
      const label = contact.name || contact.sanitized || contact.phone

      // Optional audio DTMF feedback
      if (settings.soundFeedback) {
        playDialTone()
      }

      setHistory((prev) => ({ ...prev, [contact.id]: time }))
      setActiveId(contact.id)
      setToast({ id: Date.now(), label, uri })

      window.setTimeout(() => setActiveId(null), 1200)
      window.setTimeout(() => setToast(null), 2800)

      triggerDial(uri)
    },
    [settings],
  )

  const dialNextContact = useCallback(() => {
    if (nextContact) {
      dialContact(nextContact)
    }
  }, [nextContact, dialContact])

  function handleSetDisposition(contactId, disposition) {
    setDispositions((prev) => ({ ...prev, [contactId]: disposition }))
  }

  function exportCallReport() {
    if (!contacts.length) return
    const csvContent = generateReportCsv(contacts, history, dispositions)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zoiper-call-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function onSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )
  }

  // Keyboard shortcut: Press 'D' (when not in search input) to dial next
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key.toLowerCase() === 'd' &&
        !['input', 'textarea', 'select'].includes(e.target.tagName.toLowerCase()) &&
        !settingsOpen &&
        !mappingOpen &&
        nextContact
      ) {
        e.preventDefault()
        dialNextContact()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settingsOpen, mappingOpen, nextContact, dialNextContact])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(180deg,#07111f_0%,#0b1220_100%)] text-slate-100 flex flex-col justify-between">
      <div>
        {/* Navigation & Header */}
        <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              {/* App Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.25 1.01l-2.2 2.22Z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">Zoiper Outbound Dialler</h1>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                    High-Velocity
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Instant client-side spreadsheet dialing automation for Zoiper softphones
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5">
              {/* Protocol Badge / Button */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="group inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 transition hover:border-emerald-400/40 hover:bg-slate-900 hover:text-white"
                title="Click to change protocol handler in settings"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Protocol:</span>
                <span className="font-mono font-medium text-emerald-400">{settings.protocol}:</span>
                <svg className="h-3 w-3 text-slate-500 group-hover:text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 8l4 4 4-4H6z" />
                </svg>
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white active:scale-95"
              >
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
          {/* File Upload Zone */}
          {contacts.length === 0 ? (
            <UploadZone
              dragging={dragging}
              disabled={busy}
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                const file = event.dataTransfer.files?.[0]
                if (file) ingestFile(file)
              }}
              onFile={ingestFile}
              onDemo={loadDemo}
              onSampleDownload={downloadSample}
              sheetNames={sheetNames}
              activeSheet={activeSheet}
              onSelectSheet={handleSelectSheet}
            />
          ) : null}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-xs sm:text-sm text-rose-200">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-xs font-bold text-rose-300">
                  !
                </span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-xs text-rose-300 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Column Mapping Section */}
          <ColumnMapper
            visible={mappingOpen}
            headers={headers}
            map={map}
            onChange={setMap}
            sampleRows={rows.slice(0, 2)}
            onApply={() => {
              if (!map.phone) return
              applyRows(rows, headers, map, sourceName)
              setMappingOpen(false)
            }}
            onCancel={() => setMappingOpen(false)}
          />

          {/* Active Campaign / Contact View */}
          {contacts.length > 0 && (
            <>
              {/* Outbound Stats & Velocity Bar */}
              <StatsBar
                contacts={contacts}
                history={history}
                dispositions={dispositions}
                filterMode={filterMode}
                onFilterChange={setFilterMode}
                onDialNext={dialNextContact}
                onExportReport={exportCallReport}
                nextContact={nextContact}
              />

              {/* Table Toolbar & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-[16rem] flex-1 max-w-md">
                  <svg
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search name, phone, company, email..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-100 outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">
                    Showing <strong className="text-white">{filtered.length}</strong> of{' '}
                    <strong className="text-white">{contacts.length}</strong>
                    {sourceName ? ` · ${sourceName}` : ''}
                  </span>

                  {sheetNames.length > 1 && (
                    <select
                      value={activeSheet}
                      onChange={(e) => handleSelectSheet(e.target.value)}
                      className="rounded-xl border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-400"
                    >
                      {sheetNames.map((s) => (
                        <option key={s} value={s}>
                          Sheet: {s}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => setMappingOpen(!mappingOpen)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition active:scale-95"
                  >
                    {mappingOpen ? 'Hide Column Map' : 'Map Columns'}
                  </button>

                  <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition active:scale-95">
                    Replace File
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) ingestFile(file)
                        event.target.value = ''
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={clearTable}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition active:scale-95"
                  >
                    Clear List
                  </button>
                </div>
              </div>

              {/* Contacts Grid */}
              <ContactTable
                contacts={filtered}
                sort={sort}
                onSort={onSort}
                onDial={dialContact}
                activeId={activeId}
                history={history}
                dispositions={dispositions}
                onSetDisposition={handleSetDisposition}
                onClearFilter={() => {
                  setQuery('')
                  setFilterMode('all')
                }}
              />

              {/* Usage Tips Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/40 px-4 py-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span>⚡ <strong>Tip:</strong> Double-click any row to dial immediately.</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Press <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-slate-300">D</kbd> to dial the next ready contact.</span>
                </div>
                <span>Zoiper auto-launches via <span className="font-mono text-emerald-400">{settings.protocol}:</span> URI handler</span>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onChange={persistSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

