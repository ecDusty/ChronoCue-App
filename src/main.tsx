import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@radix-ui/react-tooltip'

import { App } from './App'
import { I18nProvider } from './i18n/I18nProvider'
import './styles/main.scss'

if (!window.location.hash) window.location.hash = '#/'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          <Router hook={useHashLocation}>
            <App />
          </Router>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
