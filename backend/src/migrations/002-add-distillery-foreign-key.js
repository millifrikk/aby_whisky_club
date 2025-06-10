'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add distillery_id column to whiskies table
    await queryInterface.addColumn('whiskies', 'distillery_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'distilleries',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for the foreign key
    await queryInterface.addIndex('whiskies', ['distillery_id']);

    // Make the existing distillery column nullable (for backward compatibility)
    await queryInterface.changeColumn('whiskies', 'distillery', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the distillery_id column
    await queryInterface.removeColumn('whiskies', 'distillery_id');

    // Revert distillery column to not nullable
    await queryInterface.changeColumn('whiskies', 'distillery', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
  }
};
