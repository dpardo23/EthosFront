import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Permite el host específico del error y los dominios generales de desarrollo de Vercel/v0
    allowedHosts: [
      'sb-9yjww1tzc4u3.vercel.run',
      '.vercel.run',
      '.vercel.app'
    ],
  },
})
