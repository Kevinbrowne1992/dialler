const KEEP_CHARS = /[^0-9+]/g

export function sanitizePhone(value) {
  if (value == null) return ''
  let raw = String(value).trim()
  if (!raw) return ''

  const hasLeadingPlus = raw.startsWith('+')
  raw = raw.replace(KEEP_CHARS, '')

  if (hasLeadingPlus) {
    raw = `+${raw.replace(/\+/g, '')}`
  } else {
    raw = raw.replace(/\+/g, '')
  }

  return raw
}

export function isDialable(value) {
  const digits = sanitizePhone(value).replace(/\D/g, '')
  return digits.length >= 3
}
