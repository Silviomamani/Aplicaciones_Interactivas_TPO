const express = require('express');
const authRoutes = require('./auth');
const equipoRoutes = require('./equipos');
const tareaRoutes = require('./tareas');
const etiquetaRoutes = require('./etiquetas');
const actividadRoutes = require('./actividad');
const watcherRoutes = require('./watchers');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/equipos', equipoRoutes);
// Las rutas de watchers deben ir ANTES de las rutas de tareas
// porque tienen rutas específicas (/tareas/:tareaId/watchers) que deben
// evaluarse antes de las rutas genéricas de tareas
router.use('/', watcherRoutes);
router.use('/tareas', tareaRoutes);
router.use('/etiquetas', etiquetaRoutes);
router.use('/actividad', actividadRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date()
  });
});

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API disponible, usa rutas como /api/v1/usuarios, /api/v1/tareas',
    version: '1.0.0'
  });
});

module.exports = router;
