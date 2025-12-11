const { TaskWatcher, TaskWatcherNotification, Tarea, Usuario } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  static MAX_WATCHERS_PER_TASK = parseInt(process.env.MAX_WATCHERS_PER_TASK || '50');

  /**
   * Crea notificaciones para todos los watchers de una tarea cuando ocurre un evento
   */
  static async crearNotificacionesParaWatchers({
    taskId,
    eventType,
    payload = null,
    excludeUserId = null
  }) {
    try {
      const whereClause = { taskId };
      if (excludeUserId) {
        whereClause.userId = { [Op.ne]: excludeUserId };
      }

      const watchers = await TaskWatcher.findAll({
        where: whereClause,
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id']
        }]
      });

      if (watchers.length === 0) {
        return [];
      }

      const notificaciones = await Promise.all(
        watchers.map(watcher =>
          TaskWatcherNotification.create({
            watcherId: watcher.id,
            userId: watcher.userId,
            taskId,
            eventType,
            payload
          })
        )
      );

      return notificaciones;
    } catch (error) {
      console.error('Error creando notificaciones para watchers:', error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario puede suscribirse a una tarea
   */
  static async puedeSuscribirse(usuarioId, taskId, equipoId) {
    const { Membresia } = require('../models');
    
    // Verificar que el usuario pertenece al equipo
    const membresia = await Membresia.findOne({
      where: {
        usuarioId,
        equipoId,
        activo: true
      }
    });

    if (!membresia) {
      return { puede: false, razon: 'El usuario no pertenece al equipo' };
    }

    // Verificar si ya está suscrito
    const watcherExistente = await TaskWatcher.findOne({
      where: {
        taskId,
        userId: usuarioId
      }
    });

    if (watcherExistente) {
      return { puede: false, razon: 'El usuario ya está suscrito a esta tarea' };
    }

    // Verificar límite de watchers
    const cantidadWatchers = await TaskWatcher.count({
      where: { taskId }
    });

    if (cantidadWatchers >= this.MAX_WATCHERS_PER_TASK) {
      return { puede: false, razon: `Se alcanzó el límite de ${this.MAX_WATCHERS_PER_TASK} watchers por tarea` };
    }

    return { puede: true };
  }

  /**
   * Obtiene el conteo de notificaciones no leídas para un usuario
   */
  static async obtenerConteoNoLeidas(usuarioId) {
    return await TaskWatcherNotification.count({
      where: {
        userId: usuarioId,
        readAt: null
      }
    });
  }
}

module.exports = NotificationService;

