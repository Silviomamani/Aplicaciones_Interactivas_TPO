import { useEffect, useState, useRef } from 'react'
import api from '../api/client.js'
import WatcherAvatarGroup from './WatcherAvatarGroup.jsx'

export default function WatcherList({ taskId, onWatchersLoaded }) {
  const [watchers, setWatchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loadingRef = useRef(false)
  const lastLoadedTaskIdRef = useRef(null)

  useEffect(() => {
    if (taskId && taskId.trim()) {
      const cleanTaskId = taskId.trim()
      // Solo cargar si el taskId cambió y no está cargando
      if (cleanTaskId !== lastLoadedTaskIdRef.current && !loadingRef.current) {
        loadWatchers()
      }
    } else {
      setWatchers([])
      setLoading(false)
      loadingRef.current = false
      lastLoadedTaskIdRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const loadWatchers = async () => {
    if (!taskId || loadingRef.current) {
      return
    }
    
    // Limpiar el ID de espacios y caracteres extra
    const cleanTaskId = taskId.trim()
    
    // Verificar si ya se cargó este taskId
    if (cleanTaskId === lastLoadedTaskIdRef.current) {
      return
    }
    
    // Marcar como cargando para evitar llamadas duplicadas
    loadingRef.current = true
    lastLoadedTaskIdRef.current = cleanTaskId
    
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/tareas/${cleanTaskId}/watchers`)
      const watchers = response.data?.data?.watchers || response.data?.watchers || []
      setWatchers(watchers)
      
      // Notificar al padre cuando se cargan los watchers
      if (onWatchersLoaded) {
        onWatchersLoaded(watchers)
      }
    } catch (err) {
      // Si es 404, la tarea podría no existir aún o no tener watchers
      if (err.response?.status === 404) {
        setWatchers([])
        setError(null)
      } else if (err.response?.status === 400) {
        // Error de validación - mostrar los errores específicos
        const errores = err.response?.data?.errores || []
        console.error('WatcherList: Error de validación (400):', {
          errores,
          message: err.response?.data?.message,
          tareaId: cleanTaskId
        })
        setError('Error de validación: ' + (errores[0]?.msg || 'ID de tarea inválido'))
      } else {
        setError('Error al cargar suscriptores')
        console.error('WatcherList: Error loading watchers:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
          url: err.config?.url
        })
      }
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '12px', color: '#666' }}>
        Cargando suscriptores...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '12px', color: '#EF4444' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ padding: '12px' }}>
      <WatcherAvatarGroup watchers={watchers} maxVisible={10} />
      {watchers.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '0.9em', color: '#666' }}>
          <strong>Lista completa:</strong>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {watchers.map((watcher) => (
              <div
                key={watcher.id || watcher.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px',
                  borderRadius: '4px',
                  backgroundColor: '#F9FAFB'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}
                >
                  {watcher.avatar || watcher.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <span>{watcher.name || watcher.email}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.85em', color: '#9CA3AF' }}>
                  {new Date(watcher.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

