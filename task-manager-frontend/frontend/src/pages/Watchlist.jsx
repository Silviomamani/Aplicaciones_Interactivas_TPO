import WatchlistTable from '../components/WatchlistTable.jsx'

export default function Watchlist() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Mi Watchlist</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Tareas a las que estás suscrito. Recibirás notificaciones cuando cambien de estado, prioridad o se agreguen comentarios.
      </p>
      <WatchlistTable />
    </div>
  )
}

