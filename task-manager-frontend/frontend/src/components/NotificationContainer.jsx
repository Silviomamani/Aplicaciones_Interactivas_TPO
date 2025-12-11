import { useNotifications } from '../context/NotificationContext.jsx'
import Button from './Button.jsx'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-icon">
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'warning' && '!'}
            {notification.type === 'info' && 'i'}
          </div>
          <div className="notification-content">
            <div className="notification-title">{notification.title}</div>
            {notification.message && (
              <div className="notification-message">{notification.message}</div>
            )}
          </div>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation()
              removeNotification(notification.id)
            }}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

