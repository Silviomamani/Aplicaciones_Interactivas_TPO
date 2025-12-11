'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tareas_etiquetas', {
      tareaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tareas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      etiquetaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'etiquetas',
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

    await queryInterface.addConstraint('tareas_etiquetas', {
      fields: ['tareaId', 'etiquetaId'],
      type: 'primary key',
      name: 'pk_tareas_etiquetas'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tareas_etiquetas');
  }
};
