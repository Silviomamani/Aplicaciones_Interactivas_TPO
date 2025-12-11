module.exports = (sequelize, DataTypes) => {
  const TaskWatcherNotification = sequelize.define('TaskWatcherNotification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    watcherId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'task_watchers',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tareas',
        key: 'id'
      }
    },
    eventType: {
      type: DataTypes.ENUM(
        'statusChange',
        'priorityChange',
        'comment',
        'assignment',
        'dueDateChange',
        'titleChange'
      ),
      allowNull: false
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'task_watcher_notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'readAt']
      },
      {
        fields: ['taskId']
      },
      {
        fields: ['watcherId']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  TaskWatcherNotification.associate = (models) => {
    TaskWatcherNotification.belongsTo(models.TaskWatcher, {
      foreignKey: 'watcherId',
      as: 'watcher'
    });
    
    TaskWatcherNotification.belongsTo(models.Usuario, {
      foreignKey: 'userId',
      as: 'usuario'
    });
    
    TaskWatcherNotification.belongsTo(models.Tarea, {
      foreignKey: 'taskId',
      as: 'tarea'
    });
  };

  return TaskWatcherNotification;
};

