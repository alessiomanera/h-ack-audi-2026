import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// One Worker serves the SPA (static assets) and the JSON API under /api.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // brand/ (tokens, fonts) lives one level above the app package.
    fs: { allow: [path.resolve(import.meta.dirname, '..')] },
  },
})
