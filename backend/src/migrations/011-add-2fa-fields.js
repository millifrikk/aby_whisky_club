'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'two_factor_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('users', 'two_factor_secret', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'two_factor_backup_codes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of encrypted backup codes'
    });

    await queryInterface.addColumn('users', 'two_factor_last_used', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'two_factor_enabled');
    await queryInterface.removeColumn('users', 'two_factor_secret');
    await queryInterface.removeColumn('users', 'two_factor_backup_codes');
    await queryInterface.removeColumn('users', 'two_factor_last_used');
  }
};