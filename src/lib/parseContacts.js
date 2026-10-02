import * as XLSX from 'xlsx'
import { sanitizePhone } from './sanitize'

export async function parseSpreadsheet(file, targetSheetName = null) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetNames = workbook.SheetNames || []
  if (!sheetNames.length) {
    throw new Error('The spreadsheet contains no sheets.')
  }

  const selectedSheetName =
    targetSheetName && sheetNames.includes(targetSheetName)
      ? targetSheetName
      : sheetNames[0]

  const sheet = workbook.Sheets[selectedSheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  if (!matrix.length) {
    return {
      headers: [],
      rows: [],
      sheetName: selectedSheetName,
      sheetNames,
      workbook,
    }
  }

  // Find the first non-empty row to treat as headers
  let headerRowIndex = 0
  while (
    headerRowIndex < matrix.length &&
    (!matrix[headerRowIndex] ||
      !matrix[headerRowIndex].some((cell) => String(cell ?? '').trim() !== ''))
  ) {
    headerRowIndex++
  }

  const rawHeaders = matrix[headerRowIndex] || []
  const headers = rawHeaders.map((cell, index) => {
    const label = String(cell ?? '').trim()
    return label || `Column ${index + 1}`
  })

  const rows = matrix
    .slice(headerRowIndex + 1)
    .map((row) => {
      const record = {}
      headers.forEach((header, index) => {
        record[header] = row?.[index] == null ? '' : String(row[index]).trim()
      })
      return record
    })
    .filter((row) =>
      Object.values(row).some((value) => String(value).trim() !== ''),
    )

  return {
    headers,
    rows,
    sheetName: selectedSheetName,
    sheetNames,
    workbook,
  }
}

function cell(row, header) {
  if (!header) return ''
  return String(row[header] ?? '').trim()
}

export function buildContacts(rows, map) {
  return rows.map((row, index) => {
    const first = cell(row, map.firstName)
    const last = cell(row, map.lastName)
    const combined = [first, last].filter(Boolean).join(' ')
    const name = cell(row, map.name) || combined || `Contact ${index + 1}`
    const phone = cell(row, map.phone)

    return {
      id: `contact-${index}-${Date.now().toString(36)}`,
      index: index + 1,
      name,
      phone,
      sanitized: sanitizePhone(phone),
      company: cell(row, map.company),
      email: cell(row, map.email),
      source: row,
    }
  })
}

export function generateReportCsv(contacts, history = {}, dispositions = {}) {
  const headers = [
    'Name',
    'Company',
    'Phone',
    'Sanitized Number',
    'Email',
    'Call Status',
    'Dialed Timestamp',
    'Disposition',
  ]

  const csvRows = [headers.join(',')]

  contacts.forEach((contact) => {
    const dialedAt = history[contact.id] || ''
    const disposition = dispositions[contact.id] || ''
    const status = dialedAt ? 'Dialed' : 'Ready'

    const values = [
      contact.name,
      contact.company,
      contact.phone,
      contact.sanitized,
      contact.email,
      status,
      dialedAt,
      disposition,
    ].map((val) => `"${String(val || '').replace(/"/g, '""')}"`)

    csvRows.push(values.join(','))
  })

  return csvRows.join('\r\n')
}

export const SAMPLE_CSV = `Name,Company,Phone,Email
Ava Patel,Northwind Logistics,+1 (415) 555-0142,ava.patel@northwind.example
Marcus Chen,Helios Energy,+44 20 7946 0958,marcus.chen@helios.example
Sofia Alvarez,Brightline Legal,021-555-0199,sofia.alvarez@brightline.example
Jonah Reed,Atlas Marine,353-1-555-0174,jonah.reed@atlas.example
Priya Shah,Cobalt Analytics,+353 (86) 555-2201,priya.shah@cobalt.example
Elena Rossi,Harbor & Co,+39 06 555 0188,elena.rossi@harbor.example
David Kim,Vanguard Tech,+1 212 555 0195,david.kim@vanguard.example
Chloe Dubois,Alpine Ventures,+33 1 42 68 55 00,chloe.dubois@alpine.example
`

export const DEMO_ROWS = [
  {
    Name: 'Ava Patel',
    Company: 'Northwind Logistics',
    Phone: '+1 (415) 555-0142',
    Email: 'ava.patel@northwind.example',
  },
  {
    Name: 'Marcus Chen',
    Company: 'Helios Energy',
    Phone: '+44 20 7946 0958',
    Email: 'marcus.chen@helios.example',
  },
  {
    Name: 'Sofia Alvarez',
    Company: 'Brightline Legal',
    Phone: '021-555-0199',
    Email: 'sofia.alvarez@brightline.example',
  },
  {
    Name: 'Jonah Reed',
    Company: 'Atlas Marine',
    Phone: '+353 1 555 0174',
    Email: 'jonah.reed@atlas.example',
  },
  {
    Name: 'Priya Shah',
    Company: 'Cobalt Analytics',
    Phone: '+353 (86) 555-2201',
    Email: 'priya.shah@cobalt.example',
  },
  {
    Name: 'Elena Rossi',
    Company: 'Harbor & Co',
    Phone: '+39 06 555 0188',
    Email: 'elena.rossi@harbor.example',
  },
  {
    Name: 'David Kim',
    Company: 'Vanguard Tech',
    Phone: '+1 212 555 0195',
    Email: 'david.kim@vanguard.example',
  },
  {
    Name: 'Chloe Dubois',
    Company: 'Alpine Ventures',
    Phone: '+33 1 42 68 55 00',
    Email: 'chloe.dubois@alpine.example',
  },
]

export const DEMO_HEADERS = ['Name', 'Company', 'Phone', 'Email']

