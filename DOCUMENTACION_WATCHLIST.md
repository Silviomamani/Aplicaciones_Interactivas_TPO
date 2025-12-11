# Documentación del Sistema de Watchlist y Notificaciones

## Descripción General

El sistema de watchlist permite a los usuarios suscribirse a tareas específicas y recibir notificaciones cuando ocurren cambios relevantes (cambio de estado, prioridad, comentarios, etc.). El sistema está implementado siguiendo los estándares REST y utiliza códigos HTTP apropiados.

## Arquitectura

### Backend

#### Modelos

1. **TaskWatcher**: Representa la relación de suscripción entre un usuario y una tarea
   - Campos: `id`, `taskId`, `userId`
   - Constraints: Unique constraint en `(taskId, userId)`
   - Relaciones: Pertenece a `Tarea` y `Usuario`

2. **TaskWatcherNotification**: Almacena las notificaciones generadas para los watchers
   - Campos: `id`, `watcherId`, `userId`, `taskId`, `eventType`, `payload`, `readAt`, `createdAt`
   - Tipos de eventos: `statusChange`, `priorityChange`, `comment`, `assignment`, `dueDateChange`, `titleChange`
   - Índices optimizados para consultas por usuario y tarea

#### Hooks y Listeners

El sistema utiliza hooks de Sequelize para generar notificaciones automáticamente:

- **Modelo Tarea** (`afterUpdate`): Detecta cambios en estado, prioridad, asignación, fecha límite y título
- **Modelo Comentario** (`afterCreate`): Genera notificaciones cuando se agrega un comentario

Los hooks excluyen al usuario que realiza el cambio para evitar auto-notificaciones.

#### Servicios

- **NotificationService**: 
  - `crearNotificacionesParaWatchers()`: Crea notificaciones para todos los watchers de una tarea
  - `puedeSuscribirse()`: Valida si un usuario puede suscribirse (pertenencia al equipo, límite de watchers)
  - `obtenerConteoNoLeidas()`: Obtiene el conteo de notificaciones no leídas

#### Validaciones

- Validación de UUIDs en parámetros de ruta
- Validación de query parameters para watchlist (status, teamId, updatedSince, paginación)
- Límites: máximo 50 watchers por tarea
### Frontend

#### Componentes

1. **WatchlistTable**: Tabla principal que muestra las tareas suscritas
   - Filtros: estado, equipo, ordenamiento
   - Paginación
   - Indicadores de notificaciones no leídas
   - Acciones: desuscribirse, marcar como leído

2. **WatchToggleButton**: Botón para suscribirse/desuscribirse
   - Estados de carga
   - Manejo de errores con toasts

3. **WatcherList**: Lista de usuarios suscritos a una tarea
   - Muestra avatares y nombres
   - Carga asíncrona con manejo de errores

#### Contexto de Notificaciones

- Sistema de toasts para mostrar mensajes de éxito/error
- No utiliza `alert()` ni `window.confirm()`
- Estados de carga apropiados

## Endpoints de la API

### Base URL
```
http://localhost:3000/api/v1
```

### Autenticación

Todos los endpoints requieren autenticación mediante JWT Bearer Token:
```
Authorization: Bearer <token>
```

### 1. Listar Watchers de una Tarea

**GET** `/tareas/{tareaId}/watchers`

Obtiene la lista de usuarios suscritos a una tarea específica.

**Parámetros:**
- `tareaId` (path, UUID): ID de la tarea

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "watchers": [
      {
        "id": "uuid",
        "userId": "uuid",
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "avatar": "J",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 1
  }
}
```

**Códigos de respuesta:**
- `200`: Éxito
- `404`: Tarea no encontrada
- `422`: Error de validación (UUID inválido)

### 2. Suscribirse a una Tarea

**POST** `/tareas/{tareaId}/watchers`

Suscribe al usuario autenticado a una tarea.

**Parámetros:**
- `tareaId` (path, UUID): ID de la tarea

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "watcher": {
      "id": "uuid",
      "userId": "uuid",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "avatar": "J",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  },
  "message": "Te has suscrito a esta tarea exitosamente"
}
```

**Códigos de respuesta:**
- `201`: Suscripción exitosa
- `404`: Tarea no encontrada
- `409`: Ya está suscrito o no puede suscribirse (no pertenece al equipo, límite alcanzado)
- `422`: Error de validación

### 3. Desuscribirse de una Tarea

**DELETE** `/tareas/{tareaId}/watchers`

Desuscribe al usuario autenticado de una tarea.

**Parámetros:**
- `tareaId` (path, UUID): ID de la tarea

**Respuesta exitosa (204):**
Sin contenido (No Content)

**Códigos de respuesta:**
- `204`: Desuscripción exitosa
- `404`: Tarea no encontrada o no está suscrito
- `422`: Error de validación

### 4. Obtener Watchlist (Paginada)

**GET** `/watchlist`

Obtiene la lista de tareas a las que el usuario está suscrito, con paginación y filtros.

**Query Parameters:**
- `status` (opcional): Filtrar por estado (`pendiente`, `en_curso`, `finalizada`, `cancelada`)
- `teamId` (opcional, UUID): Filtrar por equipo
- `updatedSince` (opcional, ISO8601): Filtrar tareas actualizadas desde esta fecha
- `ordenarPor` (opcional): Campo de ordenamiento (solo `updatedAt`)
- `direccion` (opcional): Dirección (`ASC` o `DESC`, default: `DESC`)
- `pagina` (opcional): Número de página (default: 1)
- `limite` (opcional): Registros por página (1-100, default: 10)

**Ejemplo de request:**
```
GET /watchlist?status=en_curso&pagina=1&limite=10&ordenarPor=updatedAt&direccion=DESC
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "tareas": [
      {
        "id": "uuid",
        "titulo": "Implementar feature X",
        "descripcion": "Descripción de la tarea",
        "estado": "en_curso",
        "prioridad": "alta",
        "fechaLimite": "2024-02-01T00:00:00Z",
        "equipo": {
          "id": "uuid",
          "nombre": "Equipo Desarrollo",
          "color": "#3B82F6"
        },
        "creador": {
          "id": "uuid",
          "nombre": "Juan Pérez",
          "avatar": "J"
        },
        "asignado": {
          "id": "uuid",
          "nombre": "María García",
          "avatar": "M"
        },
        "updatedAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-10T08:00:00Z",
        "isOverdue": false,
        "unreadNotifications": 3,
        "notifications": [
          {
            "eventType": "statusChange",
            "payload": {
              "estadoAnterior": "pendiente",
              "estadoNuevo": "en_curso"
            },
            "createdAt": "2024-01-15T10:30:00Z"
          }
        ]
      }
    ],
    "paginacion": {
      "paginaActual": 1,
      "totalPaginas": 5,
      "totalRegistros": 50,
      "registrosPorPagina": 10
    }
  }
}
```

**Códigos de respuesta:**
- `200`: Éxito
- `422`: Error de validación en parámetros

### 5. Marcar Notificaciones como Leídas

**PUT** `/tareas/{tareaId}/notificaciones/leer`

Marca todas las notificaciones no leídas de una tarea como leídas.

**Parámetros:**
- `tareaId` (path, UUID): ID de la tarea

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "notificacionesMarcadas": 5
  },
  "message": "Notificaciones marcadas como leídas"
}
```

**Códigos de respuesta:**
- `200`: Éxito
- `404`: Tarea no encontrada o no está suscrito
- `422`: Error de validación

### 6. Obtener Conteo de Notificaciones No Leídas

**GET** `/notificaciones/conteo`

Obtiene el número total de notificaciones no leídas del usuario autenticado.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "conteo": 12
  }
}
```

**Códigos de respuesta:**
- `200`: Éxito

## DTOs (Data Transfer Objects)

Los DTOs están diseñados para incluir solo la información necesaria, evitando exponer datos sensibles:

- **Watcher DTO**: Incluye `id`, `userId`, `name`, `email`, `avatar`, `createdAt` (no incluye contraseñas u otros datos sensibles)
- **TaskInWatchlist DTO**: Incluye información de la tarea con objetos anidados para `creador` y `asignado` que solo contienen `id`, `nombre`, `avatar`

## Códigos HTTP Utilizados

- `200 OK`: Operación exitosa con respuesta
- `201 Created`: Recurso creado exitosamente (suscripción)
- `204 No Content`: Operación exitosa sin contenido (desuscripción)
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ya suscrito, límite alcanzado, no pertenece al equipo)
- `422 Unprocessable Entity`: Error de validación
- `500 Internal Server Error`: Error del servidor

## Eventos que Generan Notificaciones

1. **statusChange**: Cambio de estado de la tarea
2. **priorityChange**: Cambio de prioridad
3. **comment**: Nuevo comentario agregado
4. **assignment**: Cambio de asignación
5. **dueDateChange**: Cambio de fecha límite
6. **titleChange**: Cambio de título

Cada notificación incluye un `payload` con información relevante del cambio.

## Documentación

La documentación completa de los endpoints está disponible en el archivo `DOCUMENTACION_WATCHLIST.md` que incluye:
- Descripción de todos los endpoints
- Ejemplos de request/response
- Códigos de respuesta
- Autenticación requerida

## Flujo End-to-End

1. **Usuario se suscribe a una tarea:**
   - Frontend: `WatchToggleButton` → POST `/tareas/{id}/watchers`
   - Backend: Valida permisos → Crea `TaskWatcher` → Retorna 201
   - Frontend: Actualiza UI, muestra toast de éxito

2. **Cambio en la tarea (ej: cambio de estado):**
   - Backend: Hook `afterUpdate` detecta cambio → `NotificationService.crearNotificacionesParaWatchers()`
   - Backend: Crea `TaskWatcherNotification` para cada watcher (excepto el que hizo el cambio)
   - Frontend: Al cargar watchlist, muestra contador de notificaciones no leídas

3. **Usuario marca notificaciones como leídas:**
   - Frontend: `WatchlistTable` → PUT `/tareas/{id}/notificaciones/leer`
   - Backend: Actualiza `readAt` en notificaciones → Retorna 200
   - Frontend: Actualiza contador, muestra toast de éxito

## Consideraciones de Consistencia

- Las notificaciones se crean de forma atómica mediante transacciones
- El sistema excluye al usuario que realiza el cambio para evitar auto-notificaciones
- Los límites de watchers por tarea previenen abusos
- Las validaciones aseguran que solo usuarios del equipo puedan suscribirse

## Uso en el Frontend

### Ejemplo: Suscribirse a una tarea

```javascript
import api from '../api/client.js'

try {
  const response = await api.post(`/tareas/${taskId}/watchers`)
  // response.status === 201
  // response.data contiene el watcher creado
  success('Suscripción exitosa', 'Te has suscrito a esta tarea')
} catch (error) {
  if (error.response?.status === 409) {
    error('Error', 'Ya estás suscrito a esta tarea')
  } else if (error.response?.status === 404) {
    error('Error', 'Tarea no encontrada')
  } else {
    error('Error', 'Error al suscribirse')
  }
}
```

### Ejemplo: Obtener watchlist con filtros

```javascript
const params = new URLSearchParams({
  status: 'en_curso',
  pagina: 1,
  limite: 10,
  ordenarPor: 'updatedAt',
  direccion: 'DESC'
})

const response = await api.get(`/watchlist?${params}`)
const tareas = response.data.data.tareas
const paginacion = response.data.data.paginacion
```

## Testing

Para probar los endpoints, puedes usar:

1. **Postman/Insomnia**: Crear requests manualmente siguiendo la documentación
2. **cURL**: Ejemplos disponibles en este documento
3. **Frontend**: La aplicación frontend ya está integrada con todos los endpoints

## Variables de Entorno

- `MAX_WATCHERS_PER_TASK`: Límite de watchers por tarea (default: 50)

