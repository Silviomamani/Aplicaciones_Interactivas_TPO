import { useState, useEffect } from 'react'
import api from '../api/client.js'
import Button from './Button.jsx'
import Card from './Card.jsx'
import { useNotifications } from '../context/NotificationContext.jsx'

export default function WatchlistTable() {
  const { success, error } = useNotifications()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [equipos, setEquipos] = useState([])
  const [filters, setFilters] = useState({
    status: '',
    teamId: '',
    ordenarPor: 'updatedAt',
    direccion: 'DESC'
  })
  const [pagination, setPagination] = useState({
    paginaActual: 1,
    totalPaginas: 0,
    totalRegistros: 0,
    registrosPorPagina: 10
  })

  useEffect(() => {
    loadWatchlist()
  }, [filters, pagination.paginaActual])

  useEffect(() => {
    const loadEquipos = async () => {
      try {
        const res = await api.get('/equipos')
        setEquipos(res.data?.data?.equipos || [])
      } catch (err) {
        console.error('Error loading equipos:', err)
      }
    }
    loadEquipos()
  }, [])

  const loadWatchlist = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        pagina: pagination.paginaActual,
        limite: pagination.registrosPorPagina,
        ...(filters.status && { status: filters.status }),
        ...(filters.teamId && { teamId: filters.teamId }),
        ...(filters.ordenarPor && { ordenarPor: filters.ordenarPor }),
        ...(filters.direccion && { direccion: filters.direccion })
      })

      const response = await api.get(`/watchlist?${params}`)
      setTareas(response.data.data?.tareas || [])
      setPagination(prev => ({
        ...prev,
        ...response.data.data?.paginacion
      }))
    } catch (err) {
      console.error('Error loading watchlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnwatch = async (taskId) => {
    if (!window.confirm('¿Estás seguro de que deseas desuscribirte de esta tarea?')) {
      return
    }

    try {
      await api.delete(`/tareas/${taskId}/watchers`)
      success('Desuscripción exitosa', 'Te has desuscrito de la tarea')
      loadWatchlist()
    } catch (err) {
      error('Error', err.response?.data?.message || 'Error al desuscribirse')
    }
  }

  const handleMarkAsRead = async (taskId) => {
    try {
      await api.put(`/tareas/${taskId}/notificaciones/leer`)
      success('Notificaciones marcadas', 'Las notificaciones han sido marcadas como leídas')
      loadWatchlist()
      // Refrescar el badge inmediatamente
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('watcher:refresh-count'))
      }
    } catch (err) {
      error('Error', 'No se pudieron marcar las notificaciones como leídas')
      console.error('Error marking as read:', err)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pendiente: { bg: '#FEF3C7', color: '#92400E', text: 'Pendiente' },
      en_curso: { bg: '#D1FAE5', color: '#065F46', text: 'En Curso' },
      finalizada: { bg: '#DBEAFE', color: '#1E40AF', text: 'Finalizada' },
      cancelada: { bg: '#FEE2E2', color: '#991B1B', text: 'Cancelada' }
    }
    const badge = badges[status] || badges.pendiente
    return (
      <span
        style={{
          backgroundColor: badge.bg,
          color: badge.color,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.85em',
          fontWeight: '600'
        }}
      >
        {badge.text}
      </span>
    )
  }

  const getPriorityBadge = (prioridad) => {
    const badges = {
      baja: { bg: '#DBEAFE', color: '#1E40AF', text: 'Baja' },
      media: { bg: '#FFEDD5', color: '#9A3412', text: 'Media' },
      alta: { bg: '#FEE2E2', color: '#991B1B', text: 'Alta' },
      critica: { bg: '#FEE2E2', color: '#7F1D1D', text: 'Crítica' }
    }
    const badge = badges[prioridad] || badges.media
    return (
      <span
        style={{
          backgroundColor: badge.bg,
          color: badge.color,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.85em',
          fontWeight: '600'
        }}
      >
        {badge.text}
      </span>
    )
  }

  if (loading && tareas.length === 0) {
    return (
      <Card title="Mi Watchlist">
        <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>
      </Card>
    )
  }

  return (
    <Card title="Mi Watchlist">
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E5E7EB' }}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_curso">En Curso</option>
          <option value="finalizada">Finalizada</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select
          value={filters.teamId}
          onChange={(e) => setFilters({ ...filters, teamId: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E5E7EB' }}
        >
          <option value="">Todos los equipos</option>
          {equipos.map(eq => (
            <option key={eq.id} value={eq.id}>{eq.nombre}</option>
          ))}
        </select>
        <select
          value={`${filters.ordenarPor}:${filters.direccion}`}
          onChange={(e) => {
            const [ordenarPor, direccion] = e.target.value.split(':')
            setFilters({ ...filters, ordenarPor, direccion })
          }}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E5E7EB' }}
        >
          <option value="updatedAt:DESC">Último cambio (recientes primero)</option>
          <option value="updatedAt:ASC">Último cambio (antiguos primero)</option>
        </select>
        <Button
          variant="secondary"
          onClick={() => setFilters({ status: '', teamId: '', ordenarPor: 'updatedAt', direccion: 'DESC' })}
        >
          Limpiar filtros
        </Button>
      </div>

      {tareas.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No estás suscrito a ninguna tarea
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Título</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Equipo</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Prioridad</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Última actualización</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map((tarea) => (
                  <tr key={tarea.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>{tarea.titulo}</strong>
                          {tarea.isOverdue && (
                            <span
                              style={{
                                backgroundColor: '#FEE2E2',
                                color: '#991B1B',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.75em',
                                fontWeight: '600'
                              }}
                            >
                              Vencida
                            </span>
                          )}
                          {tarea.unreadNotifications > 0 && (
                            <span
                              style={{
                                backgroundColor: '#EF4444',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}
                            >
                              {tarea.unreadNotifications}
                            </span>
                          )}
                        </div>
                        {tarea.notifications && tarea.notifications.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                            {tarea.notifications.slice(0, 3).map((notif, idx) => {
                              const getNotificationText = () => {
                                switch (notif.eventType) {
                                  case 'statusChange':
                                    return `Estado: ${notif.payload?.estadoAnterior || '—'} → ${notif.payload?.estadoNuevo || '—'}`;
                                  case 'priorityChange':
                                    return `Prioridad: ${notif.payload?.prioridadAnterior || '—'} → ${notif.payload?.prioridadNueva || '—'}`;
                                  case 'comment':
                                    return 'Nuevo comentario';
                                  case 'assignment':
                                    return 'Cambio de asignación';
                                  case 'dueDateChange':
                                    return 'Cambio de fecha límite';
                                  case 'titleChange':
                                    return 'Cambio de título';
                                  default:
                                    return 'Cambio en la tarea';
                                }
                              };
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    fontSize: '0.8em',
                                    color: '#666',
                                    padding: '4px 8px',
                                    backgroundColor: '#F9FAFB',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <span style={{ fontSize: '0.7em', color: '#9CA3AF' }}>
                                    {new Date(notif.createdAt).toLocaleDateString('es-AR', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span>{getNotificationText()}</span>
                                </div>
                              );
                            })}
                            {tarea.notifications.length > 3 && (
                              <div style={{ fontSize: '0.75em', color: '#9CA3AF', fontStyle: 'italic' }}>
                                +{tarea.notifications.length - 3} más
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: tarea.equipo?.color || '#3B82F6',
                          marginRight: '6px'
                        }}
                      />
                      {tarea.equipo?.nombre || '—'}
                    </td>
                    <td style={{ padding: '12px' }}>{getStatusBadge(tarea.estado)}</td>
                    <td style={{ padding: '12px' }}>{getPriorityBadge(tarea.prioridad)}</td>
                    <td style={{ padding: '12px', color: '#666', fontSize: '0.9em' }}>
                      {new Date(tarea.updatedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="secondary"
                          onClick={() => handleUnwatch(tarea.id)}
                          style={{ fontSize: '0.85em' }}
                        >
                          Desuscribirse
                        </Button>
                        {tarea.unreadNotifications > 0 && (
                          <Button
                            variant="secondary"
                            onClick={() => handleMarkAsRead(tarea.id)}
                            style={{ 
                              fontSize: '0.85em',
                              backgroundColor: '#9CA3AF',
                              color: 'white',
                              borderColor: '#9CA3AF'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#6B7280'
                              e.currentTarget.style.borderColor = '#6B7280'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#9CA3AF'
                              e.currentTarget.style.borderColor = '#9CA3AF'
                            }}
                          >
                            Marcar leído
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPaginas > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              <Button
                variant="ghost"
                onClick={() => setPagination({ ...pagination, paginaActual: pagination.paginaActual - 1 })}
                disabled={pagination.paginaActual === 1}
              >
                Anterior
              </Button>
              <span style={{ color: '#666' }}>
                Página {pagination.paginaActual} de {pagination.totalPaginas}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPagination({ ...pagination, paginaActual: pagination.paginaActual + 1 })}
                disabled={pagination.paginaActual === pagination.totalPaginas}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

