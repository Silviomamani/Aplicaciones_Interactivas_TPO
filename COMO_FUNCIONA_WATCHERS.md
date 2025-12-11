# 📖 Cómo Funciona el Sistema de Watchers y Notificaciones

## 🎯 Concepto Principal

**Watchers (Suscriptores)** son usuarios que se suscriben a una tarea para recibir notificaciones cuando algo cambia, aunque NO estén asignados a esa tarea.

### Diferencia entre Asignado y Watcher:

- **Asignado (`asignadoA`)**: La persona responsable de completar la tarea
- **Watcher**: Cualquier miembro del equipo que quiere estar informado de los cambios

## 🔄 Flujo Completo

### 1. **Crear una Tarea**
Cuando creas una tarea, puedes asignarla a alguien (`asignadoA`), pero esto NO crea un watcher automáticamente.

### 2. **Suscribirse a una Tarea**
Cualquier miembro del equipo puede suscribirse:

1. **Ir a la página de detalles de la tarea**:
   - Desde la lista de tareas: click en "Ver" o en el título
   - Desde el tablero Kanban: click en la tarjeta
   - URL: `/tareas/:id`

2. **Ver la sección "Suscriptores"**:
   - Muestra todos los usuarios suscritos (con avatares)
   - Muestra un botón "Suscribirse" o "Desuscribirse"

3. **Hacer click en "Suscribirse"**:
   - El botón cambia a "Desuscribirse"
   - Tu avatar aparece en la lista de suscriptores
   - Ahora recibirás notificaciones automáticas

### 3. **Notificaciones Automáticas**
Cuando ocurre un cambio en la tarea, el sistema automáticamente:

1. **Detecta el cambio** (mediante hooks en Sequelize):
   - Cambio de estado (pendiente → en_curso)
   - Cambio de prioridad (media → alta)
   - Nuevo comentario
   - Cambio de asignación
   - Cambio de fecha límite
   - Cambio de título

2. **Crea notificaciones** para TODOS los watchers:
   - Busca todos los usuarios suscritos a esa tarea
   - Crea un registro en `TaskWatcherNotification` para cada uno
   - Excluye al usuario que hizo el cambio (no se notifica a sí mismo)

3. **Almacena la notificación** con:
   - Tipo de evento (`statusChange`, `priorityChange`, `comment`, etc.)
   - Datos del cambio (payload)
   - Fecha de creación
   - Estado de lectura (`readAt` = null si no leída)

### 4. **Ver Notificaciones**

**Opción A: Badge en el menú**
- En el menú lateral, el enlace "Watchlist" muestra un badge rojo con el número de notificaciones no leídas
- Se actualiza automáticamente cada 30 segundos

**Opción B: Página Watchlist**
- Ir a `/watchlist` desde el menú
- Ver todas las tareas a las que estás suscrito
- Cada tarea muestra un badge con el número de notificaciones no leídas
- Puedes filtrar por estado, equipo, fecha de actualización

**Opción C: En la tarea específica**
- Al abrir una tarea, puedes ver si tienes notificaciones no leídas
- Botón "Marcar como leído" para limpiar las notificaciones

### 5. **Marcar como Leído**
- Click en "Marcar como leído" en la watchlist o en la tarea
- Actualiza el campo `readAt` de las notificaciones
- El badge desaparece

## 📊 Estructura de Datos

### TaskWatcher (Tabla: `task_watchers`)
```javascript
{
  id: UUID,
  taskId: UUID,      // ID de la tarea
  userId: UUID,     // ID del usuario suscrito
  createdAt: Date,
  updatedAt: Date
}
```

### TaskWatcherNotification (Tabla: `task_watcher_notifications`)
```javascript
{
  id: UUID,
  watcherId: UUID,           // Referencia al watcher
  userId: UUID,               // Usuario que recibirá la notificación
  taskId: UUID,               // Tarea relacionada
  eventType: String,          // 'statusChange', 'priorityChange', 'comment', etc.
  payload: JSON,              // Datos del cambio (ej: { estadoAnterior: 'pendiente', estadoNuevo: 'en_curso' })
  readAt: Date | null,        // null = no leída, Date = fecha de lectura
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Interfaz de Usuario

### En TaskDetails (`/tareas/:id`):
```
┌─────────────────────────────────┐
│ Título de la Tarea              │
│ Estado: en_curso                │
│ Asignado: Juan Pérez            │
│ Prioridad: alta                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Suscriptores    [Suscribirse]   │
│                                 │
│ 👤 👤 👤 +2   5 suscriptores    │
│                                 │
│ Lista completa:                 │
│ 👤 Juan Pérez   10/12/2025      │
│ 👤 María García  11/12/2025     │
└─────────────────────────────────┘
```

### En Watchlist (`/watchlist`):
```
┌─────────────────────────────────────────────┐
│ Mi Watchlist                                 │
│                                             │
│ [Filtros: Estado ▼] [Fecha desde] [Limpiar]│
│                                             │
│ Título      │ Equipo │ Estado │ 🔴 3 │ ... │
│ Tarea 1     │ Dev    │ En curso│     │ ... │
│ Tarea 2     │ Design │ Pendiente│     │ ... │
└─────────────────────────────────────────────┘
```

## 🔧 Endpoints de la API

### Suscribirse
```http
POST /api/v1/tareas/:tareaId/watchers
```

### Desuscribirse
```http
DELETE /api/v1/tareas/:tareaId/watchers
```

### Listar watchers de una tarea
```http
GET /api/v1/tareas/:tareaId/watchers
```

### Obtener mi watchlist (con filtros)
```http
GET /api/v1/watchlist?status=en_curso&teamId=xxx&updatedSince=2025-12-01
```

### Marcar notificaciones como leídas
```http
PUT /api/v1/tareas/:tareaId/notificaciones/leer
```

### Contar notificaciones no leídas
```http
GET /api/v1/notificaciones/conteo
```

## ⚙️ Configuración

### Variables de Entorno
```env
MAX_WATCHERS_PER_TASK=50  # Límite de suscriptores por tarea
```

### Reglas de Negocio
1. ✅ Solo miembros del equipo pueden suscribirse
2. ✅ Máximo 50 watchers por tarea (configurable)
3. ✅ No puedes suscribirte dos veces a la misma tarea
4. ✅ Puedes desuscribirte y volver a suscribirte después
5. ✅ El usuario que hace el cambio NO recibe notificación (no se notifica a sí mismo)

## 🚀 Ejemplo de Uso

1. **Juan crea una tarea** "Implementar login" y la asigna a **María**
2. **Pedro** (miembro del mismo equipo) quiere estar informado
3. **Pedro** va a `/tareas/123` y hace click en "Suscribirse"
4. **María** cambia el estado a "en_curso"
5. **Sistema automáticamente**:
   - Detecta el cambio de estado
   - Crea una notificación para **Pedro** (no para María, porque ella hizo el cambio)
   - Guarda: `{ eventType: 'statusChange', payload: { estadoAnterior: 'pendiente', estadoNuevo: 'en_curso' } }`
6. **Pedro** ve el badge "1" en el menú "Watchlist"
7. **Pedro** va a `/watchlist` y ve la tarea con 1 notificación no leída
8. **Pedro** hace click en "Marcar como leído"
9. El badge desaparece

## 💡 Casos de Uso

- **Project Manager**: Suscribirse a todas las tareas importantes para estar al día
- **Desarrollador**: Suscribirse a tareas relacionadas aunque no esté asignado
- **Diseñador**: Seguir tareas de diseño para ver comentarios y cambios
- **QA**: Suscribirse a tareas para saber cuándo están listas para probar

