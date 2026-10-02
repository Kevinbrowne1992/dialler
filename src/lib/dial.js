import { sanitizePhone } from './sanitize'

const SETTINGS_KEY = 'dialler.settings.v1'

export const PROTOCOL_OPTIONS = [
  {
    id: 'sip',
    label: 'sip: (Zoiper default)',
    template: 'sip:${number}',
    description: 'Direct SIP protocol handler registered by Zoiper and VoIP softphones.',
  },
  {
    id: 'tel',
    label: 'tel: (System telephony)',
    template: 'tel:${number}',
    description: 'Standard RFC 3966 OS telephony handler (Zoiper, FaceTime, Skype, Phone).',
  },
  {
    id: 'custom',
    label: 'Custom template / prefix',
    template: 'zoiper:${number}',
    description: 'Custom URI scheme or template (e.g. zoiper:${number} or callto:${number}).',
  },
]

export const DEFAULT_SETTINGS = {
  protocol: 'sip',
  customTemplate: 'zoiper:${number}',
  soundFeedback: true,
  autoAdvance: true,
}

export function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(stored)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Failed to save dialer settings:', err)
  }
}

export function getDialTemplate(settings) {
  if (settings.protocol === 'custom') {
    return settings.customTemplate?.trim() || 'zoiper:${number}'
  }
  const match = PROTOCOL_OPTIONS.find((option) => option.id === settings.protocol)
  return match?.template || 'sip:${number}'
}

export function buildDialUri(number, settings) {
  const sanitized = sanitizePhone(number)
  const template = getDialTemplate(settings)
  if (template.includes('${number}')) {
    return template.replaceAll('${number}', sanitized)
  }
  return `${template}${sanitized}`
}

/**
 * Triggers the protocol handler using a hidden anchor click.
 * This is the cleanest, non-disruptive method for browser protocol dispatch.
 */
export function triggerDial(uri) {
  try {
    const link = document.createElement('a')
    link.href = uri
    link.setAttribute('rel', 'noopener noreferrer')
    link.style.position = 'fixed'
    link.style.top = '-9999px'
    link.style.left = '-9999px'
    link.style.opacity = '0'
    link.style.pointerEvents = 'none'
    document.body.appendChild(link)
    link.click()
    window.setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
    }, 150)
  } catch {
    window.location.href = uri
  }
}

/**
 * Synthesizes a subtle, pleasant dual-tone DTMF click using Web Audio API.
 * Pure client-side, zero audio assets required.
 */
export function playDialTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.frequency.setValueAtTime(697, now) // Standard DTMF low frequency
    osc2.frequency.setValueAtTime(1209, now) // Standard DTMF high frequency

    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.09)
    osc2.stop(now + 0.09)

    setTimeout(() => {
      ctx.close()
    }, 150)
  } catch {
    // AudioContext may be restricted by browser autoplay policy
  }
}

export function formatDialTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

