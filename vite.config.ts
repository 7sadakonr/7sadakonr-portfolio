import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ react()],

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
})
