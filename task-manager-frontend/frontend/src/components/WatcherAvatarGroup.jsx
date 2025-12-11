export default function WatcherAvatarGroup({ watchers = [], maxVisible = 5 }) {
  if (!watchers || watchers.length === 0) {
    return <span style={{ color: '#666', fontSize: '0.9em' }}>Sin suscriptores</span>
  }

  const visibleWatchers = watchers.slice(0, maxVisible)
  const remaining = watchers.length - maxVisible

  const getInitials = (name) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  const getAvatarColor = (name) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ]
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
      {visibleWatchers.map((watcher) => (
        <div
          key={watcher.id || watcher.userId}
          title={watcher.name || watcher.email}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: getAvatarColor(watcher.name || watcher.email),
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {watcher.avatar || getInitials(watcher.name || watcher.email)}
        </div>
      ))}
      {remaining > 0 && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#E5E7EB',
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            border: '2px solid white'
          }}
        >
          +{remaining}
        </div>
      )}
      <span style={{ marginLeft: '8px', fontSize: '0.9em', color: '#666' }}>
        {watchers.length} {watchers.length === 1 ? 'suscriptor' : 'suscriptores'}
      </span>
    </div>
  )
}

