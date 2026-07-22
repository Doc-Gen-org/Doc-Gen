import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Electron loads the built index.html via file://, not from a web
  // server root — absolute asset paths (the Vite default) resolve
  // against the filesystem root under file:// and fail silently,
  // producing a blank white window. Relative paths fix that.
  base: './',
})