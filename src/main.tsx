import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { initMemory } from './services/memoryService'
import { initAIConfigSync } from './services/aiService'
import { ensureFirstVisitRecorded } from './services/productTierService'
import './index.css'

registerSW({ immediate: true })
initMemory()
initAIConfigSync()
ensureFirstVisitRecorded()

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
