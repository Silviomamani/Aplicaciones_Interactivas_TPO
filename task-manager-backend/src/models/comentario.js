module.exports = (sequelize, DataTypes) => {
  const Comentario = sequelize.define('Comentario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000]
      }
    },
    tareaId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tareas',
        key: 'id'
      }
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    }
  }, {
    tableName: 'comentarios',
    timestamps: true
  });

  Comentario.associate = (models) => {
    Comentario.belongsTo(models.Tarea, {
      foreignKey: 'tareaId',
      as: 'tarea'
    });
    
    Comentario.belongsTo(models.Usuario, {
      foreignKey: 'usuarioId',
      as: 'usuario'
    });
  };

  // Hook para generar notificaciones cuando se crea un comentario
  Comentario.addHook('afterCreate', async (comentario, options) => {
    const NotificationService = require('../services/notificationService');
    
    await NotificationService.crearNotificacionesParaWatchers({
      taskId: comentario.tareaId,
      eventType: 'comment',
      payload: {
        comentarioId: comentario.id,
        contenido: comentario.contenido.substring(0, 100), // Primeros 100 caracteres
        comentadoPor: comentario.usuarioId
      },
      excludeUserId: comentario.usuarioId
    });
  });

  return Comentario;
};