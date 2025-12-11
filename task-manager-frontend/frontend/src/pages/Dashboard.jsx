import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'

// Registrar plugin GSAP
gsap.registerPlugin(ScrollTrigger)

// Constantes de estado y prioridad
const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', fillColor: '#fbbf24' },
  { value: 'en_curso', label: 'En curso', fillColor: '#22c55e' },
  { value: 'finalizada', label: 'Finalizada', fillColor: '#3b82f6' },
  { value: 'cancelada', label: 'Cancelada', fillColor: '#ef4444' }
]

const PRIORIDADES = [
  { value: 'alta', label: 'Alta', fillColor: '#ef4444' },
  { value: 'media', label: 'Media', fillColor: '#f97316' },
  { value: 'baja', label: 'Baja', fillColor: '#3b82f6' }
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [equipos, setEquipos] = useState([])
  const [tareas, setTareas] = useState([])
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Refs para animaciones GSAP
  const statsRef = useRef([])
  const chartsRef = useRef([])
  const timelineRef = useRef(null)

  /* ----------------------------- Cargar datos ----------------------------- */
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [resEquipos, resActividades] = await Promise.all([
        api.get('/equipos'),
        api.get('/actividad/usuario?limite=10')
      ])

      const equiposData = resEquipos?.data?.data?.equipos || []
      setEquipos(equiposData)
      setActividades(resActividades?.data?.data?.actividades || [])

      // Cargar tareas por equipo
      const todasLasTareas = []
      for (const equipo of equiposData) {
        try {
          const resTareas = await api.get(`/tareas/${equipo.id}?limite=100`)
          const tareasEquipo =
            resTareas?.data?.data?.tareas || resTareas?.data?.rows || []
          todasLasTareas.push(...tareasEquipo)
        } catch (err) {
          console.error(`Error cargando tareas del equipo ${equipo.id}:`, err)
        }
      }
      setTareas(todasLasTareas)
    } catch (err) {
        setError('No pudimos cargar los datos')
      console.error('Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
  }

  /* -------------------------- Animaciones con GSAP ------------------------- */
  useEffect(() => {
    if (!loading && !error) animarDashboard()
  }, [loading, error])

  const animarDashboard = () => {
    // Header
    gsap.from('.page-header', { y: -30, opacity: 0, duration: 0.6, ease: 'power3.out' })

    // Estadísticas
    statsRef.current.forEach((stat, i) => {
      if (!stat) return
      gsap.from(stat, {
        y: 30,
        opacity: 0,
        delay: i * 0.1,
        duration: 0.6,
        ease: 'power3.out',
        onStart: () => {
          const valueEl = stat.querySelector('.stat-value')
          if (valueEl) {
            const finalValue = parseInt(valueEl.textContent)
            gsap.from({ value: 0 }, {
              value: finalValue,
              duration: 1.2,
              ease: 'power2.out',
              onUpdate() {
                valueEl.textContent = Math.round(this.targets()[0].value)
              }
            })
          }
        }
      })
    })

    // Gráficos de barras
    chartsRef.current.forEach((chart, i) => {
      if (!chart) return
      gsap.from(chart, {
        x: i % 2 === 0 ? -50 : 50,
        opacity: 0,
        delay: 0.3 + i * 0.15,
        duration: 0.8,
        ease: 'power3.out'
      })
      chart.querySelectorAll('.chart-bar-fill').forEach((bar, j) => {
        gsap.from(bar, {
          width: '0%',
          delay: 0.5 + i * 0.15 + j * 0.1,
          duration: 1.2,
          ease: 'power2.out'
        })
      })
    })

    // Timeline
    if (timelineRef.current) {
      timelineRef.current.querySelectorAll('.timeline-item').forEach((item, i) => {
        gsap.from(item, {
          scrollTrigger: { trigger: item, start: 'top bottom-=100', toggleActions: 'play none none reverse' },
          x: -30,
          opacity: 0,
          delay: i * 0.05,
          duration: 0.6,
          ease: 'power2.out'
        })
      })
    }

    // Cards de tareas - verificar que existan antes de animar
    const listContainer = document.querySelector('.list')
    if (listContainer) {
      const listItems = listContainer.querySelectorAll('.list-item')
      if (listItems.length > 0) {
        gsap.from(listItems, {
          scrollTrigger: { trigger: listContainer, start: 'top bottom-=50', toggleActions: 'play none none reverse' },
          y: 20,
          opacity: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out'
        })
      }
    }

    // Donut chart - verificar que exista antes de animar
    const donutChart = document.querySelector('.donut-chart')
    if (donutChart) {
      const donutItems = donutChart.querySelectorAll('.donut-item')
      if (donutItems.length > 0) {
        gsap.from(donutItems, {
          scrollTrigger: { trigger: donutChart, start: 'top bottom-=100', toggleActions: 'play none none reverse' },
          scale: 0.8,
          opacity: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: 'back.out(1.7)'
        })
      }
    }
  }

  /* ---------------------------- Cálculos de datos --------------------------- */
  const estadisticas = useMemo(() => {
    const porEstado = ESTADOS.reduce((acc, e) => {
      acc[e.value] = tareas.filter(t => t.estado === e.value).length
      return acc
    }, {})

    const porPrioridad = PRIORIDADES.reduce((acc, p) => {
      acc[p.value] = tareas.filter(t => t.prioridad === p.value).length
      return acc
    }, {})

    const tareasAsignadas = tareas.filter(t => t.asignadoA === user?.id).length

    const tareasVencidas = tareas.filter(t => {
      if (!t.fechaLimite) return false
      const fecha = new Date(t.fechaLimite)
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      return fecha < hoy && !['finalizada', 'cancelada'].includes(t.estado)
    }).length

    const tareasProximas = tareas.filter(t => {
      if (!t.fechaLimite) return false
      const fecha = new Date(t.fechaLimite)
      const hoy = new Date(); const en7 = new Date(); en7.setDate(hoy.getDate() + 7)
      hoy.setHours(0, 0, 0, 0); fecha.setHours(0, 0, 0, 0)
      return fecha >= hoy && fecha <= en7 && !['finalizada', 'cancelada'].includes(t.estado)
    }).length

    return { porEstado, porPrioridad, tareasAsignadas, tareasVencidas, tareasProximas, total: tareas.length }
  }, [tareas, user])

  const maxEstado = Math.max(...Object.values(estadisticas.porEstado), 1)
  const maxPrioridad = Math.max(...Object.values(estadisticas.porPrioridad), 1)

  /* --------------------------- Formatear fecha --------------------------- */
  const formatearFecha = fecha => {
    if (!fecha) return ''
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }

  /* --------------------------- Estados de carga --------------------------- */
  if (loading)
    return (
      <div className="page-loading">
        <div className="skeleton" style={{ width: 200, height: 40, marginBottom: 20 }} />
        <div className="skeleton" style={{ width: '100%', height: 300 }} />
      </div>
    )

  if (error)
    return (
      <div className="page-error">
        <div className="empty-icon"></div>
        <div className="empty-title">{error}</div>
        <Button onClick={cargarDatos}>Reintentar</Button>
      </div>
    )

  /* ----------------------------- Render principal ----------------------------- */
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <p className="page-description">
            Bienvenido de nuevo, {user?.nombre || 'Usuario'}
          </p>
        </div>
        <div className="row gap">
          <Button variant="secondary" onClick={() => navigate('/tareas')}> Ver todas</Button>
          <Button className="btn-success" onClick={() => navigate('/tareas/nueva')}> Nueva tarea</Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-grid">
        {[
          { label: 'Total de tareas', value: estadisticas.total },
          { label: 'Asignadas a mí', value: estadisticas.tareasAsignadas, gradient: ['#3b82f6', '#8b5cf6'] },
          { label: ' Vencidas', value: estadisticas.tareasVencidas, gradient: ['#ef4444', '#dc2626'] },
          { label: ' Próximas (7 días)', value: estadisticas.tareasProximas, gradient: ['#f97316', '#fb923c'] }
        ].map((stat, i) => (
          <Card key={i}>
            <div className="stat-card" ref={el => (statsRef.current[i] = el)}>
              <div className="stat-value"
                style={stat.gradient ? {
                  background: `linear-gradient(135deg, ${stat.gradient[0]}, ${stat.gradient[1]})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                } : {}}>
                {stat.value}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gráficos por estado y prioridad */}
      <div className="dashboard-grid">
        {[{ title: ' Tareas por Estado', data: ESTADOS, stats: estadisticas.porEstado, max: maxEstado },
          { title: ' Tareas por Prioridad', data: PRIORIDADES, stats: estadisticas.porPrioridad, max: maxPrioridad }
        ].map((chart, i) => (
          <Card key={i} title={chart.title}>
            <div className="chart-container" ref={el => (chartsRef.current[i] = el)}>
              {chart.data.map(({ value, label, fillColor }) => {
                const count = chart.stats[value] || 0
                const porcentaje = chart.max > 0 ? (count / chart.max) * 100 : 0
                return (
                  <div key={value} className="chart-item">
                    <div className="chart-label">
                      <span className="chart-label-text">{label}</span>
                      <span className="chart-label-value">{count}</span>
                    </div>
                    <div className="chart-bar">
                      <div className="chart-bar-fill" style={{ width: `${porcentaje}%`, backgroundColor: fillColor }}>
                        {count > 0 && <span className="chart-bar-text">{count}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
          ))}
        </div>

      {/* Donut chart */}
      <Card title=" Distribución por Estado">
        <div className="donut-chart">
          {ESTADOS.map(({ value, label, fillColor }) => {
            const count = estadisticas.porEstado[value] || 0
            const porcentaje = estadisticas.total > 0 ? (count / estadisticas.total) * 100 : 0
            return (
              <div key={value} className="donut-item">
                <div className="donut-segment" style={{ backgroundColor: fillColor, minWidth: porcentaje > 0 ? '140px' : 0 }}>
                  <div className="donut-label">
                    <div className="donut-label-name">{label}</div>
                    <div className="donut-label-value">{count} ({porcentaje.toFixed(1)}%)</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Tareas próximas a vencer */}
      <Card title=" Tareas próximas a vencer">
        {estadisticas.tareasProximas === 0 ? (
          <div className="empty-state-small">
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            No hay tareas próximas a vencer
          </div>
        ) : (
          <div className="list">
            {tareas
              .filter(t => {
                if (!t.fechaLimite) return false
                const fecha = new Date(t.fechaLimite)
                const hoy = new Date(); const en7 = new Date(); en7.setDate(hoy.getDate() + 7)
                hoy.setHours(0, 0, 0, 0); fecha.setHours(0, 0, 0, 0)
                return fecha >= hoy && fecha <= en7 && !['finalizada', 'cancelada'].includes(t.estado)
              })
              .slice(0, 5)
              .map(t => (
                <div key={t.id} className="list-item" onClick={() => navigate(`/tareas/${t.id}`)}>
                  <div>
                    <div className="list-title">{t.titulo}</div>
                    <div className="list-sub">
                      Vence: {formatearFecha(t.fechaLimite)} ·
                      <span className={`badge badge-${t.estado}`} style={{ marginLeft: 8 }}>
                        {ESTADOS.find(e => e.value === t.estado)?.label || t.estado}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 20 }}>→</span>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Actividad reciente */}
      <Card title=" Actividad reciente">
        {actividades.length === 0 ? (
          <div className="empty-state-small">
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            No hay actividad reciente
          </div>
        ) : (
          <div className="timeline" ref={timelineRef}>
            {actividades.slice(0, 10).map(a => (
            <div key={a.id} className="timeline-item">
              <div className="dot" />
              <div>
                  <div className="timeline-title">{a.descripcion || a.tipo}</div>
                  <div className="timeline-sub">{formatearFecha(a.createdAt)}</div>
                </div>
            </div>
          ))}
        </div>
        )}
      </Card>
    </div>
  )
}
