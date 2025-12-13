import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import AppToaster from './components/ui/Toaster'
import { useThemeSync } from './hooks/useThemeSync'
import './styles/globals.css'

function Root() {
  useThemeSync()

  return (
    <>
      <App />
      <AppToaster />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
)
