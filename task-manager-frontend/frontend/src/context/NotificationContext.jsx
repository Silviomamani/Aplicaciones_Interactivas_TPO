import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title || 'Notificación',
      message: notification.message || '',
      duration: notification.duration || 5000,
      ...notification
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remover después de la duración
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const success = useCallback((title, message) => {
    return addNotification({ type: 'success', title, message })
  }, [addNotification])

  const error = useCallback((title, message) => {
    return addNotification({ type: 'error', title, message, duration: 7000 })
  }, [addNotification])

  const info = useCallback((title, message) => {
    return addNotification({ type: 'info', title, message })
  }, [addNotification])

  const warning = useCallback((title, message) => {
    return addNotification({ type: 'warning', title, message })
  }, [addNotification])

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    info,
    warning
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}


