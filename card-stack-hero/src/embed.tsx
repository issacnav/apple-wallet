import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CardStackStage } from './components/CardStackStage'
import './index.css'

const el = document.getElementById('card-stack-root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <CardStackStage />
    </StrictMode>,
  )
}
