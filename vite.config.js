import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' keeps the build relocatable (GitHub Pages subpath, file://, any static host)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
