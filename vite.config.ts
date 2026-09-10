import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? ''
  const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY ?? ''
  const projectsDataMode = process.env.VITE_PROJECTS_DATA_MODE ?? process.env.PROJECTS_DATA_MODE ?? env.VITE_PROJECTS_DATA_MODE ?? env.PROJECTS_DATA_MODE ?? ''

  return {
  define: {
    // Vercel projects that prohibit public-prefixed variables can provide the
    // same client-safe values as SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY.
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
    'import.meta.env.VITE_PROJECTS_DATA_MODE': JSON.stringify(projectsDataMode),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(projectDirectory, './src'),
    },
  },

  // Dev server
  server: {
    host: true,      // เทียบเท่า 0.0.0.0 (ให้เข้าถึงจากอุปกรณ์ใน LAN ได้)
    port: 5173,
    strictPort: true,
    compress: true,
    // ถ้าอุปกรณ์ใน LAN ต่อ HMR ไม่ได้ ลองเปิดบรรทัดด้านล่างและใส่ IP เครื่องนี้ลงไป
    // hmr: { host: '192.168.1.6', protocol: 'ws', port: 5173 }
  },

  // vite preview หลัง build (ถ้าต้องการเทส production build)
  preview: {
    host: true,
    port: 4173,
    strictPort: true
  },

  // Build
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          animations: ['lenis']
        }
      }
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
  }
})
