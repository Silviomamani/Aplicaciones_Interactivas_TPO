'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('task_watcher_notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      watcherId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'task_watchers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      taskId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tareas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      eventType: {
        type: Sequelize.ENUM(
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
        type: Sequelize.JSON,
        allowNull: true
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('task_watcher_notifications', ['userId', 'readAt']);
    await queryInterface.addIndex('task_watcher_notifications', ['taskId']);
    await queryInterface.addIndex('task_watcher_notifications', ['watcherId']);
    await queryInterface.addIndex('task_watcher_notifications', ['createdAt']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('task_watcher_notifications');
  }
};
