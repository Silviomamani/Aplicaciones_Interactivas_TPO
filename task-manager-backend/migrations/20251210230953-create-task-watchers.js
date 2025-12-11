'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('task_watchers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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

    await queryInterface.addIndex('task_watchers', ['taskId', 'userId'], {
      unique: true
    });
    await queryInterface.addIndex('task_watchers', ['taskId']);
    await queryInterface.addIndex('task_watchers', ['userId']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('task_watchers');
  }
};
