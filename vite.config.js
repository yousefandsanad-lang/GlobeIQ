import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own chunks so returning
        // visitors get cache hits across app deploys, and no single chunk is huge.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          'geo-vendor': ['d3-geo', 'topojson-client'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
