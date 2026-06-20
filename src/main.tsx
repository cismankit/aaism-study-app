import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { initMemory } from './services/memoryService'
import { initAIConfigSync } from './services/aiService'
import { initAutoConfigOnBoot } from './services/autoConfigService'
import { initKillSwitchFromStorage } from './services/killSwitchService'
import { ensureFirstVisitRecorded } from './services/productTierService'
import { APP_WINDOW_TITLE } from './constants/appMeta'
import './index.css'

document.title = APP_WINDOW_TITLE

registerSW({ immediate: true })
initMemory()
initAIConfigSync()
ensureFirstVisitRecorded()
initAutoConfigOnBoot()
initKillSwitchFromStorage()

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
