import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './context/AppContext'
import App from './App'
import './index.css'

// ── STEP 10 — Connection Test ─────────────────────────────────────────────
// Uncomment the two lines below, open your browser console (F12),
// and reload the page. You will see either:
//   ✅ Connection SUCCESSFUL — projects table is reachable
//   ❌ Connection FAILED: <reason>
//
// Once confirmed working, comment these lines out again.
//
// import { testConnection } from './lib/supabase'
// testConnection()
// ─────────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
)
