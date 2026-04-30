import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      'react-hot-toast': path.resolve(__dirname, './src/app/lib/reactHotToastShim.tsx'),
    },
  },


  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: false,
        secure: false,
      },
      '/health': {
        target: apiProxyTarget,
        changeOrigin: false,
        secure: false,
      },
      '/signin-google': {
        target: apiProxyTarget,
        changeOrigin: false,
        secure: false,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
