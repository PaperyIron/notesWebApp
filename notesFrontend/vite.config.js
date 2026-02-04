import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': 'http://localhost:5555',
      '/signup': 'http://localhost:5555',
      '/check_session': 'http://localhost:5555',
      '/logout': 'http://localhost:5555',
    }
  }
})