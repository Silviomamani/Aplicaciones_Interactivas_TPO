const express = require('express');
const TareaController = require('../controllers/tareaController');
const validaciones = require('../utils/validations');
const manejarValidacion = require('../middleware/validation');
const auth = require('../middleware/auth');
const { verificarAccesoEquipo } = require('../middleware/equipoAccess');

const router = express.Router();

router.use(auth);

router.post('/:equipoId', 
  validaciones.validarUUID('equipoId'),
  validaciones.crearTarea,
  manejarValidacion,
  verificarAccesoEquipo,
  TareaController.crear
);

router.get('/:equipoId', 
  validaciones.validarUUID('equipoId'),
  validaciones.validarQueryTareas,
  manejarValidacion,
  verificarAccesoEquipo,
  TareaController.listar
);

router.get('/:equipoId/:tareaId', 
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  manejarValidacion,
  verificarAccesoEquipo,
  TareaController.obtener
);

router.put('/:equipoId/:tareaId', 
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  validaciones.actualizarTarea,
  manejarValidacion,
  verificarAccesoEquipo,
  TareaController.actualizar
);

router.delete('/:equipoId/:tareaId', 
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  manejarValidacion,
  verificarAccesoEquipo,
  TareaController.eliminar
);

router.post('/:equipoId/:tareaId/comentarios', 
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  validaciones.crearComentario,
  manejarValidacion,
  verificarAccesoEquipo,
  TareaController.agregarComentario
);

router.delete('/comentarios/:comentarioId', 
  validaciones.validarUUID('comentarioId'),
  manejarValidacion,
  TareaController.eliminarComentario
);

module.exports = router;