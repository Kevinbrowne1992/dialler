import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const port = Number(process.env.PORT) || 5173
const hosted = Boolean(process.env.PORT)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: hosted ? '0.0.0.0' : '127.0.0.1',
    port,
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
  },
})
