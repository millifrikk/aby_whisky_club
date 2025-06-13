const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.approval_status) {
      await queryInterface.addColumn('users', 'approval_status', {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'approved', // Default to approved for backward compatibility
        allowNull: false
      });
    }

    if (!tableDescription.approval_date) {
      await queryInterface.addColumn('users', 'approval_date', {
        type: DataTypes.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.approved_by) {
      await queryInterface.addColumn('users', 'approved_by', {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
    }

    if (!tableDescription.approval_notes) {
      await queryInterface.addColumn('users', 'approval_notes', {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }

    // Add index for approval status only if column was added
    if (!tableDescription.approval_status) {
      try {
        await queryInterface.addIndex('users', ['approval_status']);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', ['approval_status']);
    await queryInterface.removeColumn('users', 'approval_notes');
    await queryInterface.removeColumn('users', 'approved_by');
    await queryInterface.removeColumn('users', 'approval_date');
    await queryInterface.removeColumn('users', 'approval_status');
  }
};