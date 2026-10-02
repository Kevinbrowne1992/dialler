function normalizeHeader(header) {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_./-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

const PHONE_KEYS = [
  'phone',
  'phone number',
  'phonenumber',
  'mobile',
  'mobile number',
  'cell',
  'cellphone',
  'cell phone',
  'contact number',
  'contact no',
  'telephone',
  'telephone number',
  'tel',
  'tel no',
  'number',
  'msisdn',
  'direct dial',
  'ddi',
  'did',
]

const NAME_KEYS = [
  'name',
  'contact',
  'contact name',
  'full name',
  'fullname',
  'customer',
  'customer name',
  'lead name',
]

const FIRST_NAME_KEYS = ['first name', 'firstname', 'first', 'given name']
const LAST_NAME_KEYS = ['last name', 'lastname', 'last', 'surname', 'family name']

const COMPANY_KEYS = [
  'company',
  'company name',
  'organisation',
  'organization',
  'account',
  'account name',
  'business',
  'employer',
]

const EMAIL_KEYS = ['email', 'e mail', 'email address', 'mail']

function findHeader(headers, candidates) {
  const normalized = headers.map((header) => ({ header, key: normalizeHeader(header) }))
  const exact = normalized.find((item) => candidates.includes(item.key))
  return exact?.header || ''
}

export function detectColumnMap(headers) {
  return {
    phone: findHeader(headers, PHONE_KEYS),
    name: findHeader(headers, NAME_KEYS),
    firstName: findHeader(headers, FIRST_NAME_KEYS),
    lastName: findHeader(headers, LAST_NAME_KEYS),
    company: findHeader(headers, COMPANY_KEYS),
    email: findHeader(headers, EMAIL_KEYS),
  }
}

export function needsManualMapping(map) {
  return !map.phone
}

export function fieldLabel(key) {
  const labels = {
    phone: 'Phone',
    name: 'Name',
    firstName: 'First name',
    lastName: 'Last name',
    company: 'Company',
    email: 'Email',
  }
  return labels[key] || key
}

export const MAP_FIELDS = ['phone', 'name', 'firstName', 'lastName', 'company', 'email']
