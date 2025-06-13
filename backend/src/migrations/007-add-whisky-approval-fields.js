'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('whiskies', 'approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'approved',
      allowNull: false
    });

    await queryInterface.addColumn('whiskies', 'approved_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    await queryInterface.addColumn('whiskies', 'approval_date', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('whiskies', 'approval_notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Update all existing whiskies to be approved with current date
    await queryInterface.sequelize.query(`
      UPDATE whiskies 
      SET approval_status = 'approved', approval_date = NOW() 
      WHERE approval_status IS NULL OR approval_status = 'pending'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('whiskies', 'approval_status');
    await queryInterface.removeColumn('whiskies', 'approved_by');
    await queryInterface.removeColumn('whiskies', 'approval_date');
    await queryInterface.removeColumn('whiskies', 'approval_notes');
  }
};