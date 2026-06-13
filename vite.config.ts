import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://<user>.github.io/aaism-study-app/
const base = process.env.GITHUB_PAGES === 'true' ? '/aaism-study-app/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
