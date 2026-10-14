# Zoiper Outbound Dialler

A clean, lightweight web utility engineered for high-velocity outbound calling. It parses Excel (`.xlsx`, `.xls`) and `.csv` files entirely client-side, displays contacts in an interactive, searchable/sortable table, and triggers automated dialing in Zoiper via OS protocol handlers (`sip:` or `tel:`) when double-clicking any row or clicking the dedicated call button.

> 📖 **Looking for the beginner's guide?** Check out the [Simple User Guide (USER_GUIDE.md)](file:///Volumes/Untitled/Users/kevinbrowne1992/Documents/dialler/USER_GUIDE.md) for plain-English instructions.

---

## 📦 Two Packaging Options for Windows

### 1. Single Standalone HTML File (Zero-Install, Works Offline)
- **File location**: [`releases/ZoiperDialler.html`](file:///Volumes/Untitled/Users/kevinbrowne1992/Documents/dialler/releases/ZoiperDialler.html)
- **Usage**: Send this single file to any Windows user. They double-click it, and it immediately runs in Microsoft Edge or Google Chrome.
- **Rebuild command**:
  ```bash
  npm run build:singlefile
  ```

### 2. Native Windows Desktop App (`.exe` via Electron)
- **Output location**: `dist-electron/`
  - `Zoiper Outbound Dialler 1.0.0.exe` (Portable executable — runs without installation)
  - `Zoiper Outbound Dialler Setup 1.0.0.exe` (NSIS desktop installer)
- **Features**: Dedicated desktop window, intercepts protocol dispatch directly to the Windows OS shell with zero browser confirmation prompts.
- **Build command**:
  ```bash
  npm run electron:build:win
  ```

---

## 🛠️ Windows Protocol Setup Script (Set Zoiper as Default for TEL & SIP)

To ensure Windows and browsers automatically dispatch `tel:` and `sip:` calls directly into Zoiper without asking "How do you want to open this link?", we provide a 1-click Windows setup script.

- **Files**:
  - `releases/Set-ZoiperDefaults.bat` (1-click double-clickable launcher, bypasses execution policy)
  - `releases/Set-ZoiperDefaults.ps1` (Full PowerShell script with auto-detection & shell notification)
- **How to use**:
  1. Download or copy [`releases/Set-ZoiperDefaults.bat`](file:///c:/Users/KevTheDev/Repo%27s/dialler/releases/Set-ZoiperDefaults.bat).
  2. Double-click it.
  3. The script automatically detects `Zoiper5.exe` across Program Files / AppData / Registry, registers `tel`, `sip`, `callto`, and `zoiper` protocol handlers in Windows, and updates Default Apps capabilities.
  4. (Also downloadable directly from the Dialler app under **Settings ⚙️ -> Windows Setup Script**).

---

## Features

- **100% Client-Side Processing**: Parses spreadsheets locally using SheetJS (`xlsx`). Zero contact data leaves the user's machine.
- **Smart Column Detection & Fallback Mapping**: Automatically identifies contact columns (`Phone`, `Mobile`, `Contact Number`, `Telephone`, `Name`, `Company`, `Email`, etc.) with fallback column-mapping and live data previews.
- **Multi-Sheet Excel Support**: Seamlessly switch between sheets in multi-tab workbooks.
- **Zoiper Protocol Handler Integration**:
  - `sip:` (default for Zoiper softphone automation, e.g. `sip:+14155550142`)
  - `tel:` (standard OS RFC 3966 telephony handler)
  - Custom URI template / prefix (e.g. `zoiper:${number}` or `callto:${number}`)
- **Sanitization Engine**: Retains leading `+` for international E.164 formats, stripping spaces, dashes, brackets, and non-numeric characters.
- **Outbound Velocity Workflow**:
  - **Double-Click Dialing**: Double-click any row to immediately dispatch a call to Zoiper.
  - **Quick Call Button**: Dedicated green phone action button per contact.
  - **Next Contact Dialing**: One-click / Hotkey (`D` key) to queue and call the next uncalled contact.
  - **Call Disposition Tagging**: Assign call outcomes (`Connected`, `Left Voicemail`, `No Answer`, `Busy`, `Follow-up Needed`, `Wrong Number`).
  - **Export Session Report**: Download a CSV report with timestamps and call disposition statuses.
  - **Visual & Audio Feedback**: Glowing row flash when dialed, floating toast notifications, and optional synthesized DTMF audio feedback.

---

## Developer Commands

```bash
# Start local web development server
npm run dev

# Start Electron desktop app in development
npm run electron:dev

# Build single standalone HTML file
npm run build:singlefile

# Build Windows .exe installer and portable executable
npm run electron:build:win

# Run code linter
npm run lint
```


