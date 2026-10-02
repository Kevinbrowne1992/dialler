const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Zoiper Outbound Dialler',
    backgroundColor: '#07111f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  // Helper to intercept and dispatch telephony protocols directly to the OS / Zoiper
  function interceptTelephony(url) {
    const lower = url.toLowerCase()
    if (
      lower.startsWith('sip:') ||
      lower.startsWith('tel:') ||
      lower.startsWith('zoiper:') ||
      lower.startsWith('callto:') ||
      lower.startsWith('mailto:')
    ) {
      shell.openExternal(url).catch((err) => {
        console.error('Failed to dispatch external protocol:', err)
      })
      return true
    }
    return false
  }

  // Intercept window.open calls
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (interceptTelephony(url)) {
      return { action: 'deny' }
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  // Intercept in-page navigation (e.g. window.location.href or hidden <a> tag clicks)
  win.webContents.on('will-navigate', (event, url) => {
    if (interceptTelephony(url)) {
      event.preventDefault()
    }
  })

  // Intercept frame navigation
  win.webContents.on('will-frame-navigate', (event) => {
    if (event.url && interceptTelephony(event.url)) {
      event.preventDefault()
    }
  })

  // Load the web application
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Application menu
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
        { type: 'separator' },
        { role: 'quit', accelerator: 'CmdOrCtrl+Q' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => win.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Zoiper Setup Guide',
          click: () =>
            shell.openExternal(
              'https://www.zoiper.com/en/support/answer/for/windows/55/how_to_use_zoiper_with_web_browser_click_to_dial',
            ),
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
