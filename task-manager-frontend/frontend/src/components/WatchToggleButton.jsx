import { useState, useEffect } from 'react'
import Button from './Button.jsx'
import api from '../api/client.js'
import { useNotifications } from '../context/NotificationContext.jsx'

export default function WatchToggleButton({ taskId, isWatching: initialIsWatching, onToggle }) {
  const { success, error } = useNotifications()
  const [isWatching, setIsWatching] = useState(initialIsWatching)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsWatching(initialIsWatching)
  }, [initialIsWatching])

  const handleToggle = async () => {
    setLoading(true)

    try {
      if (isWatching) {
        await api.delete(`/tareas/${taskId}/watchers`)
        setIsWatching(false)
        if (onToggle) onToggle(false)
        success('Desuscripción exitosa', 'Te has desuscrito de esta tarea')
      } else {
        await api.post(`/tareas/${taskId}/watchers`)
        setIsWatching(true)
        if (onToggle) onToggle(true)
        success('Suscripción exitosa', 'Te has suscrito a esta tarea')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al cambiar suscripción'
      error('Error', errorMessage)
      console.error('Error toggling watch:', err)
    } finally {
      setLoading(false)
    }
  }

  // No mostrar el botón si el usuario ya está suscrito
  if (isWatching) {
    return null
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      variant="primary"
      style={{ minWidth: '120px' }}
    >
      {loading ? '...' : 'Suscribirse'}
    </Button>
  )
}

