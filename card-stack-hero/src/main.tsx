import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CardStackStage } from './components/CardStackStage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="flex min-h-dvh flex-col items-center justify-center text-white">
      <CardStackStage />
    </div>
  </StrictMode>,
)
