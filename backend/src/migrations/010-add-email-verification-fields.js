const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting email verification fields migration...');
      
      // Check if columns already exist
      const tableInfo = await queryInterface.describeTable('users');
      
      const migrations = [];
      
      // Add email_verification_token if it doesn't exist
      if (!tableInfo.email_verification_token) {
        migrations.push(
          queryInterface.addColumn('users', 'email_verification_token', {
            type: DataTypes.STRING(255),
            allowNull: true
          })
        );
        console.log('Adding email_verification_token column...');
      }
      
      // Add email_verification_expires if it doesn't exist
      if (!tableInfo.email_verification_expires) {
        migrations.push(
          queryInterface.addColumn('users', 'email_verification_expires', {
            type: DataTypes.DATE,
            allowNull: true
          })
        );
        console.log('Adding email_verification_expires column...');
      }
      
      // Add password_reset_token if it doesn't exist
      if (!tableInfo.password_reset_token) {
        migrations.push(
          queryInterface.addColumn('users', 'password_reset_token', {
            type: DataTypes.STRING(255),
            allowNull: true
          })
        );
        console.log('Adding password_reset_token column...');
      }
      
      // Add password_reset_expires if it doesn't exist
      if (!tableInfo.password_reset_expires) {
        migrations.push(
          queryInterface.addColumn('users', 'password_reset_expires', {
            type: DataTypes.DATE,
            allowNull: true
          })
        );
        console.log('Adding password_reset_expires column...');
      }

      // Add email_notifications_enabled if it doesn't exist
      if (!tableInfo.email_notifications_enabled) {
        migrations.push(
          queryInterface.addColumn('users', 'email_notifications_enabled', {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
          })
        );
        console.log('Adding email_notifications_enabled column...');
      }

      await Promise.all(migrations);
      
      console.log('Email verification fields migration completed successfully');
    } catch (error) {
      console.error('Email verification fields migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Reverting email verification fields migration...');
      
      await queryInterface.removeColumn('users', 'email_verification_token');
      await queryInterface.removeColumn('users', 'email_verification_expires');
      await queryInterface.removeColumn('users', 'password_reset_token');
      await queryInterface.removeColumn('users', 'password_reset_expires');
      await queryInterface.removeColumn('users', 'email_notifications_enabled');
      
      console.log('Email verification fields migration reverted successfully');
    } catch (error) {
      console.error('Email verification fields migration revert error:', error);
      throw error;
    }
  }
};