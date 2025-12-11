import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Card from '../components/Card.jsx'

const ESTADOS = [
  { value: '', label: 'Todos los estados', icon: '' },
  { value: 'pendiente', label: 'Pendiente', icon: '', color: '#fbbf24' },
  { value: 'en_curso', label: 'En curso', icon: '', color: '#22c55e' },
  { value: 'finalizada', label: 'Finalizada', icon: '', color: '#3b82f6' },
  { value: 'cancelada', label: 'Cancelada', icon: '', color: '#ef4444' }
]

const PRIORIDADES = [
  { value: '', label: 'Todas las prioridades', icon: '' },
  { value: 'alta', label: 'Alta', icon: '', color: '#ef4444' },
  { value: 'media', label: 'Media', icon: '', color: '#f97316' },
  { value: 'baja', label: 'Baja', icon: '', color: '#3b82f6' }
]

export default function TaskList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [tareas, setTareas] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [asignadoA, setAsignadoA] = useState('')
  const [etiquetas, setEtiquetas] = useState([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  
  // Paginación
  const [pagina, setPagina] = useState(1)
  const [limite] = useState(10)
  const [ordenarPor, setOrdenarPor] = useState('fechaLimite')
  const [direccion, setDireccion] = useState('ASC')

  // Referencias para animaciones
  const tableRef = useRef(null)
  const filtersRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/equipos')
        const arr = res?.data?.data?.equipos || []
        setEquipos(arr)
        if (arr.length > 0) {
          setEquipoId(arr[0].id)
        }
      } catch (e) {
        setError('No pudimos cargar los equipos')
      }
    })()
  }, [])

  useEffect(() => {
    if (!equipoId) {
      setTareas([])
      setTotal(0)
      setLoading(false)
      return
    }
    cargarTareas()
  }, [equipoId, pagina, estado, prioridad, asignadoA, fechaDesde, fechaHasta, ordenarPor, direccion, busqueda])

  // Animaciones después de cargar
  useEffect(() => {
    if (!loading && tareas.length > 0) {
      animarTabla()
    }
  }, [loading, tareas])

  const cargarTareas = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        limite: limite.toString(),
        ordenarPor,
        direccion
      })
      
      if (estado) params.append('estado', estado)
      if (prioridad) params.append('prioridad', prioridad)
      if (asignadoA) params.append('asignadoA', asignadoA)
      if (fechaDesde) params.append('fechaLimiteDesde', fechaDesde)
      if (fechaHasta) params.append('fechaLimiteHasta', fechaHasta)
      if (busqueda) params.append('busqueda', busqueda)
      if (etiquetas.length > 0) params.append('etiquetas', etiquetas.join(','))

      const res = await api.get(`/tareas/${equipoId}?${params}`)
      const data = res.data?.data || res.data
      setTareas(data.rows || data.tareas || [])
      setTotal(data.count || data.total || 0)
    } catch (e) {
      setError('No pudimos cargar las tareas')
      setTareas([])
    } finally {
      setLoading(false)
    }
  }

  const animarTabla = () => {
    // Animar filtros
    if (filtersRef.current) {
      gsap.from(filtersRef.current, {
        duration: 0.5,
        y: -20,
        opacity: 0,
        ease: 'power2.out'
      })
    }

    // Animar filas de la tabla
    const rows = tableRef.current?.querySelectorAll('tbody tr')
    if (rows) {
      gsap.from(rows, {
        duration: 0.4,
        y: 20,
        opacity: 0,
        stagger: 0.05,
        ease: 'power2.out'
      })
    }
  }

  const totalPaginas = Math.ceil(total / limite)

  const formatearFecha = (fecha) => {
    if (!fecha) return '—'
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const tituloEstado = (e) => {
    const estado = ESTADOS.find(s => s.value === e)
    return estado?.label || e
  }

  const iconoEstado = (e) => {
    const estado = ESTADOS.find(s => s.value === e)
    return estado?.icon || ''
  }

  const tituloPrioridad = (p) => {
    const prioridad = PRIORIDADES.find(pr => pr.value === p)
    return prioridad?.label || p
  }

  const iconoPrioridad = (p) => {
    const prioridad = PRIORIDADES.find(pr => pr.value === p)
    return prioridad?.icon || ''
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setEstado('')
    setPrioridad('')
    setAsignadoA('')
    setEtiquetas([])
    setFechaDesde('')
    setFechaHasta('')
    setPagina(1)
  }

  const tieneFiltros = estado || prioridad || asignadoA || fechaDesde || fechaHasta || busqueda || etiquetas.length > 0

  if (loading && tareas.length === 0) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <div className="skeleton" style={{ width: 300, height: 40, marginBottom: 24 }}></div>
          <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 16 }}></div>
          <div className="skeleton" style={{ width: '100%', height: 400 }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Lista de Tareas</div>
          <p className="page-description">
            Gestiona y organiza todas tus tareas en un solo lugar
          </p>
        </div>
        <Button 
          className="btn-success"
          onClick={() => navigate(`/tareas/nueva${equipoId ? `?equipo=${equipoId}` : ''}`)}
        >
          Nueva tarea
        </Button>
      </div>

      {/* Filtros superiores */}
      <div className="filters-bar" ref={filtersRef}>
        <div className="filter-group flex-auto">
          <label className="filter-label">
            Equipo
          </label>
          <select 
            className="field-input" 
            value={equipoId} 
            onChange={(e) => {
              setEquipoId(e.target.value)
              setPagina(1)
            }}
          >
            <option value="">Seleccionar equipo...</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filter-group flex-1">
          <label className="filter-label">
            Buscar
          </label>
          <input
            type="search"
            className="field-input"
            placeholder="Buscar en título y descripción..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
          />
        </div>

        <div className="filter-group flex-160">
          <label className="filter-label">
            Estado
          </label>
          <select 
            className="field-input" 
            value={estado} 
            onChange={(e) => {
              setEstado(e.target.value)
              setPagina(1)
            }}
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group flex-160">
          <label className="filter-label">
            Prioridad
          </label>
          <select 
            className="field-input" 
            value={prioridad} 
            onChange={(e) => {
              setPrioridad(e.target.value)
              setPagina(1)
            }}
          >
            {PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group flex-200">
          <label className="filter-label">
            Ordenar por
          </label>
          <select 
            className="field-input" 
            value={ordenarPor} 
            onChange={(e) => setOrdenarPor(e.target.value)}
          >
            <option value="fechaLimite">Fecha límite</option>
            <option value="createdAt">Fecha de creación</option>
            <option value="updatedAt">Fecha de actualización</option>
          </select>
        </div>

        {tieneFiltros && (
          <Button 
            variant="ghost" 
            onClick={limpiarFiltros}
            className="filter-button-align-end"
          >
            Limpiar
          </Button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tabla de tareas */}
      <Card>
        {tareas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div className="empty-title">No hay tareas</div>
            <div className="empty-description">
              {equipoId 
                ? tieneFiltros
                  ? 'No se encontraron tareas con los filtros seleccionados'
                  : 'Este equipo no tiene tareas aún'
                : 'Seleccioná un equipo para ver sus tareas'}
            </div>
            {equipoId && (
              <Button 
                className="btn-success"
                onClick={() => navigate(`/tareas/nueva?equipo=${equipoId}`)}
              >
                Crear primera tarea
              </Button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="tasks-table" ref={tableRef}>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th style={{ minWidth: 250 }}>Título</th>
                    <th style={{ width: 140 }}>Estado</th>
                    <th style={{ width: 130 }}>Prioridad</th>
                    <th style={{ width: 120 }}>Fecha límite</th>
                    <th style={{ width: 150 }}>Asignado</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tareas.map((tarea, idx) => (
                    <tr key={tarea.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        {(pagina - 1) * limite + idx + 1}
                      </td>
                      <td>
                        <div 
                          className="task-title" 
                          onClick={() => navigate(`/tareas/${tarea.id}`)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8,
                            fontWeight: 500
                          }}
                        >
                          {tarea.titulo}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${tarea.estado}`}>
                          {tituloEstado(tarea.estado)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-priority-${tarea.prioridad || 'media'}`}>
                          {tituloPrioridad(tarea.prioridad || 'media')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {formatearFecha(tarea.fechaLimite)}
                      </td>
                      <td>
                        {tarea.asignado ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ 
                              width: 28, 
                              height: 28, 
                              borderRadius: '50%', 
                              background: 'var(--primary)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700
                            }}>
                              {(tarea.asignado.nombre || tarea.asignado.email || 'U')[0].toUpperCase()}
                            </span>
                            <span style={{ fontSize: 14 }}>
                              {tarea.asignado.nombre || tarea.asignado.email}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button 
                          variant="ghost" 
                          onClick={() => navigate(`/tareas/${tarea.id}`)}
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Mostrando {((pagina - 1) * limite) + 1} - {Math.min(pagina * limite, total)} de {total} tareas
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button 
                    variant="secondary" 
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    style={{ padding: '8px 16px' }}
                  >
                    ◀ Anterior
                  </Button>
                  <div style={{ 
                    padding: '8px 16px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14
                  }}>
                    {pagina} / {totalPaginas}
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    style={{ padding: '8px 16px' }}
                  >
                    Siguiente ▶
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}