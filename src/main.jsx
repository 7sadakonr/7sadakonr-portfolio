import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { addResourceHints } from './utils/preloader.js'
import { preloadCriticalResources } from './utils/performance.js'

// Add resource hints for better performance
addResourceHints()

// Preload critical resources
preloadCriticalResources()

// Use concurrent features for better performance
const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
