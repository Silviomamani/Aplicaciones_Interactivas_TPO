import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'

const COLORES_PREDEFINIDOS = [
  { value: '#ef4444', label: 'Rojo' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#fbbf24', label: 'Amarillo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Gris' }
]

export default function Labels() {
  const [etiquetas, setEtiquetas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [loading, setLoading] = useState(true)

  const labelsRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const resEquipos = await api.get('/equipos')
      const arrEquipos = resEquipos?.data?.data?.equipos || []
      setEquipos(arrEquipos)
      const firstId = arrEquipos[0]?.id
      if (firstId) {
        setEquipoId(firstId)
        const resEti = await api.get(`/etiquetas/${firstId}/etiquetas`)
        const arrEti = resEti?.data?.data?.etiquetas || resEti?.data?.rows || []
        setEtiquetas(Array.isArray(arrEti) ? arrEti : [])
      } else {
        setEtiquetas([])
      }
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (!loading && etiquetas.length > 0) {
      animarEtiquetas()
    }
  }, [loading, etiquetas])

  const animarEtiquetas = () => {
    if (labelsRef.current) {
      const chips = labelsRef.current.querySelectorAll('.chip')
      gsap.from(chips, {
        duration: 0.4,
        scale: 0.8,
        opacity: 0,
        stagger: 0.05,
        ease: 'back.out(1.5)'
      })
    }
  }

  const onChangeEquipo = async (id) => {
    setEquipoId(id)
    if (!id) { setEtiquetas([]); return }
    setLoading(true)
    const resEti = await api.get(`/etiquetas/${id}/etiquetas`)
    const arrEti = resEti?.data?.data?.etiquetas || resEti?.data?.rows || []
    setEtiquetas(Array.isArray(arrEti) ? arrEti : [])
    setLoading(false)
  }

  const crear = async () => {
    if (!nombre.trim()) return
    if (!equipoId) return
    const res = await api.post(`/etiquetas/${equipoId}/etiquetas`, { nombre, color })
    const etiqueta = res?.data?.data?.etiqueta || res?.data
    setEtiquetas((arr) => etiqueta ? [etiqueta, ...arr] : arr)
    setNombre('')
    setColor('#3b82f6')
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">Cargando etiquetas...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Etiquetas</div>
          <p className="page-description">
            Organiza tus tareas con etiquetas personalizadas
          </p>
        </div>
      </div>

      <div className="page-grid">
        {/* Crear etiqueta */}
        <Card title="Nueva etiqueta">
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label className="field-label">Equipo</label>
              <select 
                className="field-input" 
                value={equipoId} 
                onChange={(e) => onChangeEquipo(e.target.value)}
              >
                <option value="">Seleccionar equipo...</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <Input 
                label="Nombre de la etiqueta"
                placeholder="Ej: Urgente, Bug, Feature..." 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && crear()}
              />
            </div>

            <div>
              <label className="field-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {COLORES_PREDEFINIDOS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: c.value,
                      border: color === c.value ? '3px solid var(--text-primary)' : '2px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: color === c.value ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title={c.label}
                  />
                ))}
              </div>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="color-input"
                style={{ width: '100%' }}
              />
            </div>

            <Button 
              className="btn-success"
              onClick={crear} 
              disabled={!equipoId || !nombre.trim()}
              style={{ width: '100%' }}
            >
              Crear etiqueta
            </Button>
          </div>
        </Card>

        {/* Lista de etiquetas */}
        <Card title="Etiquetas existentes">
          {etiquetas.length === 0 ? (
            <div className="empty-state-small">
              <div style={{ fontSize: 48, marginBottom: 12 }}></div>
              {equipoId 
                ? 'No hay etiquetas creadas en este equipo' 
                : 'Seleccioná un equipo para ver sus etiquetas'}
            </div>
          ) : (
            <div className="chips" ref={labelsRef}>
              {etiquetas.map((e) => (
                <span 
                  key={e.id} 
                  className="chip" 
                  style={{backgroundColor: e.color || '#e5e7eb',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: 14,
                    padding: '10px 16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: 'none'
                    }}
                    >
                    {e.nombre}
                    </span>
                    ))}
                    </div>
                    )}
                    </Card>
                    </div>
                    </div>
                    )
                    }