/**
 * Client Entry Point
 * Chức năng: Điểm khởi đầu của ứng dụng React, gắn kết App vào DOM và thiết lập chế độ StrictMode.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
