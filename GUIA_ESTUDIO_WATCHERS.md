# Guía de Estudio: Sistema de Watchers, Suscripciones y Desuscripciones

Esta guía lista todas las clases, funciones y componentes relacionados con el sistema de watchlist para que puedas estudiarlos uno por uno.

---

## 📁 BACKEND

### 1. MODELOS (Base de Datos)

#### **TaskWatcher** (`src/models/taskWatcher.js`)
**¿Qué es?** Modelo Sequelize que representa la relación de suscripción entre un usuario y una tarea.

**Campos:**
- `id` (UUID): Identificador único del watcher
- `taskId` (UUID): ID de la tarea a la que está suscrito
- `userId` (UUID): ID del usuario suscrito
- `createdAt`: Fecha de suscripción

**Características importantes:**
- **Constraint único**: No puede haber dos suscripciones iguales (taskId + userId)
- **Índices**: Optimizados para búsquedas por tarea y por usuario
- **Relaciones**:
  - Pertenece a `Tarea` (onDelete: CASCADE - si se elimina la tarea, se eliminan sus watchers)
  - Pertenece a `Usuario`
  - Tiene muchas `TaskWatcherNotification`

**Pregunta clave:** ¿Qué pasa si se elimina una tarea? Se eliminan automáticamente todos sus watchers (CASCADE).

---

#### **TaskWatcherNotification** (`src/models/taskWatcherNotification.js`)
**¿Qué es?** Modelo que almacena las notificaciones generadas para los watchers cuando ocurre un evento en una tarea.

**Campos:**
- `id` (UUID): Identificador único
- `watcherId` (UUID): ID del watcher relacionado
- `userId` (UUID): ID del usuario que recibirá la notificación
- `taskId` (UUID): ID de la tarea
- `eventType` (ENUM): Tipo de evento que generó la notificación
  - Valores posibles: `statusChange`, `priorityChange`, `comment`, `assignment`, `dueDateChange`, `titleChange`
- `payload` (JSON): Información adicional del evento (ej: estado anterior y nuevo)
- `readAt` (DATE, nullable): Fecha en que se marcó como leída (null = no leída)
- `createdAt`: Fecha de creación

**Índices optimizados:**
- `[userId, readAt]`: Para contar notificaciones no leídas rápidamente
- `[taskId]`: Para obtener notificaciones de una tarea
- `[watcherId]`: Para obtener notificaciones de un watcher específico

**Pregunta clave:** ¿Cómo sabemos si una notificación está leída? Si `readAt` es `null`, está no leída.

---

### 2. SERVICIO

#### **NotificationService** (`src/services/notificationService.js`)
**¿Qué es?** Clase estática que contiene la lógica de negocio para notificaciones y validaciones de suscripciones.

#### **Métodos:**

##### `crearNotificacionesParaWatchers({ taskId, eventType, payload, excludeUserId })`
**¿Qué hace?** Crea notificaciones para todos los watchers de una tarea cuando ocurre un evento.

**Parámetros:**
- `taskId`: ID de la tarea
- `eventType`: Tipo de evento (statusChange, comment, etc.)
- `payload`: Datos adicionales del evento
- `excludeUserId`: Usuario que NO debe recibir notificación (el que hizo el cambio)

**Lógica:**
1. Busca todos los watchers de la tarea (excepto el que hizo el cambio)
2. Crea una notificación para cada watcher
3. Retorna el array de notificaciones creadas

**Pregunta clave:** ¿Por qué se excluye al usuario que hizo el cambio? Para evitar auto-notificaciones.

---

##### `puedeSuscribirse(usuarioId, taskId, equipoId)`
**¿Qué hace?** Valida si un usuario puede suscribirse a una tarea.

**Validaciones:**
1. **Pertenencia al equipo**: El usuario debe ser miembro activo del equipo de la tarea
2. **No estar ya suscrito**: No puede haber una suscripción duplicada
3. **Límite de watchers**: Máximo 50 watchers por tarea (configurable con `MAX_WATCHERS_PER_TASK`)

**Retorna:**
- `{ puede: true }` si puede suscribirse
- `{ puede: false, razon: "mensaje" }` si no puede, con la razón

**Pregunta clave:** ¿Cuáles son las 3 validaciones que se hacen antes de suscribirse?

---

##### `obtenerConteoNoLeidas(usuarioId)`
**¿Qué hace?** Cuenta cuántas notificaciones no leídas tiene un usuario.

**Lógica:** Cuenta registros donde `userId` coincide y `readAt` es `null`.

---

### 3. CONTROLADOR

#### **WatcherController** (`src/controllers/watcherController.js`)
**¿Qué es?** Clase con métodos estáticos que manejan las peticiones HTTP relacionadas con watchers.

#### **Métodos:**

##### `listarWatchers(req, res)`
**Endpoint:** `GET /tareas/:tareaId/watchers`

**¿Qué hace?** Lista todos los usuarios suscritos a una tarea específica.

**Flujo:**
1. Valida que la tarea exista (404 si no existe)
2. Busca todos los watchers de esa tarea
3. Incluye datos del usuario (nombre, email, avatar)
4. Ordena por fecha de suscripción (más antiguos primero)
5. Retorna DTO con solo información necesaria (sin datos sensibles)

**Código HTTP:** 200 (éxito), 404 (tarea no encontrada), 422 (UUID inválido)

**Pregunta clave:** ¿Qué información se incluye en el DTO? Solo: id, userId, name, email, avatar, createdAt.

---

##### `suscribirse(req, res)`
**Endpoint:** `POST /tareas/:tareaId/watchers`

**¿Qué hace?** Suscribe al usuario autenticado a una tarea.

**Flujo:**
1. Obtiene `tareaId` de los parámetros y `usuarioId` del token JWT
2. Valida que la tarea exista (404)
3. Llama a `NotificationService.puedeSuscribirse()` para validar
4. Si no puede, retorna 409 con la razón
5. Crea el registro `TaskWatcher`
6. Registra la actividad en el historial
7. Retorna 201 con los datos del watcher creado

**Código HTTP:** 
- 201 (creado exitosamente)
- 404 (tarea no encontrada)
- 409 (conflicto: ya está suscrito, no pertenece al equipo, límite alcanzado)
- 422 (UUID inválido)
- 500 (error del servidor)

**Manejo de errores:**
- Si hay `SequelizeUniqueConstraintError` → 409 (ya está suscrito)

**Pregunta clave:** ¿Qué código HTTP se usa cuando ya estás suscrito? 409 (Conflict).

---

##### `desuscribirse(req, res)`
**Endpoint:** `DELETE /tareas/:tareaId/watchers`

**¿Qué hace?** Desuscribe al usuario autenticado de una tarea.

**Flujo:**
1. Obtiene `tareaId` y `usuarioId`
2. Valida que la tarea exista (404)
3. Busca el watcher del usuario para esa tarea
4. Si no existe, retorna 404
5. Elimina el registro `TaskWatcher`
6. Registra la actividad
7. Retorna 204 (No Content - sin cuerpo)

**Código HTTP:**
- 204 (éxito sin contenido)
- 404 (tarea no encontrada o no está suscrito)
- 422 (UUID inválido)

**Pregunta clave:** ¿Por qué se retorna 204 en lugar de 200? Porque DELETE exitoso no necesita retornar contenido.

---

##### `obtenerWatchlist(req, res)`
**Endpoint:** `GET /watchlist`

**¿Qué hace?** Obtiene todas las tareas a las que el usuario está suscrito, con paginación y filtros.

**Query Parameters:**
- `status`: Filtrar por estado (pendiente, en_curso, finalizada, cancelada)
- `teamId`: Filtrar por equipo
- `updatedSince`: Filtrar tareas actualizadas desde esta fecha
- `ordenarPor`: Campo de ordenamiento (solo `updatedAt`)
- `direccion`: ASC o DESC
- `pagina`: Número de página
- `limite`: Registros por página (1-100)

**Flujo:**
1. Obtiene todos los `taskId` de los watchers del usuario
2. Si no hay watchers, retorna array vacío
3. Aplica filtros a las tareas
4. Busca las tareas con paginación
5. Obtiene notificaciones no leídas para cada tarea
6. Agrupa notificaciones por tarea
7. Retorna DTO con tareas y paginación

**DTO de respuesta incluye:**
- `unreadNotifications`: Cantidad de notificaciones no leídas
- `notifications`: Array con las últimas notificaciones (con detalles)
- Información de paginación

---

##### `marcarNotificacionesLeidas(req, res)`
**Endpoint:** `PUT /tareas/:tareaId/notificaciones/leer`

**¿Qué hace?** Marca todas las notificaciones no leídas de una tarea como leídas.

**Flujo:**
1. Valida que la tarea exista (404)
2. Verifica que el usuario esté suscrito (404 si no)
3. Actualiza todas las notificaciones donde `readAt` es `null`
4. Retorna cantidad de notificaciones marcadas

**Código HTTP:** 200 (éxito), 404 (tarea no encontrada o no está suscrito)

**Pregunta clave:** ¿Qué campo se actualiza para marcar como leída? `readAt` se establece a la fecha actual.

---

##### `obtenerConteoNotificaciones(req, res)`
**Endpoint:** `GET /notificaciones/conteo`

**¿Qué hace?** Obtiene el número total de notificaciones no leídas del usuario.

**Flujo:**
1. Obtiene `usuarioId` del token
2. Llama a `NotificationService.obtenerConteoNoLeidas()`
3. Retorna el conteo

**Código HTTP:** 200

---

### 4. RUTAS

#### **watchers.js** (`src/routes/watchers.js`)
**¿Qué es?** Define las rutas HTTP y aplica middlewares de validación y autenticación.

**Rutas definidas:**
1. `GET /tareas/:tareaId/watchers` → `listarWatchers`
2. `POST /tareas/:tareaId/watchers` → `suscribirse`
3. `DELETE /tareas/:tareaId/watchers` → `desuscribirse`
4. `GET /watchlist` → `obtenerWatchlist`
5. `PUT /tareas/:tareaId/notificaciones/leer` → `marcarNotificacionesLeidas`
6. `GET /notificaciones/conteo` → `obtenerConteoNotificaciones`

**Middlewares aplicados:**
- `auth`: Todas las rutas requieren autenticación JWT
- `validaciones.validarUUID('tareaId')`: Valida que tareaId sea UUID válido
- `validaciones.validarQueryWatchlist`: Valida query parameters de watchlist
- `manejarValidacion`: Procesa errores de validación

**Pregunta clave:** ¿Todas las rutas requieren autenticación? Sí, todas usan `router.use(auth)`.

---

### 5. VALIDACIONES

#### **validarQueryWatchlist** (`src/utils/validations.js`)
**¿Qué hace?** Valida los query parameters del endpoint de watchlist.

**Validaciones:**
- `status`: Debe ser uno de: pendiente, en_curso, finalizada, cancelada
- `teamId`: Debe ser UUID válido
- `updatedSince`: Debe ser fecha ISO8601 válida
- `ordenarPor`: Solo permite `updatedAt`
- `direccion`: Solo permite `ASC` o `DESC`
- `pagina`: Entero mayor a 0
- `limite`: Entero entre 1 y 100

**Pregunta clave:** ¿Cuál es el límite máximo de registros por página? 100.

---

## 📁 FRONTEND

### 1. COMPONENTES

#### **WatchToggleButton** (`src/components/WatchToggleButton.jsx`)
**¿Qué es?** Botón que permite suscribirse/desuscribirse de una tarea.

**Props:**
- `taskId`: ID de la tarea
- `isWatching`: Si el usuario ya está suscrito
- `onToggle`: Callback cuando cambia el estado

**Estado:**
- `isWatching`: Estado de suscripción
- `loading`: Si está procesando la petición

**Funcionalidad:**
- Si `isWatching` es `true`, no muestra el botón (ya está suscrito)
- Al hacer clic:
  - Si está suscrito → DELETE `/tareas/:taskId/watchers`
  - Si no está suscrito → POST `/tareas/:taskId/watchers`
- Muestra toasts de éxito/error (NO usa alerts)
- Actualiza el estado local y llama `onToggle`

**Pregunta clave:** ¿Por qué no se muestra el botón si ya está suscrito? Porque solo se usa para suscribirse, no para desuscribirse.

---

#### **WatcherList** (`src/components/WatcherList.jsx`)
**¿Qué es?** Componente que muestra la lista completa de usuarios suscritos a una tarea.

**Props:**
- `taskId`: ID de la tarea
- `onWatchersLoaded`: Callback cuando se cargan los watchers

**Estado:**
- `watchers`: Array de watchers
- `loading`: Estado de carga
- `error`: Mensaje de error

**Funcionalidad:**
1. Carga watchers al montar o cuando cambia `taskId`
2. Usa `useRef` para evitar llamadas duplicadas
3. Muestra `WatcherAvatarGroup` con los primeros watchers
4. Muestra lista completa con nombres y fechas
5. Maneja errores 404 (tarea sin watchers) y 400 (validación)

**Optimizaciones:**
- Evita recargas innecesarias con `loadingRef` y `lastLoadedTaskIdRef`
- Limpia espacios en `taskId`

**Pregunta clave:** ¿Cómo evita llamadas duplicadas? Usando `useRef` para rastrear si ya está cargando o si ya se cargó ese taskId.

---

#### **WatcherAvatarGroup** (`src/components/WatcherAvatarGroup.jsx`)
**¿Qué es?** Componente que muestra avatares de watchers en grupo (como círculos superpuestos).

**Props:**
- `watchers`: Array de watchers
- `maxVisible`: Máximo de avatares visibles (default: 5)

**Funcionalidad:**
- Muestra los primeros `maxVisible` avatares
- Si hay más, muestra un círculo con "+N"
- Genera colores automáticos basados en el nombre
- Muestra iniciales si no hay avatar
- Muestra contador total de suscriptores

**Pregunta clave:** ¿Cómo se generan los colores? Basándose en el primer carácter del nombre usando módulo.

---

#### **WatchlistTable** (`src/components/WatchlistTable.jsx`)
**¿Qué es?** Tabla principal que muestra todas las tareas a las que el usuario está suscrito.

**Estado:**
- `tareas`: Array de tareas suscritas
- `loading`: Estado de carga
- `equipos`: Lista de equipos (para filtros)
- `filters`: Filtros activos (status, teamId, ordenarPor, direccion)
- `pagination`: Información de paginación

**Funcionalidad:**

**Carga de datos:**
- `loadWatchlist()`: Carga tareas con filtros y paginación
- `loadEquipos()`: Carga equipos para el filtro de equipo
- Se recarga cuando cambian filtros o página

**Filtros:**
- Estado (pendiente, en_curso, finalizada, cancelada)
- Equipo
- Ordenamiento (por fecha de actualización, ASC/DESC)
- Botón para limpiar filtros

**Acciones:**
- `handleUnwatch(taskId)`: Desuscribe de una tarea (DELETE)
- `handleMarkAsRead(taskId)`: Marca notificaciones como leídas (PUT)

**Visualización:**
- Badges de estado y prioridad
- Indicador de tarea vencida (`isOverdue`)
- Contador de notificaciones no leídas (círculo rojo)
- Muestra últimas 3 notificaciones con detalles
- Paginación si hay más de una página

**Manejo de errores:**
- Usa toasts (NO alerts) para mostrar errores
- Muestra estado de carga

**Pregunta clave:** ¿Qué información muestra de cada notificación? Tipo de evento, payload (datos del cambio), y fecha.

---

### 2. PÁGINAS

#### **Watchlist** (`src/pages/Watchlist.jsx`)
**¿Qué es?** Página que contiene el componente `WatchlistTable`.

**Funcionalidad:**
- Layout simple con título y descripción
- Renderiza `WatchlistTable`

---

## 🔄 FLUJOS COMPLETOS

### Flujo 1: Suscribirse a una tarea

1. **Frontend:** Usuario hace clic en "Suscribirse" en `WatchToggleButton`
2. **Frontend:** Se hace POST `/tareas/:taskId/watchers`
3. **Backend:** `WatcherController.suscribirse()`:
   - Valida que la tarea exista
   - Llama `NotificationService.puedeSuscribirse()`
   - Crea `TaskWatcher`
   - Registra actividad
   - Retorna 201
4. **Frontend:** Muestra toast de éxito, actualiza estado

**Pregunta clave:** ¿Qué validaciones se hacen antes de crear el watcher?

---

### Flujo 2: Cambio en tarea genera notificaciones

1. **Backend:** Se actualiza una tarea (ej: cambio de estado)
2. **Modelo Tarea:** Hook `afterUpdate` detecta el cambio
3. **Hook:** Llama `NotificationService.crearNotificacionesParaWatchers()`
4. **Servicio:** Busca todos los watchers (excepto el que hizo el cambio)
5. **Servicio:** Crea `TaskWatcherNotification` para cada watcher
6. **Frontend:** Al cargar watchlist, muestra contador de no leídas

**Pregunta clave:** ¿Qué tipos de cambios generan notificaciones? statusChange, priorityChange, comment, assignment, dueDateChange, titleChange.

---

### Flujo 3: Marcar notificaciones como leídas

1. **Frontend:** Usuario hace clic en "Marcar leído" en `WatchlistTable`
2. **Frontend:** Se hace PUT `/tareas/:taskId/notificaciones/leer`
3. **Backend:** `WatcherController.marcarNotificacionesLeidas()`:
   - Valida que la tarea exista y que esté suscrito
   - Actualiza `readAt` a fecha actual para todas las no leídas
   - Retorna cantidad actualizada
4. **Frontend:** Recarga watchlist, actualiza contador

**Pregunta clave:** ¿Qué campo se actualiza para marcar como leída? `readAt`.

---

## 📝 CONCEPTOS CLAVE PARA EL EXAMEN

### DTOs (Data Transfer Objects)
- Solo incluyen información necesaria
- NO exponen datos sensibles (contraseñas, tokens, etc.)
- Ejemplo: Watcher DTO incluye: id, userId, name, email, avatar, createdAt

### Códigos HTTP
- **201**: Recurso creado (suscripción exitosa)
- **204**: Éxito sin contenido (desuscripción exitosa)
- **409**: Conflicto (ya está suscrito, límite alcanzado, no pertenece al equipo)
- **422**: Error de validación (UUID inválido, parámetros incorrectos)

### Hooks y Listeners
- **Tarea.afterUpdate**: Detecta cambios y genera notificaciones
- **Comentario.afterCreate**: Genera notificación cuando se crea un comentario
- Excluyen al usuario que hace el cambio para evitar auto-notificaciones

### Validaciones
- UUIDs deben ser válidos
- Límite de 50 watchers por tarea
- Usuario debe pertenecer al equipo
- No puede haber suscripciones duplicadas

### Frontend
- Usa toasts (NO alerts) para mensajes
- Estados de carga apropiados
- Manejo de errores con try/catch
- Componentes reutilizables

---

## ❓ PREGUNTAS FRECUENTES PARA ESTUDIAR

1. ¿Qué es un watcher? Un usuario suscrito a una tarea para recibir notificaciones.

2. ¿Qué validaciones se hacen antes de suscribirse?
   - Usuario debe pertenecer al equipo
   - No puede estar ya suscrito
   - No puede superar el límite de 50 watchers por tarea

3. ¿Qué código HTTP se usa cuando ya estás suscrito? 409 (Conflict)

4. ¿Cómo se generan las notificaciones? Automáticamente mediante hooks en los modelos cuando ocurre un cambio.

5. ¿Qué tipos de eventos generan notificaciones?
   - statusChange, priorityChange, comment, assignment, dueDateChange, titleChange

6. ¿Cómo se marca una notificación como leída? Actualizando el campo `readAt` con la fecha actual.

7. ¿Por qué se excluye al usuario que hace el cambio? Para evitar auto-notificaciones.

8. ¿Qué es un DTO? Un objeto que solo incluye información necesaria, sin datos sensibles.

9. ¿Qué pasa si se elimina una tarea? Se eliminan automáticamente todos sus watchers (CASCADE).

10. ¿Cómo funciona la paginación en watchlist? Se usa `pagina` y `limite` como query parameters, y se retorna información de paginación en la respuesta.

---

¡Buena suerte en tu examen! 🎓

