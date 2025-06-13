const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add currency_code column
    await queryInterface.addColumn('whiskies', 'currency_code', {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: 'USD',
      comment: 'ISO currency code for pricing (e.g., USD, SEK, EUR)',
      validate: {
        len: [3, 3],
        isUppercase: true
      }
    });

    // Add currency_symbol column
    await queryInterface.addColumn('whiskies', 'currency_symbol', {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: '$',
      comment: 'Currency symbol for display (e.g., $, Kr, €)'
    });

    // Update existing whiskies with default currency values based on current system settings
    // First, try to get current admin settings
    try {
      const [results] = await queryInterface.sequelize.query(`
        SELECT value FROM system_settings WHERE key = 'currency_code' LIMIT 1
      `);
      
      const currentCurrencyCode = results && results.length > 0 ? results[0].value : 'USD';
      
      const [symbolResults] = await queryInterface.sequelize.query(`
        SELECT value FROM system_settings WHERE key = 'currency_symbol' LIMIT 1
      `);
      
      const currentCurrencySymbol = symbolResults && symbolResults.length > 0 ? symbolResults[0].value : '$';

      // Update all existing whiskies with current admin currency settings
      await queryInterface.sequelize.query(`
        UPDATE whiskies 
        SET currency_code = '${currentCurrencyCode}', 
            currency_symbol = '${currentCurrencySymbol}' 
        WHERE currency_code IS NULL OR currency_symbol IS NULL
      `);
      
      console.log(`✅ Updated existing whiskies with currency: ${currentCurrencySymbol} ${currentCurrencyCode}`);
      
    } catch (error) {
      console.warn('⚠️ Could not fetch current currency settings, using defaults (USD, $)');
      
      // Fallback: update with default values
      await queryInterface.sequelize.query(`
        UPDATE whiskies 
        SET currency_code = 'USD', 
            currency_symbol = '$' 
        WHERE currency_code IS NULL OR currency_symbol IS NULL
      `);
    }

    // Add index for currency queries
    await queryInterface.addIndex('whiskies', ['currency_code']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    await queryInterface.removeIndex('whiskies', ['currency_code']);
    
    // Remove columns
    await queryInterface.removeColumn('whiskies', 'currency_symbol');
    await queryInterface.removeColumn('whiskies', 'currency_code');
  }
};