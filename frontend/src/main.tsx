import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { SplashScreen } from '@capacitor/splash-screen'
import { Capacitor } from '@capacitor/core'
import { registerSW } from 'virtual:pwa-register'
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

// The APK always loads the live site, so an offline cache would only hold it on an old version; the website keeps it
if (Capacitor.isNativePlatform()) {
  navigator.serviceWorker?.getRegistrations().then(async (regs) => {
    if (!regs.length) return
    await Promise.all(regs.map((r) => r.unregister()))
    if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
    console.info('[RideClub startup] removed cached app version, reloading')
    location.reload()
  }).catch(() => { /* no service worker support */ })
} else {
  registerSW({ immediate: true })
}
