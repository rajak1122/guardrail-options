import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TradingProvider } from './context/TradingContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <TradingProvider>
        <App />
      </TradingProvider>
    </AuthProvider>
  </StrictMode>,
)
