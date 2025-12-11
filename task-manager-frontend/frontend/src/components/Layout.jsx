import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotifications } from '../context/NotificationContext.jsx'
import { useEffect, useState } from 'react'
import api from '../api/client.js'
import NotificationBadge from './NotificationBadge.jsx'

export function Layout() {
  const { user, logout } = useAuth()
  const { success, error, info } = useNotifications()

  // Verificar tareas vencidas o próximas a vencer al cargar
  useEffect(() => {
    if (!user) return

    const verificarTareas = async () => {
      try {
        const res = await api.get('/equipos')
        const equipos = res?.data?.data?.equipos || []
        
        let tareasVencidas = 0
        let tareasProximas = 0

        for (const equipo of equipos) {
          try {
            const resTareas = await api.get(`/tareas/${equipo.id}?limite=100`)
            const tareas = resTareas?.data?.data?.tareas || resTareas?.data?.rows || []
            
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)
            const en7Dias = new Date()
            en7Dias.setDate(hoy.getDate() + 7)

            tareas.forEach(t => {
              if (!t.fechaLimite || t.estado === 'finalizada' || t.estado === 'cancelada') return
              if (t.asignadoA !== user.id) return

              const fecha = new Date(t.fechaLimite)
              fecha.setHours(0, 0, 0, 0)

              if (fecha < hoy) {
                tareasVencidas++
              } else if (fecha >= hoy && fecha <= en7Dias) {
                tareasProximas++
              }
            })
          } catch (e) {
            console.error('Error verificando tareas:', e)
          }
        }

        if (tareasVencidas > 0) {
          error(
            'Tareas vencidas',
            `Tenés ${tareasVencidas} ${tareasVencidas === 1 ? 'tarea vencida' : 'tareas vencidas'}`
          )
        } else if (tareasProximas > 0) {
          info(
            'Tareas próximas',
            `Tenés ${tareasProximas} ${tareasProximas === 1 ? 'tarea próxima' : 'tareas próximas'} a vencer en los próximos 7 días`
          )
        }
      } catch (e) {
        console.error('Error verificando notificaciones:', e)
      }
    }

    verificarTareas()
    // Verificar cada 5 minutos
    const interval = setInterval(verificarTareas, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user, error, info])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Task Manager</div>
        <nav className="nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
          <NavLink to="/tareas" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Tareas</NavLink>
          <NavLink to="/board" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Tablero</NavLink>
          <NavLink to="/equipos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Equipos</NavLink>
          <NavLink to="/etiquetas" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Etiquetas</NavLink>
          <NavLink to="/actividades" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Actividades</NavLink>
          <NavLink 
            to="/watchlist" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            style={{ position: 'relative' }}
          >
            Watchlist
            <NotificationBadge pollingInterval={30000} />
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip" title={user?.email}>{user?.nombre || user?.email}</div>
          <button className="btn ghost" onClick={logout}>Salir</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}


