const express = require('express');
const EquipoController = require('../controllers/equipoController');
const validaciones = require('../utils/validations');
const manejarValidacion = require('../middleware/validation');
const auth = require('../middleware/auth');
const { verificarAccesoEquipo, verificarAdminEquipo } = require('../middleware/equipoAccess');

const router = express.Router();

router.use(auth);

router.post('/', 
  validaciones.crearEquipo,
  manejarValidacion,
  EquipoController.crear
);

router.get('/', EquipoController.listar);

// Rutas de miembros deben ir antes de las rutas generales de equipo
router.get('/:equipoId/miembros', 
  validaciones.validarUUID('equipoId'),
  manejarValidacion,
  verificarAccesoEquipo,
  EquipoController.listarMiembros
);

router.post('/:equipoId/miembros', 
  validaciones.validarUUID('equipoId'),
  manejarValidacion,
  verificarAccesoEquipo,
  verificarAdminEquipo,
  EquipoController.agregarMiembro
);

router.delete('/:equipoId/miembros/:usuarioId', 
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('usuarioId'),
  manejarValidacion,
  verificarAccesoEquipo,
  verificarAdminEquipo,
  EquipoController.removerMiembro
);

router.put('/:equipoId/miembros/:usuarioId/rol', 
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('usuarioId'),
  manejarValidacion,
  verificarAccesoEquipo,
  verificarAdminEquipo,
  EquipoController.actualizarRol
);

router.get('/:equipoId', 
  validaciones.validarUUID('equipoId'),
  manejarValidacion,
  verificarAccesoEquipo,
  EquipoController.obtener
);

router.put('/:equipoId', 
  validaciones.validarUUID('equipoId'),
  validaciones.crearEquipo,
  manejarValidacion,
  verificarAccesoEquipo,
  verificarAdminEquipo,
  EquipoController.actualizar
);

router.delete('/:equipoId', 
  validaciones.validarUUID('equipoId'),
  manejarValidacion,
  verificarAccesoEquipo,
  verificarAdminEquipo,
  EquipoController.eliminar
);

module.exports = router;