function normalizeHeader(header) {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Strip special characters (#, ., -, _, /, (, ))
    .replace(/\s+/g, ' ')
    .trim()
}

// Phone keyword synonyms (English, CRM exports, Spanish, French, German, Italian)
const PHONE_KEYWORDS = [
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
  'work phone',
  'primary phone',
  'main phone',
  'business phone',
  'direct dial',
  'direct number',
  'ddi',
  'did',
  'msisdn',
  'phone 1',
  'phone1',
  'contact phone',
  // Multilingual:
  'telefono',
  'movil',
  'celular',
  'numero',
  'telephone',
  'portable',
  'telefon',
  'handy',
  'rufnummer',
  'recapito',
]

const SECONDARY_PHONE_KEYWORDS = [
  'secondary phone',
  'alternate phone',
  'alt phone',
  'mobile 2',
  'phone 2',
  'phone2',
  'other phone',
  'home phone',
  'personal phone',
  'cell 2',
]

const NAME_KEYWORDS = [
  'name',
  'contact',
  'contact name',
  'full name',
  'fullname',
  'customer',
  'customer name',
  'lead',
  'lead name',
  'person',
  'client',
  'client name',
  'prospect',
  // Multilingual:
  'nombre',
  'nom',
  'kontakt',
  'nome',
]

const FIRST_NAME_KEYWORDS = [
  'first name',
  'firstname',
  'first',
  'given name',
  'forename',
  'fname',
  // Multilingual:
  'primer nombre',
  'prenom',
  'vorname',
]

const LAST_NAME_KEYWORDS = [
  'last name',
  'lastname',
  'last',
  'surname',
  'family name',
  'lname',
  // Multilingual:
  'apellido',
  'apellidos',
  'nom de famille',
  'nachname',
  'cognome',
]

const COMPANY_KEYWORDS = [
  'company',
  'company name',
  'organization',
  'organisation',
  'account',
  'account name',
  'business',
  'business name',
  'employer',
  'client company',
  'agency',
  'firm',
  // Multilingual:
  'empresa',
  'compania',
  'societe',
  'entreprise',
  'firma',
  'unternehmen',
  'azienda',
]

const EMAIL_KEYWORDS = [
  'email',
  'e mail',
  'email address',
  'e mail address',
  'mail',
  'contact email',
  'work email',
  // Multilingual:
  'correo',
  'correo electronico',
  'courriel',
]

const TITLE_KEYWORDS = [
  'title',
  'job title',
  'position',
  'role',
  'occupation',
  'cargo',
  'poste',
  'beruf',
]

/**
 * Finds the best matching header from a list of candidates.
 * Uses a tiered matching strategy:
 * 1. Exact match (score: 100)
 * 2. Prefix match (score: 75)
 * 3. Substring / keyword contains (score: 50)
 */
function findBestHeader(headers, candidates, alreadyUsed = []) {
  let bestHeader = ''
  let highestScore = 0

  const availableHeaders = headers.filter((h) => !alreadyUsed.includes(h))

  for (const rawHeader of availableHeaders) {
    const normalized = normalizeHeader(rawHeader)
    if (!normalized) continue

    for (const candidate of candidates) {
      const candNorm = normalizeHeader(candidate)

      // Tier 1: Exact match
      if (normalized === candNorm) {
        return rawHeader
      }

      // Tier 2: Starts with (e.g. "phone number (work)" starts with "phone")
      if (normalized.startsWith(candNorm) && candNorm.length > 3) {
        if (75 > highestScore) {
          highestScore = 75
          bestHeader = rawHeader
        }
      }

      // Tier 3: Contains candidate as a whole word
      const wordRegex = new RegExp(`\\b${candNorm}\\b`, 'i')
      if (wordRegex.test(normalized) && candNorm.length > 2) {
        if (50 > highestScore) {
          highestScore = 50
          bestHeader = rawHeader
        }
      }
    }
  }

  return bestHeader
}

export function detectColumnMap(headers) {
  const phone = findBestHeader(headers, PHONE_KEYWORDS)
  const secondaryPhone = findBestHeader(headers, SECONDARY_PHONE_KEYWORDS, [phone])
  const name = findBestHeader(headers, NAME_KEYWORDS)
  const firstName = findBestHeader(headers, FIRST_NAME_KEYWORDS, [name])
  const lastName = findBestHeader(headers, LAST_NAME_KEYWORDS, [name, firstName])
  const company = findBestHeader(headers, COMPANY_KEYWORDS)
  const email = findBestHeader(headers, EMAIL_KEYWORDS)
  const title = findBestHeader(headers, TITLE_KEYWORDS)

  return {
    phone,
    secondaryPhone,
    name,
    firstName,
    lastName,
    company,
    email,
    title,
  }
}

export function needsManualMapping(map) {
  return !map.phone && !map.secondaryPhone
}

export function fieldLabel(key) {
  const labels = {
    phone: 'Primary Phone',
    secondaryPhone: 'Secondary / Mobile',
    name: 'Full Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    company: 'Company / Organization',
    email: 'Email Address',
    title: 'Job Title / Role',
  }
  return labels[key] || key
}

export const MAP_FIELDS = [
  'phone',
  'secondaryPhone',
  'name',
  'firstName',
  'lastName',
  'company',
  'email',
  'title',
]

