import { useState, useEffect } from 'react'
import Button from './Button.jsx'
import api from '../api/client.js'

export default function WatchToggleButton({ taskId, isWatching: initialIsWatching, onToggle }) {
  const [isWatching, setIsWatching] = useState(initialIsWatching)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsWatching(initialIsWatching)
  }, [initialIsWatching])

  const handleToggle = async () => {
    setLoading(true)
    setError(null)

    try {
      if (isWatching) {
        await api.delete(`/tareas/${taskId}/watchers`)
        setIsWatching(false)
        if (onToggle) onToggle(false)
      } else {
        await api.post(`/tareas/${taskId}/watchers`)
        setIsWatching(true)
        if (onToggle) onToggle(true)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar suscripción')
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
    <div>
      <Button
        onClick={handleToggle}
        disabled={loading}
        variant="primary"
        style={{ minWidth: '120px' }}
      >
        {loading ? '...' : 'Suscribirse'}
      </Button>
      {error && (
        <div style={{ marginTop: '8px', color: '#EF4444', fontSize: '0.85em' }}>
          {error}
        </div>
      )}
    </div>
  )
}

