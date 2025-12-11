import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotifications } from '../context/NotificationContext.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Card from '../components/Card.jsx'
import Modal from '../components/Modal.jsx'
import WatcherList from '../components/WatcherList.jsx'
import WatchToggleButton from '../components/WatchToggleButton.jsx'

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: '#fef3c7', textColor: '#92400e' },
  { value: 'en_curso', label: 'En curso', color: '#dbeafe', textColor: '#1e40af' },
  { value: 'finalizada', label: 'Finalizada', color: '#d1fae5', textColor: '#065f46' },
  { value: 'cancelada', label: 'Cancelada', color: '#fee2e2', textColor: '#991b1b' }
]

const PRIORIDADES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' }
]

export default function TaskForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error } = useNotifications()
  const esEdicion = !!id

  const [equipos, setEquipos] = useState([])
  const [miembros, setMiembros] = useState([])
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState([])
  
  const [equipoId, setEquipoId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('pendiente')
  const [prioridad, setPrioridad] = useState('media')
  const [fechaLimite, setFechaLimite] = useState('')
  const [asignadoA, setAsignadoA] = useState('')
  const [etiquetas, setEtiquetas] = useState([])
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('')

  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [historial, setHistorial] = useState([])
  const [isWatching, setIsWatching] = useState(false)
  const [tareaId, setTareaId] = useState(null)

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [cargando, setCargando] = useState(esEdicion)

  // Cargar equipos al inicio
  useEffect(() => {
    ;(async () => {
      try {
        const resEquipos = await api.get('/equipos')
        const equiposData = resEquipos?.data?.data?.equipos || []
        
        setEquipos(equiposData)
        
        const equipoParam = searchParams.get('equipo')
        if (equipoParam) {
          setEquipoId(equipoParam)
        } else if (equiposData.length > 0) {
          const primerEquipo = equiposData[0]
          setEquipoId(primerEquipo.id)
        }
      } catch (e) {
        console.error('Error cargando equipos:', e)
        error('Error', 'No se pudieron cargar los equipos')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (esEdicion && id) {
      if (equipoId) {
        cargarTarea()
      } else if (equipos.length > 0) {
        // Si no hay equipoId pero hay equipos, buscar la tarea en todos los equipos
        buscarTareaEnEquipos()
      }
    }
  }, [id, equipoId, equipos.length])

  // Cargar miembros y etiquetas cuando cambia el equipo
  useEffect(() => {
    if (equipoId) {
      cargarMiembros(equipoId)
      cargarEtiquetas(equipoId)
    } else {
      setMiembros([])
      setEtiquetasDisponibles([])
    }
  }, [equipoId])

  const cargarMiembros = async (equipoId) => {
    if (!equipoId) {
      setMiembros([])
      return
    }
    try {
      const res = await api.get(`/equipos/${equipoId}/miembros`)
      const miembrosData = res?.data?.data?.miembros || []
      setMiembros(miembrosData)
    } catch (e) {
      console.error('Error cargando miembros:', e)
      setMiembros([])
    }
  }

  const cargarEtiquetas = async (equipoId) => {
    if (!equipoId) {
      setEtiquetasDisponibles([])
      return
    }
    try {
      const res = await api.get(`/etiquetas/${equipoId}/etiquetas`)
      const etiquetasData = res?.data?.data?.etiquetas || []
      setEtiquetasDisponibles(etiquetasData)
    } catch (e) {
      console.error('Error cargando etiquetas:', e)
      setEtiquetasDisponibles([])
    }
  }

  const verificarSuscripcionDesdeWatchers = async (watchersList) => {
    try {
      // Obtener el usuario actual para verificar si está suscrito
      const userRes = await api.get('/auth/perfil')
      const currentUserId = userRes?.data?.data?.usuario?.id || userRes?.data?.data?.id
      const watching = watchersList.some(w => w.userId === currentUserId)
      setIsWatching(watching)
    } catch (e) {
      console.error('Error obteniendo perfil de usuario:', e.response?.data || e.message)
      setIsWatching(false)
    }
  }

  const buscarTareaEnEquipos = async () => {
    if (!id || equipos.length === 0) return
    
    setCargando(true)
    try {
      // Buscar la tarea en todos los equipos
      for (const equipo of equipos) {
        try {
          const resTarea = await api.get(`/tareas/${equipo.id}/${id}`)
          const t = resTarea?.data?.data?.tarea || resTarea?.data?.data
          if (t) {
            setEquipoId(equipo.id)
            cargarDatosTarea(t)
            return
          }
        } catch (e) {
          // Continuar buscando en el siguiente equipo
          continue
        }
      }
      error('Error', 'No se encontró la tarea en ninguno de tus equipos.')
    } catch (e) {
      console.error('Error buscando tarea:', e)
      error('Error', 'No se pudo buscar la tarea.')
    } finally {
      setCargando(false)
    }
  }

  const cargarDatosTarea = (t) => {
    setTitulo(t.titulo || '')
    setDescripcion(t.descripcion || '')
    setEstado(t.estado || 'pendiente')
    setPrioridad(t.prioridad || 'media')
    setFechaLimite(t.fechaLimite ? t.fechaLimite.split('T')[0] : '')
    setAsignadoA(t.asignado?.id || t.asignadoA || '')
    setEtiquetas(t.etiquetas?.map(e => e.id) || [])
    setComentarios(t.comentarios || [])
    setHistorial(t.historialEstados || [])
    // Guardar el ID real de la tarea
    if (t.id) {
      setTareaId(t.id)
    }
  }

  const cargarTarea = async () => {
    if (!equipoId || !id) {
      console.error('No se puede cargar la tarea: falta equipoId o id')
      return
    }
    
    setCargando(true)
    try {
      const resTarea = await api.get(`/tareas/${equipoId}/${id}`)
      
      const t = resTarea?.data?.data?.tarea || resTarea?.data?.data
      if (t) {
        // Si el equipoId de la tarea es diferente, actualizarlo
        if (t.equipoId && t.equipoId !== equipoId) {
          setEquipoId(t.equipoId)
        }
        
        cargarDatosTarea(t)
        // La suscripción se verificará automáticamente cuando WatcherList cargue los watchers
      }
    } catch (e) {
      console.error('Error cargando tarea:', e)
      error('Error', 'No se pudo cargar la tarea. Verifica que el equipo y la tarea existan.')
    } finally {
      setCargando(false)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!titulo.trim()) {
      newErrors.titulo = 'El título es requerido'
    }
    if (!equipoId) {
      newErrors.equipoId = 'Debes seleccionar un equipo'
    }
    if (fechaLimite) {
      const fecha = new Date(fechaLimite)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      if (fecha < hoy) {
        newErrors.fechaLimite = 'La fecha límite no puede ser en el pasado'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        estado,
        prioridad,
        fechaLimite: fechaLimite ? fechaLimite : undefined,
        asignadoA: asignadoA || undefined,
        etiquetas: etiquetas.length > 0 ? etiquetas : undefined
      }
      
      // Remover campos undefined del payload
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key]
        }
      })

      if (esEdicion) {
        await api.put(`/tareas/${equipoId}/${id}`, payload)
        success('Tarea actualizada', 'La tarea se actualizó correctamente')
      } else {
        await api.post(`/tareas/${equipoId}`, payload)
        success('Tarea creada', 'La tarea se creó correctamente')
      }
      navigate(`/tareas${equipoId ? `?equipo=${equipoId}` : ''}`)
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al guardar la tarea'
      setErrors({ general: errorMsg })
      error('Error', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const agregarComentario = async () => {
    if (!nuevoComentario.trim() || !id) return
    try {
      const res = await api.post(`/tareas/${equipoId}/${id}/comentarios`, {
        contenido: nuevoComentario.trim()
      })
      setComentarios([res.data?.data?.comentario || res.data, ...comentarios])
      setNuevoComentario('')
      success('Comentario agregado', 'El comentario se agregó correctamente')
    } catch (e) {
      console.error('Error agregando comentario:', e)
      error('Error', 'No se pudo agregar el comentario')
    }
  }

  const agregarEtiqueta = () => {
    if (!nuevaEtiqueta.trim()) return
    const etiqueta = etiquetasDisponibles.find(e => 
      e.nombre.toLowerCase() === nuevaEtiqueta.trim().toLowerCase()
    )
    if (etiqueta && !etiquetas.includes(etiqueta.id)) {
      setEtiquetas([...etiquetas, etiqueta.id])
      setNuevaEtiqueta('')
    }
  }

  const removerEtiqueta = (etiquetaId) => {
    setEtiquetas(etiquetas.filter(id => id !== etiquetaId))
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (cargando) {
    return <div className="page-loading">Cargando tarea...</div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Volver
        </Button>
        <div className="page-title">{esEdicion ? 'Editar tarea' : 'Nueva tarea'}</div>
      </div>

      <form onSubmit={handleSubmit} className="task-form">
        <Card>
          <div className="form-grid">
            <div className="form-group">
              <Input
                label="Título"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  if (errors.titulo) setErrors({ ...errors, titulo: '' })
                }}
                error={errors.titulo}
                required
                placeholder="Título de la tarea"
              />
            </div>

            <div className="form-group">
              <label className="field">
                <div className="field-label">Descripción</div>
                <textarea
                  className="field-input"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  placeholder="Descripción de la tarea"
                />
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="field">
                  <div className="field-label">Estado</div>
                  <select
                    className="field-input"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    style={{
                      backgroundColor: ESTADOS.find(e => e.value === estado)?.color || 'transparent',
                      color: ESTADOS.find(e => e.value === estado)?.textColor || 'inherit'
                    }}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value} style={{
                        backgroundColor: e.color,
                        color: e.textColor
                      }}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-group">
                <label className="field">
                  <div className="field-label">Prioridad</div>
                  <select
                    className="field-input"
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <Input
                  label="Vence"
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => {
                    setFechaLimite(e.target.value)
                    if (errors.fechaLimite) setErrors({ ...errors, fechaLimite: '' })
                  }}
                  error={errors.fechaLimite}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label className="field">
                  <div className="field-label">Asignado a</div>
                  <select
                    className="field-input"
                    value={asignadoA}
                    onChange={(e) => setAsignadoA(e.target.value)}
                    disabled={!equipoId}
                  >
                    <option value="">Sin asignar</option>
                    {miembros.map((membresia) => {
                      const usuario = membresia.usuario || membresia
                      return (
                        <option key={usuario.id} value={usuario.id}>
                          @{usuario.nombre || usuario.email}
                        </option>
                      )
                    })}
                  </select>
                  {!equipoId && (
                    <div className="field-hint">Seleccioná un equipo primero</div>
                  )}
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="field">
                <div className="field-label">Equipo</div>
                <select
                  className={`field-input${errors.equipoId ? ' has-error' : ''}`}
                  value={equipoId}
                  onChange={(e) => {
                    const nuevoEquipoId = e.target.value
                    setEquipoId(nuevoEquipoId)
                    setAsignadoA('') // Limpiar asignación al cambiar equipo
                    if (errors.equipoId) setErrors({ ...errors, equipoId: '' })
                  }}
                  required
                  disabled={esEdicion}
                >
                  <option value="">Seleccionar equipo</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                  ))}
                </select>
                {errors.equipoId && <div className="field-error">{errors.equipoId}</div>}
                {equipos.length === 0 && (
                  <div className="field-hint">No tenés equipos. Creá uno desde la sección Equipos.</div>
                )}
              </label>
            </div>

            <div className="form-group">
              <label className="field">
                <div className="field-label">Etiquetas</div>
                <div className="tags-input">
                  <div className="tags-list">
                    {etiquetas.map((etiquetaId) => {
                      const etiqueta = etiquetasDisponibles.find(e => e.id === etiquetaId)
                      return etiqueta ? (
                        <span key={etiquetaId} className="tag">
                          {etiqueta.nombre}
                          <button
                            type="button"
                            onClick={() => removerEtiqueta(etiquetaId)}
                            className="tag-remove"
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                  <div className="tags-input-control">
                    <input
                      type="text"
                      className="field-input"
                      value={nuevaEtiqueta}
                      onChange={(e) => setNuevaEtiqueta(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEtiqueta())}
                      placeholder="Agregar etiqueta"
                      list="etiquetas-list"
                    />
                    <datalist id="etiquetas-list">
                      {etiquetasDisponibles
                        .filter(e => !etiquetas.includes(e.id))
                        .map(e => (
                          <option key={e.id} value={e.nombre} />
                        ))}
                    </datalist>
                    <Button type="button" variant="secondary" onClick={agregarEtiqueta}>
                      + Agregar
                    </Button>
                  </div>
                </div>
              </label>
            </div>

            {errors.general && (
              <div className="field-error">{errors.general}</div>
            )}

            <div className="form-actions">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>

        {esEdicion && id && (
          <>
            <Card 
              title="Suscriptores"
              actions={
                <WatchToggleButton 
                  taskId={tareaId || id} 
                  isWatching={isWatching}
                  onToggle={(watching) => {
                    setIsWatching(watching)
                    // La lista se actualizará automáticamente por WatcherList
                  }}
                />
              }
            >
              <WatcherList 
                taskId={tareaId || id} 
                onWatchersLoaded={verificarSuscripcionDesdeWatchers}
              />
            </Card>

            <Card title="Comentarios">
              <div className="comentarios-section">
                <div className="comentario-input">
                  <textarea
                    className="field-input"
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={3}
                  />
                  <Button type="button" onClick={agregarComentario} disabled={!nuevoComentario.trim()}>
                    Enviar
                  </Button>
                </div>
                <div className="comentarios-list">
                  {comentarios.map((c) => (
                    <div key={c.id} className="comentario-item">
                      <div className="comentario-header">
                        <strong>@{c.usuario?.nombre || c.autor?.nombre || c.usuario?.email || c.autor?.email || 'Usuario'}</strong>
                        <span className="comentario-fecha">{formatearFecha(c.createdAt)}</span>
                      </div>
                      <div className="comentario-contenido">{c.contenido}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Historial">
              <div className="historial-list">
                {historial.map((h) => {
                  const estadoAnterior = ESTADOS.find(e => e.value === h.estadoAnterior)
                  const estadoNuevo = ESTADOS.find(e => e.value === h.estadoNuevo)
                  return (
                    <div key={h.id} className="historial-item">
                      <div className="historial-dot" />
                      <div>
                        <div className="historial-text">
                          <strong>@{h.usuario?.nombre || h.usuario?.email || 'Usuario'}</strong>
                          {' cambió Estado: '}
                          <span 
                            className="historial-estado badge"
                            style={{
                              backgroundColor: estadoAnterior?.color || '#f3f4f6',
                              color: estadoAnterior?.textColor || '#374151',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            {h.estadoAnterior || '—'}
                          </span>
                          {' → '}
                          <span 
                            className="historial-estado badge"
                            style={{
                              backgroundColor: estadoNuevo?.color || '#f3f4f6',
                              color: estadoNuevo?.textColor || '#374151',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            {h.estadoNuevo}
                          </span>
                        </div>
                        <div className="historial-fecha">{formatearFecha(h.createdAt)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </>
        )}
      </form>
    </div>
  )
}

