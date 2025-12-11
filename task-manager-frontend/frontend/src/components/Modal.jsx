import { useEffect } from 'react'

export default function Modal({ open, title, onClose, children, actions }) {
  // Si no se pasa open, asumimos que está abierto (para compatibilidad)
  const isOpen = open !== false
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && <div className="modal-title">{title}</div>}
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}


