import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'

gsap.registerPlugin(Draggable)

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', icon: '', color: '#fbbf24', bg: '#fef3c7' },
  { value: 'en_curso', label: 'En curso', icon: '', color: '#22c55e', bg: '#d1fae5' },
  { value: 'finalizada', label: 'Finalizada', icon: '', color: '#3b82f6', bg: '#dbeafe' },
  { value: 'cancelada', label: 'Cancelada', icon: '', color: '#ef4444', bg: '#fee2e2' }
]

export default function TaskBoard() {
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fetched = useRef(false)
  const boardRef = useRef(null)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    ;(async () => {
      try {
        const resEquipos = await api.get('/equipos')
        const arrEquipos = resEquipos?.data?.data?.equipos || []
        setEquipos(arrEquipos)
        const firstId = arrEquipos[0]?.id
        if (firstId) {
          setEquipoId(firstId)
          const resT = await api.get(`/tareas/${firstId}`)
          setTareas(resT?.data?.rows || resT?.data?.data?.tareas || [])
        } else {
          setTareas([])
        }
      } catch (e) {
        setError('No pudimos cargar las tareas')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!loading && tareas.length > 0) {
      animarBoard()
    }
  }, [loading, tareas])

  const animarBoard = () => {
    const columns = boardRef.current?.querySelectorAll('.column')
    if (columns) {
      gsap.from(columns, {
        duration: 0.6,
        y: 30,
        opacity: 0,
        stagger: 0.1,
        ease: 'power2.out'
      })
    }

    const cards = boardRef.current?.querySelectorAll('.kanban-card')
    if (cards) {
      gsap.from(cards, {
        duration: 0.4,
        scale: 0.9,
        opacity: 0,
        stagger: 0.05,
        ease: 'back.out(1.2)'
      })
    }
  }

  const onChangeEquipo = async (id) => {
    setEquipoId(id)
    if (!id) { setTareas([]); return }
    setLoading(true)
    try {
      const resT = await api.get(`/tareas/${id}`)
      setTareas(resT?.data?.rows || resT?.data?.data?.tareas || [])
    } catch (_e) {
      setError('No pudimos cargar las tareas')
    } finally {
      setLoading(false)
    }
  }

  const porEstado = useMemo(() => {
    const map = Object.fromEntries(ESTADOS.map((e) => [e.value, []]))
    tareas.forEach((t) => { (map[t.estado] || map.pendiente).push(t) })
    return map
  }, [tareas])

  const move = async (tarea, toEstado) => {
    const prev = tareas
    setTareas((arr) => arr.map((t) => t.id === tarea.id ? { ...t, estado: toEstado } : t))
    try {
      if (!tarea.equipoId) throw new Error('equipoId faltante')
      await api.put(`/tareas/${tarea.equipoId}/${tarea.id}`, { estado: toEstado })
      
      // Animación de éxito - esperar a que React termine de renderizar
      setTimeout(() => {
        const cardElement = document.querySelector(`.kanban-card[data-task-id="${tarea.id}"]`)
        if (cardElement) {
          gsap.to(cardElement, {
            duration: 0.3,
            scale: 1.05,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
          })
        }
      }, 50)
    } catch (e) {
      setTareas(prev)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 16 }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: 400 }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-error">
          <div className="empty-icon"></div>
          <div className="empty-title">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Tablero Kanban</div>
          <p className="page-description">
            Visualiza y gestiona el flujo de trabajo de tu equipo
          </p>
        </div>
        <select 
          className="field-input" 
          value={equipoId} 
          onChange={(e) => onChangeEquipo(e.target.value)} 
          style={{ maxWidth: 320 }}
        >
          <option value="">Seleccionar equipo...</option>
          {equipos.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.nombre}</option>
          ))}
        </select>
      </div>

      {/* Board */}
      <div className="board" ref={boardRef}>
        {ESTADOS.map((estado) => {
          const tareasEstado = porEstado[estado.value] || []
          return (
            <div key={estado.value} className="column" style={{ borderTop: `4px solid ${estado.color}` }}>
              <div className="column-head" style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{estado.icon}</span>
                  <div>
                    <div className="column-title" style={{ fontSize: 16 }}>{estado.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {tareasEstado.length} {tareasEstado.length === 1 ? 'tarea' : 'tareas'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="cards">
                {tareasEstado.length === 0 ? (
                  <div style={{ 
                    padding: 24, 
                    textAlign: 'center', 
                    color: 'var(--text-muted)',
                    background: estado.bg,
                    borderRadius: 12,
                    fontSize: 13
                  }}>
                    No hay tareas
                  </div>
                ) : (
                  tareasEstado.map((t) => (
                    <div 
                      key={t.id}
                      className="kanban-card"
                      data-task-id={t.id}
                      onClick={() => navigate(`/tareas/${t.id}`)}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: 15,
                          color: 'var(--text-primary)',
                          marginBottom: 8
                        }}>
                          {t.titulo}
                        </div>
                        {t.descripcion && (
                          <div style={{ 
                            fontSize: 13, 
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {t.descripcion}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span className={`badge badge-priority-${t.prioridad || 'media'}`}>
                          {t.prioridad || 'media'}
                        </span>
                        {t.fechaLimite && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(t.fechaLimite).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>

                      {t.asignado && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          marginBottom: 12,
                          paddingTop: 12,
                          borderTop: '1px solid var(--border-light)'
                        }}>
                          <div style={{ 
                            width: 24, 
                            height: 24,
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700
                            }}>
                            {(t.asignado.nombre || t.asignado.email || 'U')[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {t.asignado.nombre || t.asignado.email}
                            </span>
                            </div>
                            )}
                                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {ESTADOS.filter((e) => e.value !== t.estado).map((e) => (
                                                  <button 
                                                    key={e.value} 
                                                    className="chip" 
                                                    onClick={(event) => {
                                                      event.stopPropagation()
                                                      move(t, e.value)
                                                    }}
                                                    style={{ 
                                                      fontSize: 11,
                                                      padding: '4px 10px',
                                                      background: e.bg,
                                                      color: e.color,
                                                      border: `1px solid ${e.color}`,
                                                      fontWeight: 600
                                                    }}
                                                  >
                                                    {e.label}
                                                  </button>
                                                ))}
                                                <button 
                                                  className="chip ghost" 
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/tareas/${t.id}`)
                                                  }}
                                                  style={{ fontSize: 11, padding: '4px 10px' }}
                                                >
                                                  Ver
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            )
                            }
                            