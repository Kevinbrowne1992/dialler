import { useState } from 'react'
import { isDialable } from '../lib/sanitize'

function SortIcon({ active, direction }) {
  if (!active) {
    return (
      <span className="ml-1.5 inline-block text-slate-600 transition group-hover:text-slate-400">
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 8l5-5 5 5H5zm10 4l-5 5-5-5h10z" />
        </svg>
      </span>
    )
  }
  return (
    <span className="ml-1.5 inline-block text-emerald-400">
      {direction === 'asc' ? (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 12l5-5 5 5H5z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 8l5 5 5-5H5z" />
        </svg>
      )}
    </span>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.25 1.01l-2.2 2.22Z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const DISPOSITION_OPTIONS = [
  'Connected',
  'Left Voicemail',
  'No Answer',
  'Busy',
  'Follow-up Needed',
  'Wrong Number',
]

const COLUMNS = [
  { key: 'name', label: 'Contact Name' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'email', label: 'Email' },
]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ContactTable({
  contacts,
  sort,
  onSort,
  onDial,
  activeId,
  history,
  dispositions = {},
  onSetDisposition,
  onClearFilter,
}) {
  const [copiedId, setCopiedId] = useState(null)

  function copyNumber(e, contact) {
    e.stopPropagation()
    const textToCopy = contact.sanitized || contact.phone
    navigator.clipboard.writeText(textToCopy)
    setCopiedId(contact.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  if (!contacts.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-16 text-center">
        <div className="mb-3 rounded-full bg-slate-800 p-3 text-slate-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <p className="text-base font-medium text-slate-200">No contacts match your filter</p>
        <p className="mt-1 text-xs text-slate-400">Try adjusting your search query or reset filters.</p>
        {onClearFilter && (
          <button
            type="button"
            onClick={onClearFilter}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
          >
            Clear Search
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="w-12 px-4 py-3.5 text-center">#</th>
              {COLUMNS.map((column) => (
                <th key={column.key} className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    className="group inline-flex items-center text-slate-300 hover:text-white"
                  >
                    <span>{column.label}</span>
                    <SortIcon active={sort.key === column.key} direction={sort.direction} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3.5">Status & Disposition</th>
              <th className="w-24 px-4 py-3.5 text-center">Quick Call</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contacts.map((contact, idx) => {
              const canDial = isDialable(contact.phone)
              const flashed = activeId === contact.id
              const dialedTime = history[contact.id]
              const currentDisposition = dispositions[contact.id] || ''

              return (
                <tr
                  key={contact.id}
                  onDoubleClick={() => canDial && onDial(contact)}
                  className={`group transition-colors ${
                    flashed
                      ? 'row-flash bg-emerald-500/25 ring-1 ring-emerald-400/50'
                      : dialedTime
                        ? 'bg-slate-950/30 hover:bg-slate-800/40'
                        : 'hover:bg-slate-800/50'
                  }`}
                  title={canDial ? 'Double-click to dial via Zoiper' : 'Invalid or missing phone number'}
                >
                  {/* Row index */}
                  <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">
                    {idx + 1}
                  </td>

                  {/* Name with initials avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 font-mono text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                        {getInitials(contact.name)}
                      </div>
                      <div>
                        <span className="font-medium text-white">{contact.name || 'Unnamed'}</span>
                        <span className="block text-[11px] text-slate-500 sm:hidden">
                          {contact.company || '—'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3 text-slate-300">
                    {contact.company ? (
                      <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                        {contact.company}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Phone with copy button & sanitized preview */}
                  <td className="px-4 py-3">
                    {contact.phone ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-mono text-sm text-slate-200">
                            {contact.phone}
                          </span>
                          {contact.sanitized && contact.sanitized !== contact.phone && (
                            <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                              → {contact.sanitized}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => copyNumber(e, contact)}
                          className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
                          title="Copy sanitized phone number"
                        >
                          {copiedId === contact.id ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-rose-400">Missing number</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate hover:text-emerald-400 hover:underline"
                      >
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Status & Disposition */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                      {dialedTime ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Dialed {dialedTime}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          Ready
                        </span>
                      )}

                      {/* Call outcome disposition dropdown if dialed */}
                      {dialedTime && (
                        <select
                          value={currentDisposition}
                          onChange={(e) => {
                            e.stopPropagation()
                            onSetDisposition?.(contact.id, e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-white/10 bg-slate-950 px-2 py-0.5 text-xs text-slate-300 outline-none hover:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400"
                        >
                          <option value="">+ Add outcome</option>
                          {DISPOSITION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>

                  {/* Call Action Button */}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={!canDial}
                      onClick={(event) => {
                        event.stopPropagation()
                        onDial(contact)
                      }}
                      className="group/btn relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none"
                      title={canDial ? `Call ${contact.name || contact.phone} via Zoiper` : 'No valid number'}
                      aria-label={`Call ${contact.name || contact.phone}`}
                    >
                      <PhoneIcon />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

