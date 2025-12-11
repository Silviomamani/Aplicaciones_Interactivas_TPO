const { TaskWatcher, TaskWatcherNotification, Tarea, Usuario, Equipo, Membresia } = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('../services/notificationService');
const ActividadService = require('../services/actividadService');
const QueryBuilder = require('../utils/queryBuilder');

class WatcherController {
  /**
   * Lista los watchers de una tarea con sus datos básicos, ordenados por fecha de suscripción
   */
  static async listarWatchers(req, res) {
    try {
      const { tareaId } = req.params;

      const tarea = await Tarea.findByPk(tareaId);
      if (!tarea) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      const watchers = await TaskWatcher.findAll({
        where: { taskId: tareaId },
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'avatar']
        }],
        order: [['createdAt', 'ASC']]
      });

      // DTO: Solo incluir información necesaria, sin exponer datos sensibles
      const watchersData = watchers.map(watcher => ({
        id: watcher.id,
        userId: watcher.userId,
        name: watcher.usuario.nombre,
        email: watcher.usuario.email,
        avatar: watcher.usuario.avatar || watcher.usuario.nombre.charAt(0).toUpperCase(),
        createdAt: watcher.createdAt
      }));

      res.json({
        success: true,
        data: {
          watchers: watchersData,
          total: watchersData.length
        }
      });
    } catch (error) {
      console.error('Error listando watchers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar watchers'
      });
    }
  }

  /**
   * Suscribe un usuario a una tarea
   */
  static async suscribirse(req, res) {
    try {
      const { tareaId } = req.params;
      const usuarioId = req.usuario.id;

      const tarea = await Tarea.findByPk(tareaId, {
        include: [{
          model: Equipo,
          as: 'equipo',
          attributes: ['id']
        }]
      });

      if (!tarea) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      // Verificar si puede suscribirse
      const puedeSuscribirse = await NotificationService.puedeSuscribirse(
        usuarioId,
        tareaId,
        tarea.equipoId
      );

      if (!puedeSuscribirse.puede) {
        return res.status(409).json({
          success: false,
          message: puedeSuscribirse.razon
        });
      }

      // Crear el watcher
      const watcher = await TaskWatcher.create({
        taskId: tareaId,
        userId: usuarioId
      });

      // Registrar actividad
      await ActividadService.registrarActividad({
        tipo: 'tarea_editada',
        descripcion: `${req.usuario.nombre} se suscribió a la tarea "${tarea.titulo}"`,
        usuarioId,
        equipoId: tarea.equipoId,
        tareaId: tarea.id
      });

      const watcherCompleto = await TaskWatcher.findByPk(watcher.id, {
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'avatar']
        }]
      });

      // DTO: Solo incluir información necesaria
      res.status(201).json({
        success: true,
        data: {
          watcher: {
            id: watcherCompleto.id,
            userId: watcherCompleto.userId,
            name: watcherCompleto.usuario.nombre,
            email: watcherCompleto.usuario.email,
            avatar: watcherCompleto.usuario.avatar || watcherCompleto.usuario.nombre.charAt(0).toUpperCase(),
            createdAt: watcherCompleto.createdAt
          }
        },
        message: 'Te has suscrito a esta tarea exitosamente'
      });
    } catch (error) {
      console.error('Error suscribiéndose a tarea:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'Ya estás suscrito a esta tarea'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error al suscribirse a la tarea'
      });
    }
  }

  /**
   * Desuscribe un usuario de una tarea
   */
  static async desuscribirse(req, res) {
    try {
      const { tareaId } = req.params;
      const usuarioId = req.usuario.id;

      const tarea = await Tarea.findByPk(tareaId, {
        include: [{
          model: Equipo,
          as: 'equipo',
          attributes: ['id']
        }]
      });

      if (!tarea) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      const watcher = await TaskWatcher.findOne({
        where: {
          taskId: tareaId,
          userId: usuarioId
        }
      });

      if (!watcher) {
        return res.status(404).json({
          success: false,
          message: 'No estás suscrito a esta tarea'
        });
      }

      await watcher.destroy();

      // Registrar actividad
      await ActividadService.registrarActividad({
        tipo: 'tarea_editada',
        descripcion: `${req.usuario.nombre} se desuscribió de la tarea "${tarea.titulo}"`,
        usuarioId,
        equipoId: tarea.equipoId,
        tareaId: tarea.id
      });

      // 204 No Content - respuesta exitosa sin cuerpo
      return res.status(204).send();
    } catch (error) {
      console.error('Error desuscribiéndose de tarea:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desuscribirse de la tarea'
      });
    }
  }

  /**
   * Obtiene la watchlist del usuario con filtros y paginación
   */
  static async obtenerWatchlist(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { status, teamId, updatedSince, ordenarPor, direccion } = req.query;
      const { limit, offset, pagina } = QueryBuilder.buildPagination(req.query.pagina, req.query.limite);

      // Construir where para las tareas
      const whereTarea = {};
      if (status) {
        whereTarea.estado = status;
      }
      if (teamId) {
        whereTarea.equipoId = teamId;
      }
      if (updatedSince) {
        whereTarea.updatedAt = {
          [Op.gte]: new Date(updatedSince)
        };
      }

      // Orden: permitir solo updatedAt y direcciones válidas
      const allowedOrderFields = ['updatedAt'];
      const orderField = allowedOrderFields.includes(ordenarPor) ? ordenarPor : 'updatedAt';
      const orderDirection = ['ASC', 'DESC'].includes((direccion || '').toUpperCase())
        ? direccion.toUpperCase()
        : 'DESC';

      // Obtener los watchers del usuario
      const watchers = await TaskWatcher.findAll({
        where: { userId: usuarioId },
        attributes: ['taskId', 'createdAt']
      });
      
      const taskIds = watchers.map(w => w.taskId);

      if (taskIds.length === 0) {
        return res.json({
          success: true,
          data: {
            tareas: [],
            paginacion: {
              paginaActual: pagina,
              totalPaginas: 0,
              totalRegistros: 0,
              registrosPorPagina: limit
            }
          }
        });
      }

      whereTarea.id = { [Op.in]: taskIds };

      const result = await Tarea.findAndCountAll({
        where: whereTarea,
        include: [
          { model: Usuario, as: 'creador', attributes: ['id', 'nombre', 'email', 'avatar'] },
          { model: Usuario, as: 'asignado', attributes: ['id', 'nombre', 'email', 'avatar'] },
          { model: Equipo, as: 'equipo', attributes: ['id', 'nombre', 'color'] }
        ],
        order: [[orderField, orderDirection]],
        limit,
        offset,
        distinct: true
      });

      // Obtener notificaciones no leídas por tarea con detalles
      const tareaIds = result.rows.map(t => t.id);
      const notificaciones = await TaskWatcherNotification.findAll({
        where: {
          taskId: { [Op.in]: tareaIds },
          userId: usuarioId,
          readAt: null
        },
        attributes: ['taskId', 'eventType', 'payload', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });

      // Agrupar notificaciones por tarea y crear resumen
      const notificacionesMap = {};
      const notificacionesDetalleMap = {};
      
      notificaciones.forEach(n => {
        const taskId = n.taskId;
        notificacionesMap[taskId] = (notificacionesMap[taskId] || 0) + 1;
        
        if (!notificacionesDetalleMap[taskId]) {
          notificacionesDetalleMap[taskId] = [];
        }
        
        notificacionesDetalleMap[taskId].push({
          eventType: n.eventType,
          payload: n.payload,
          createdAt: n.createdAt
        });
      });

      const totalPaginas = Math.ceil(result.count / limit);

      const tareasData = result.rows.map(tarea => {
        const isOverdue = tarea.fechaLimite && new Date(tarea.fechaLimite) < new Date() && tarea.estado !== 'finalizada';
        
        return {
          id: tarea.id,
          titulo: tarea.titulo,
          descripcion: tarea.descripcion,
          estado: tarea.estado,
          prioridad: tarea.prioridad,
          fechaLimite: tarea.fechaLimite,
          equipo: {
            id: tarea.equipo.id,
            nombre: tarea.equipo.nombre,
            color: tarea.equipo.color
          },
          creador: {
            id: tarea.creador.id,
            nombre: tarea.creador.nombre,
            avatar: tarea.creador.avatar
          },
          asignado: tarea.asignado ? {
            id: tarea.asignado.id,
            nombre: tarea.asignado.nombre,
            avatar: tarea.asignado.avatar
          } : null,
          updatedAt: tarea.updatedAt,
          createdAt: tarea.createdAt,
          isOverdue,
          unreadNotifications: notificacionesMap[tarea.id] || 0,
          notifications: notificacionesDetalleMap[tarea.id] || []
        };
      });

      res.json({
        success: true,
        data: {
          tareas: tareasData,
          paginacion: {
            paginaActual: pagina,
            totalPaginas,
            totalRegistros: result.count,
            registrosPorPagina: limit
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo watchlist:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener watchlist'
      });
    }
  }

  /**
   * Marca las notificaciones de una tarea como leídas
   */
  static async marcarNotificacionesLeidas(req, res) {
    try {
      const { tareaId } = req.params;
      const usuarioId = req.usuario.id;

      const tarea = await Tarea.findByPk(tareaId);
      if (!tarea) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      // Verificar que el usuario está suscrito
      const watcher = await TaskWatcher.findOne({
        where: {
          taskId: tareaId,
          userId: usuarioId
        }
      });

      if (!watcher) {
        return res.status(404).json({
          success: false,
          message: 'No estás suscrito a esta tarea'
        });
      }

      const actualizado = await TaskWatcherNotification.update(
        { readAt: new Date() },
        {
          where: {
            taskId: tareaId,
            userId: usuarioId,
            readAt: null
          }
        }
      );

      // 200 OK - operación exitosa con respuesta
      res.json({
        success: true,
        data: {
          notificacionesMarcadas: actualizado[0]
        },
        message: 'Notificaciones marcadas como leídas'
      });
    } catch (error) {
      console.error('Error marcando notificaciones como leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar notificaciones como leídas'
      });
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leídas del usuario
   */
  static async obtenerConteoNotificaciones(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const conteo = await NotificationService.obtenerConteoNoLeidas(usuarioId);

      res.json({
        success: true,
        data: {
          conteo
        }
      });
    } catch (error) {
      console.error('Error obteniendo conteo de notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener conteo de notificaciones'
      });
    }
  }
}

module.exports = WatcherController;

