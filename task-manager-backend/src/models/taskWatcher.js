module.exports = (sequelize, DataTypes) => {
  const TaskWatcher = sequelize.define('TaskWatcher', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tareas',
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
    }
  }, {
    tableName: 'task_watchers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['taskId', 'userId']
      },
      {
        fields: ['taskId']
      },
      {
        fields: ['userId']
      }
    ]
  });

  TaskWatcher.associate = (models) => {
    TaskWatcher.belongsTo(models.Tarea, {
      foreignKey: 'taskId',
      as: 'tarea',
      onDelete: 'CASCADE'
    });
    
    TaskWatcher.belongsTo(models.Usuario, {
      foreignKey: 'userId',
      as: 'usuario'
    });
    
    TaskWatcher.hasMany(models.TaskWatcherNotification, {
      foreignKey: 'watcherId',
      as: 'notificaciones'
    });
  };

  return TaskWatcher;
};

