import * as XLSX from 'xlsx'
import { sanitizePhone } from './sanitize'

export async function parseSpreadsheet(file, targetSheetName = null) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    raw: false, // Ensures formatted cell text is parsed (e.g. phone numbers with leading zeros)
  })

  const sheetNames = workbook.SheetNames || []
  if (!sheetNames.length) {
    throw new Error('The spreadsheet contains no sheets.')
  }

  // Auto-detect the best sheet if user didn't specify one
  let selectedSheetName = targetSheetName
  if (!selectedSheetName || !sheetNames.includes(selectedSheetName)) {
    // If multiple sheets, pick the first sheet that actually has non-empty rows
    selectedSheetName = sheetNames[0]
    for (const name of sheetNames) {
      const s = workbook.Sheets[name]
      if (s && s['!ref']) {
        selectedSheetName = name
        break
      }
    }
  }

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

  // Smart Header Row Detection:
  // Instead of blindly picking row 0, score the first 15 rows to find the true header row
  // (Handles files where rows 1-3 have titles, export disclaimers, or metadata)
  let bestHeaderRowIndex = 0
  let maxScore = -1
  const headerKeywords = /phone|tel|mobile|cell|name|email|company|account|lead|title|address|contact|nombre|telefono|correo/i

  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r]
    if (!Array.isArray(row)) continue
    const filledCells = row.filter((c) => c != null && String(c).trim() !== '')
    if (filledCells.length < 2) continue // A single cell (like a title/banner) is not a header row

    let score = filledCells.length * 2
    for (const cell of filledCells) {
      if (headerKeywords.test(String(cell))) {
        score += 12
      }
    }

    if (score > maxScore) {
      maxScore = score
      bestHeaderRowIndex = r
    }
  }

  const rawHeaders = matrix[bestHeaderRowIndex] || []
  const headers = rawHeaders.map((cell, index) => {
    const label = String(cell ?? '').trim()
    return label || `Column ${index + 1}`
  })

  const rows = matrix
    .slice(bestHeaderRowIndex + 1)
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
    let name = cell(row, map.name) || combined || `Contact ${index + 1}`

    // Automatically normalize "Last, First" into "First Last" if comma present
    if (name.includes(',') && !map.firstName && !map.lastName) {
      const parts = name.split(',').map((p) => p.trim())
      if (parts.length === 2 && parts[0] && parts[1]) {
        name = `${parts[1]} ${parts[0]}`
      }
    }

    // Smart phone cascading: primary phone -> secondary/mobile fallback
    const primaryPhone = cell(row, map.phone)
    const secondaryPhone = cell(row, map.secondaryPhone)
    const activePhone = primaryPhone || secondaryPhone

    return {
      id: `contact-${index}-${Date.now().toString(36)}`,
      index: index + 1,
      name,
      phone: activePhone,
      primaryPhone,
      secondaryPhone,
      sanitized: sanitizePhone(activePhone),
      company: cell(row, map.company),
      email: cell(row, map.email),
      title: cell(row, map.title),
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

