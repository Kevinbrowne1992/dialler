import { useEffect, useState } from 'react'
import { PROTOCOL_OPTIONS, buildDialUri, triggerDial, playDialTone } from '../lib/dial'

export function SettingsModal({ open, settings, onChange, onClose }) {
  const [testNumber, setTestNumber] = useState('+14155550142')
  const [testSuccess, setTestSuccess] = useState(false)

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const previewUri = buildDialUri(testNumber, settings)

  function runTestDial() {
    if (settings.soundFeedback) {
      playDialTone()
    }
    triggerDial(previewUri)
    setTestSuccess(true)
    setTimeout(() => setTestSuccess(false), 2500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 id="settings-title" className="text-base font-semibold text-white">
                Dialer Configuration
              </h2>
              <p className="text-xs text-slate-400">
                Choose the telephony protocol handler configured with Zoiper on this OS.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Protocol Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Preferred Protocol Handler
          </label>
          <div className="grid gap-2">
            {PROTOCOL_OPTIONS.map((option) => {
              const selected = settings.protocol === option.id
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    selected
                      ? 'border-emerald-500/50 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
                      : 'border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-slate-900/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="protocol"
                    checked={selected}
                    onChange={() => onChange({ ...settings, protocol: option.id })}
                    className="mt-1 accent-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{option.label}</span>
                      <span className="font-mono text-[11px] text-emerald-400/80">
                        {option.template}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">{option.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Custom Template Input */}
        {settings.protocol === 'custom' && (
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950 p-3">
            <label className="block text-xs font-medium text-slate-300">Custom URI Template</label>
            <input
              value={settings.customTemplate}
              onChange={(event) =>
                onChange({ ...settings, customTemplate: event.target.value })
              }
              placeholder="zoiper:${number}"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <span className="mt-1 block text-[11px] text-slate-500">
              Use <code className="text-emerald-400 font-mono">${'{number}'}</code> as the placeholder (e.g.{' '}
              <span className="font-mono text-slate-400">zoiper:${'{number}'}</span> or{' '}
              <span className="font-mono text-slate-400">callto:${'{number}'}</span>).
            </span>
          </div>
        )}

        {/* Additional Preferences */}
        <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
          <label className="flex cursor-pointer items-center justify-between py-1 text-xs">
            <span className="text-slate-300">
              Audio Feedback
              <span className="block text-[11px] text-slate-500">
                Play subtle DTMF tone when triggering a call
              </span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(settings.soundFeedback)}
              onChange={(e) => onChange({ ...settings, soundFeedback: e.target.checked })}
              className="h-4 w-4 rounded accent-emerald-500"
            />
          </label>
        </div>

        {/* Live Test Trigger Section */}
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/70 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Test Protocol Dispatch</span>
            <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]">
              {previewUri}
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="Test phone number..."
              className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={runTestDial}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400 active:scale-95"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.25 1.01l-2.2 2.22Z" />
              </svg>
              <span>{testSuccess ? 'Triggered!' : 'Test Call'}</span>
            </button>
          </div>
          {testSuccess && (
            <p className="mt-1.5 text-[11px] text-emerald-400">
              ✓ Dispatched URI <span className="font-mono font-medium">{previewUri}</span> to OS. Zoiper should activate.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

