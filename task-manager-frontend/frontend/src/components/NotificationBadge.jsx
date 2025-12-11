import { useEffect, useState, useCallback } from 'react'
import api from '../api/client.js'

export default function NotificationBadge({ pollingInterval = 30000, onCountChange }) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = useCallback(async () => {
    try {
      const response = await api.get('/notificaciones/conteo')
      const newCount = response.data.data?.conteo || 0
      setCount(newCount)
      if (onCountChange) {
        onCountChange(newCount)
      }
    } catch (err) {
      console.error('Error fetching notification count:', err)
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, pollingInterval)

    // Escuchar evento manual para refrescar inmediatamente (ej. al marcar leído)
    const handler = () => fetchCount()
    window.addEventListener('watcher:refresh-count', handler)

    return () => {
      clearInterval(interval)
      window.removeEventListener('watcher:refresh-count', handler)
    }
  }, [pollingInterval, fetchCount])

  if (loading || count === 0) {
    return null
  }

  return (
    <span
      className="notification-badge"
      style={{
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        backgroundColor: '#EF4444',
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        animation: count > 0 ? 'bounce 0.5s ease-in-out' : 'none'
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

