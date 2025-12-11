import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotifications } from '../context/NotificationContext.jsx'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Modal from '../components/Modal.jsx'

export default function Teams() {
  const { user } = useAuth()
  const { success, error: showError } = useNotifications()
  const [equipos, setEquipos] = useState([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Crear equipo
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [creando, setCreando] = useState(false)

  // Invitar miembro
  const [mostrarInvitar, setMostrarInvitar] = useState(false)
  const [emailUsuario, setEmailUsuario] = useState('')
  const [invitando, setInvitando] = useState(false)

  // Editar equipo
  const [editando, setEditando] = useState(false)
  const [nombreEditado, setNombreEditado] = useState('')

  // Referencias para animaciones
  const teamsListRef = useRef(null)
  const detailRef = useRef(null)

  useEffect(() => {
    cargarEquipos()
  }, [])

  useEffect(() => {
    if (equipoSeleccionado) {
      cargarMiembros(equipoSeleccionado.id)
      setNombreEditado(equipoSeleccionado.nombre)
    }
  }, [equipoSeleccionado])

  useEffect(() => {
    if (!loading && equipos.length > 0) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        animarEquipos()
      }, 100)
    }
  }, [loading, equipos])

  const animarEquipos = () => {
    if (teamsListRef.current) {
      const items = teamsListRef.current.querySelectorAll('.team-item')
      
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
      
      // Luego aplicar animaciones suaves
      gsap.fromTo(items, 
        {
          opacity: 0.3,
          x: -20
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out'
        }
      )
    }

    if (detailRef.current) {
      // Asegurar visibilidad del detalle
      gsap.set(detailRef.current, { 
        opacity: 1, 
        x: 0,
        clearProps: 'all'
      })
      detailRef.current.style.opacity = '1'
      detailRef.current.style.transform = 'translateX(0)'
      
      // Luego animar
      gsap.fromTo(detailRef.current,
        {
          opacity: 0.3,
          x: 30
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out'
        }
      )
    }
  }

  const cargarEquipos = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/equipos')
      const arr = res?.data?.data?.equipos || []
      setEquipos(arr)
      if (arr.length > 0 && !equipoSeleccionado) {
        setEquipoSeleccionado(arr[0])
      }
    } catch (e) {
      setError('No pudimos cargar los equipos')
    } finally {
      setLoading(false)
    }
  }

  const cargarMiembros = async (equipoId) => {
    try {
      const res = await api.get(`/equipos/${equipoId}/miembros`)
      setMiembros(res?.data?.data?.miembros || [])
    } catch (e) {
      console.error('Error cargando miembros:', e)
    }
  }

  const crearEquipo = async () => {
    if (!nombreNuevo.trim()) return
    setCreando(true)
    try {
      const res = await api.post('/equipos', { nombre: nombreNuevo.trim() })
      const nuevoEquipo = res?.data?.data?.equipo
      setEquipos([nuevoEquipo, ...equipos])
      setEquipoSeleccionado(nuevoEquipo)
      setNombreNuevo('')
      setMostrarCrear(false)
      success('Equipo creado', 'El equipo se creó correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al crear el equipo'
      setError(errorMsg)
      showError('Error', errorMsg)
    } finally {
      setCreando(false)
    }
  }

  const actualizarEquipo = async () => {
    if (!nombreEditado.trim() || !equipoSeleccionado) return
    setEditando(true)
    try {
      const res = await api.put(`/equipos/${equipoSeleccionado.id}`, {
        nombre: nombreEditado.trim()
      })
      const equipoActualizado = res?.data?.data?.equipo
      setEquipos(equipos.map(e => e.id === equipoActualizado.id ? equipoActualizado : e))
      setEquipoSeleccionado(equipoActualizado)
      setEditando(false)
      success('Equipo actualizado', 'El equipo se actualizó correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar el equipo'
      setError(errorMsg)
      showError('Error', errorMsg)
      setEditando(false)
    }
  }

  const invitarMiembro = async () => {
    if (!emailUsuario.trim() || !equipoSeleccionado) return
    setInvitando(true)
    try {
      await api.post(`/equipos/${equipoSeleccionado.id}/miembros`, {
        email: emailUsuario.trim()
      })
      await cargarMiembros(equipoSeleccionado.id)
      setEmailUsuario('')
      setMostrarInvitar(false)
      success('Miembro invitado', 'El miembro se agregó al equipo correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al invitar miembro'
      setError(errorMsg)
      showError('Error', errorMsg)
    } finally {
      setInvitando(false)
    }
  }

  const removerMiembro = async (usuarioId) => {
    if (!equipoSeleccionado) return
    if (!confirm('¿Estás seguro de que querés remover este miembro del equipo?')) return
    
    try {
      await api.delete(`/equipos/${equipoSeleccionado.id}/miembros/${usuarioId}`)
      await cargarMiembros(equipoSeleccionado.id)
      success('Miembro removido', 'El miembro se removió del equipo correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al remover miembro'
      setError(errorMsg)
      showError('Error', errorMsg)
    }
  }

  const eliminarEquipo = async () => {
    if (!equipoSeleccionado) return
    if (!confirm('¿Estás seguro de que querés eliminar este equipo? Esta acción no se puede deshacer.')) return
    
    try {
      await api.delete(`/equipos/${equipoSeleccionado.id}`)
      const nuevosEquipos = equipos.filter(e => e.id !== equipoSeleccionado.id)
      setEquipos(nuevosEquipos)
      setEquipoSeleccionado(nuevosEquipos.length > 0 ? nuevosEquipos[0] : null)
      success('Equipo eliminado', 'El equipo se eliminó correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar el equipo'
      setError(errorMsg)
      showError('Error', errorMsg)
    }
  }

  const esAdmin = (membresia) => {
    return membresia?.rol === 'admin' || membresia?.usuarioId === equipoSeleccionado?.creadoPor
  }

  const puedeGestionar = equipoSeleccionado && miembros.some(m => 
    m.usuarioId === user?.id && esAdmin(m)
  )

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading">
          <div className="skeleton" style={{ width: 300, height: 40, marginBottom: 24 }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
            <div className="skeleton" style={{ height: 400 }}></div>
            <div className="skeleton" style={{ height: 400 }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Gestión de Equipos</div>
          <p className="page-description">
            Administra tus equipos y colaboradores
          </p>
        </div>
        <Button className="btn-success" onClick={() => setMostrarCrear(true)}>
          Nuevo equipo
        </Button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="teams-layout">
        <Card title="Mis Equipos" style={{ height: 'fit-content', position: 'sticky', top: 24 }}>
          {equipos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <div className="empty-title">No hay equipos</div>
              <div className="empty-description">Creá tu primer equipo para comenzar</div>
              <Button className="btn-success" onClick={() => setMostrarCrear(true)}>
                Crear equipo
              </Button>
            </div>
          ) : (
            <div className="teams-list" ref={teamsListRef}>
              {equipos.map((equipo) => (
                <div
                  key={equipo.id}
                  className={`team-item ${equipoSeleccionado?.id === equipo.id ? 'active' : ''}`}
                  onClick={() => setEquipoSeleccionado(equipo)}
                  style={{ opacity: 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: equipoSeleccionado?.id === equipo.id 
                        ? 'var(--primary)' 
                        : 'var(--bg-tertiary)',
                      color: equipoSeleccionado?.id === equipo.id 
                        ? 'white' 
                        : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }}>
                      {equipo.nombre[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="team-name">{equipo.nombre}</div>
                      <div className="team-meta">
                        {equipo.membresias?.length || 0} {equipo.membresias?.length === 1 ? 'miembro' : 'miembros'}
                      </div>
                    </div>
                  </div>
            </div>
          ))}
            </div>
          )}
        </Card>

        {equipoSeleccionado && (
          <div ref={detailRef} style={{ opacity: 1 }}>
            <Card title="Detalle del equipo">
              <div className="team-detail">
                {/* Información del equipo */}
                <div style={{ 
                  padding: 20, 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: 12,
                  marginBottom: 24
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: 'var(--primary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: 700
                    }}>
                      {equipoSeleccionado.nombre[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input
                        value={nombreEditado}
                        onChange={(e) => setNombreEditado(e.target.value)}
                        disabled={!puedeGestionar || editando}
                        style={{ 
                          fontSize: 20, 
                          fontWeight: 700,
                          background: 'transparent',
                          border: 'none',
                          padding: 0
                        }}
                      />
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {miembros.length} {miembros.length === 1 ? 'miembro' : 'miembros'}
                      </div>
                    </div>
                  </div>
                  {puedeGestionar && nombreEditado !== equipoSeleccionado.nombre && (
                    <Button 
                      className="btn-success"
                      onClick={actualizarEquipo} 
                      disabled={editando}
                      style={{ width: '100%' }}
                    >
                      {editando ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  )}
                </div>

                {/* Miembros */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: 16
                  }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                      Miembros del equipo
                    </h3>
                    {puedeGestionar && (
                      <Button 
                        variant="secondary"
                        onClick={() => setMostrarInvitar(true)}
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        Invitar
                      </Button>
                    )}
                  </div>
                  <div className="members-list">
                    {miembros.length === 0 ? (
                      <div className="empty-state-small">
                        <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                        No hay miembros en este equipo
                      </div>
                    ) : (
                      miembros.map((membresia) => (
                        <div key={membresia.id} className="member-item" style={{ opacity: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--primary), var(--success))',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              fontWeight: 700
                            }}>
                              {(membresia.usuario?.nombre || membresia.usuario?.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="member-info">
                              <strong style={{ fontSize: 15 }}>
                                {membresia.usuario?.nombre || membresia.usuario?.email || 'Usuario'}
                              </strong>
                              <span className="member-role">
                                {esAdmin(membresia) ? 'Administrador' : 'Miembro'}
                              </span>
                            </div>
                          </div>
                          {puedeGestionar && membresia.usuarioId !== user?.id && (
                            <Button
                              className="btn-danger"
                              onClick={() => removerMiembro(membresia.usuarioId)}
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Zona de peligro */}
                {puedeGestionar && (
                  <div style={{ 
                    padding: 20, 
                    background: '#fee2e2', 
                    borderRadius: 12,
                    border: '1px solid #fecaca'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: 16, 
                      fontWeight: 600,
                      color: '#991b1b'
                    }}>
                      Zona de Peligro
                    </h4>
                    <p style={{ 
                      margin: '0 0 16px 0', 
                      fontSize: 13, 
                      color: '#991b1b',
                      lineHeight: 1.5
                    }}>
                      Eliminar este equipo borrará todas las tareas, miembros y datos asociados. Esta acción no se puede deshacer.
                    </p>
                    <Button
                      className="btn-danger"
                      onClick={eliminarEquipo}
                      style={{ width: '100%' }}
                    >
                      Eliminar equipo permanentemente
                    </Button>
                  </div>
                )}
        </div>
      </Card>
          </div>
        )}
      </div>

      {/* Modal crear equipo */}
      <Modal
        open={mostrarCrear}
        title="Crear nuevo equipo"
        onClose={() => {
          setMostrarCrear(false)
          setNombreNuevo('')
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Input
            label="Nombre del equipo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Ej: Equipo de Desarrollo"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && !creando && nombreNuevo.trim() && crearEquipo()}
          />
          <div className="field-hint">
            Elegí un nombre descriptivo para tu equipo
          </div>
        </div>
        <div className="modal-actions">
          <Button 
            className="btn-success"
            onClick={crearEquipo} 
            disabled={!nombreNuevo.trim() || creando}
          >
            {creando ? 'Creando...' : 'Crear equipo'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setMostrarCrear(false)
              setNombreNuevo('')
            }}
          >
            Cancelar
          </Button>
        </div>
      </Modal>

      {/* Modal invitar miembro */}
      <Modal
        open={mostrarInvitar}
        title="Invitar miembro"
        onClose={() => {
          setMostrarInvitar(false)
          setEmailUsuario('')
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Input
            label="Email o ID del usuario"
            type="email"
            value={emailUsuario}
            onChange={(e) => setEmailUsuario(e.target.value)}
            placeholder="usuario@ejemplo.com"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && !invitando && emailUsuario.trim() && invitarMiembro()}
          />
          <div className="field-hint">
            Ingresá el email del usuario que querés invitar
          </div>
        </div>
        <div className="modal-actions">
          <Button 
            className="btn-success"
            onClick={invitarMiembro} 
            disabled={!emailUsuario.trim() || invitando}
          >
            {invitando ? 'Invitando...' : 'Enviar invitación'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setMostrarInvitar(false)
              setEmailUsuario('')
            }}
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}