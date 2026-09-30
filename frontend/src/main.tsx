import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { SplashScreen } from '@capacitor/splash-screen'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)

// From here React owns the screen (the boot screen in index.html stops reacting to errors); logs show in Logcat
;(window as any).__rcMounted = true
console.info('[RideClub startup] app mounted')
SplashScreen.hide().catch(() => { /* web, or already hidden by index.html */ })
