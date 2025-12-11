const express = require('express');
const WatcherController = require('../controllers/watcherController');
const validaciones = require('../utils/validations');
const manejarValidacion = require('../middleware/validation');
const auth = require('../middleware/auth');
const { verificarAccesoEquipo } = require('../middleware/equipoAccess');

const router = express.Router();

router.use(auth);

// Listar watchers de una tarea
router.get('/tareas/:tareaId/watchers',
  validaciones.validarUUID('tareaId'),
  manejarValidacion,
  WatcherController.listarWatchers
);

// Suscribirse a una tarea
router.post('/tareas/:tareaId/watchers',
  validaciones.validarUUID('tareaId'),
  manejarValidacion,
  WatcherController.suscribirse
);

// Desuscribirse de una tarea
router.delete('/tareas/:tareaId/watchers',
  validaciones.validarUUID('tareaId'),
  manejarValidacion,
  WatcherController.desuscribirse
);

// Obtener watchlist del usuario (paginada con filtros)
router.get('/watchlist',
  validaciones.validarQueryWatchlist,
  manejarValidacion,
  WatcherController.obtenerWatchlist
);

// Marcar notificaciones de una tarea como leídas
router.put('/tareas/:tareaId/notificaciones/leer',
  validaciones.validarUUID('tareaId'),
  manejarValidacion,
  WatcherController.marcarNotificacionesLeidas
);

// Obtener conteo de notificaciones no leídas
router.get('/notificaciones/conteo',
  WatcherController.obtenerConteoNotificaciones
);

module.exports = router;

