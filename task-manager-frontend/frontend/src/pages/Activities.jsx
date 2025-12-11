import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import api from '../api/client.js'
import Card from '../components/Card.jsx'

gsap.registerPlugin(ScrollTrigger)

const ICONOS_ACTIVIDAD = {
  'tarea_creada': '',
  'tarea_actualizada': '',
  'tarea_eliminada': '',
  'estado_cambiado': '',
  'miembro_agregado': '',
  'miembro_removido': '',
  'comentario_agregado': '',
  'archivo_adjunto': '',
  'default': ''
}

const COLORES_ACTIVIDAD = {
  'tarea_creada': '#22c55e',
  'tarea_actualizada': '#3b82f6',
  'tarea_eliminada': '#ef4444',
  'estado_cambiado': '#f97316',
  'miembro_agregado': '#8b5cf6',
  'miembro_removido': '#ec4899',
  'comentario_agregado': '#fbbf24',
  'archivo_adjunto': '#06b6d4',
  'default': '#6b7280'
}

export default function Activities() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const timelineRef = useRef(null)

  useEffect(() => {
    cargarActividades()
  }, [])

  useEffect(() => {
    if (!loading && items.length > 0) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        animarActividades()
      }, 100)
    }
  }, [loading, items])

  const cargarActividades = async () => {
    setLoading(true)
    try {
      const res = await api.get('/actividad/usuario?limite=50')
      const arr = res?.data?.data?.actividades
      setItems(Array.isArray(arr) ? arr : [])
    } catch (error) {
      console.error('Error cargando actividades:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const animarActividades = () => {
    if (timelineRef.current) {
      const items = timelineRef.current.querySelectorAll('.activity-item')
      
      // Primero, asegurar que TODOS los elementos sean visibles inmediatamente
      items.forEach((item) => {
        gsap.set(item, { 
          opacity: 1, 
          x: 0,
          clearProps: 'all'
        })
        // Forzar visibilidad también con CSS
        item.style.opacity = '1'
        item.style.transform = 'translateX(0)'
      })
      
      // Luego aplicar animaciones suaves solo para elementos que entran en viewport
      items.forEach((item, index) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top bottom-=100',
          onEnter: () => {
            gsap.fromTo(item,
              { opacity: 0.3, x: -15 },
              { 
                opacity: 1, 
                x: 0, 
                duration: 0.3,
                ease: 'power2.out'
              }
            )
          },
          once: true
        })
      })
    }
  }

  const obtenerIcono = (tipo) => {
    return ICONOS_ACTIVIDAD[tipo] || ICONOS_ACTIVIDAD.default
  }

  const obtenerColor = (tipo) => {
    return COLORES_ACTIVIDAD[tipo] || COLORES_ACTIVIDAD.default
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    const d = new Date(fecha)
    const ahora = new Date()
    const diff = ahora - d
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(diff / 3600000)
    const dias = Math.floor(diff / 86400000)

    if (minutos < 1) return 'Ahora'
    if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
    if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
    if (dias < 7) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`
    
    return d.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const actividadesFiltradas = filtro === 'todas' 
    ? items 
    : items.filter(item => item.tipo === filtro)

  const tiposUnicos = [...new Set(items.map(i => i.tipo))].filter(Boolean)

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <div className="skeleton" style={{ width: 300, height: 40, marginBottom: 24 }}></div>
          <div className="skeleton" style={{ width: '100%', height: 500 }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Actividad Reciente</div>
          <p className="page-description">
            Seguimiento de todas las acciones en tus equipos
          </p>
        </div>
      </div>

      {/* Filtros */}
      {tiposUnicos.length > 0 && (
        <div className="filters-container">
          <span className="filter-label-text">
            Filtrar:
          </span>
          <button
            onClick={() => setFiltro('todas')}
            className={`filter-button ${filtro === 'todas' ? 'active' : ''}`}
          >
            Todas
          </button>
          {tiposUnicos.map(tipo => (
            <button
              key={tipo}
              onClick={() => setFiltro(tipo)}
              className={`filter-button ${filtro === tipo ? 'active' : ''}`}
              style={filtro === tipo ? { background: obtenerColor(tipo) } : {}}
            >
              {tipo.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      <Card>
        {actividadesFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div className="empty-title">No hay actividad</div>
            <div className="empty-description">
              {filtro === 'todas' 
                ? 'Todavía no hay actividad registrada en tus equipos'
                : 'No hay actividad de este tipo'}
            </div>
          </div>
        ) : (
          <div className="timeline" ref={timelineRef}>
            {actividadesFiltradas.map((a) => (
              <div 
                key={a.id} 
                className="activity-item timeline-item"
              >
                <div 
                  className="dot" 
                  style={{ 
                    background: obtenerColor(a.tipo),
                    boxShadow: `0 0 0 4px var(--bg-secondary), 0 0 0 5px ${obtenerColor(a.tipo)}20`
                  }}
                />
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    marginBottom: 4
                  }}>
                    <div className="timeline-title" style={{ fontSize: 15 }}>
                      {a.descripcion || a.tipo.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    marginTop: 6
                  }}>
                    <div className="timeline-sub">
                      {formatearFecha(a.createdAt)}
                    </div>
                    {a.tipo && (
                      <span 
                        className="badge"
                        style={{ 
                          background: `${obtenerColor(a.tipo)}20`,
                          color: obtenerColor(a.tipo),
                          fontSize: 11,
                          padding: '3px 8px'
                        }}
                      >
                        {a.tipo.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {a.metadata && Object.keys(a.metadata).length > 0 && (
                    <div className="metadata-box">
                      {JSON.stringify(a.metadata, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Estadísticas */}
      {items.length > 0 && (
        <div className="stats-grid">
          <Card>
            <div className="stat-card-content">
              <div className="stat-number">
                {items.length}
              </div>
              <div className="stat-label">
                Total de actividades
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-number" style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
                {tiposUnicos.length}
              </div>
              <div className="stat-label">
                Tipos de actividad
              </div>
            </div>
          </Card>

          <Card>
            <div className="stat-card-content">
              <div className="stat-number" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                {items.filter(a => {
                  const diff = new Date() - new Date(a.createdAt)
                  return diff < 86400000 // últimas 24 horas
                }).length}
              </div>
              <div className="stat-label">
                Últimas 24 horas
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}