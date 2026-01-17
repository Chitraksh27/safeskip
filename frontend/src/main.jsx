import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext' 
import { Analytics } from "@vercel/analytics/react"

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <Analytics />
    <AuthProvider>  {/* <--- Wrap App with Provider */}
      <App />
    </AuthProvider>
  </>
)