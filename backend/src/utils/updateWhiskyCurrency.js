require('dotenv').config();
const { Whisky, SystemSetting, sequelize } = require('../models');
const { testConnection } = require('../models');
const { Op } = require('sequelize');

const updateWhiskyCurrency = async () => {
  try {
    console.log('🔄 Updating existing whiskies with currency data...');

    // Test connection
    await testConnection();

    // Get current admin currency settings
    let currentCurrencyCode = 'USD';
    let currentCurrencySymbol = '$';

    try {
      const currencyCodeSetting = await SystemSetting.findOne({ where: { key: 'currency_code' } });
      const currencySymbolSetting = await SystemSetting.findOne({ where: { key: 'currency_symbol' } });

      if (currencyCodeSetting) {
        currentCurrencyCode = currencyCodeSetting.getParsedValue();
      }
      if (currencySymbolSetting) {
        currentCurrencySymbol = currencySymbolSetting.getParsedValue();
      }

      console.log(`📊 Current admin currency settings: ${currentCurrencySymbol} ${currentCurrencyCode}`);
    } catch (error) {
      console.warn('⚠️ Could not fetch current currency settings, using defaults (USD, $)');
    }

    // Find whiskies without currency data
    const whiskiesWithoutCurrency = await Whisky.findAll({
      where: {
        [Op.or]: [
          { currency_code: null },
          { currency_symbol: null }
        ]
      }
    });

    console.log(`📋 Found ${whiskiesWithoutCurrency.length} whiskies needing currency updates`);

    if (whiskiesWithoutCurrency.length > 0) {
      // Update all whiskies without currency data
      const [affectedRows] = await Whisky.update(
        {
          currency_code: currentCurrencyCode,
          currency_symbol: currentCurrencySymbol
        },
        {
          where: {
            [Op.or]: [
              { currency_code: null },
              { currency_symbol: null }
            ]
          }
        }
      );

      console.log(`✅ Updated ${affectedRows} whiskies with currency: ${currentCurrencySymbol} ${currentCurrencyCode}`);
    } else {
      console.log('✅ All whiskies already have currency data');
    }

    // Verify the update
    const totalWhiskies = await Whisky.count();
    const whiskiesWithCurrency = await Whisky.count({
      where: {
        currency_code: { [Op.ne]: null },
        currency_symbol: { [Op.ne]: null }
      }
    });

    console.log(`📊 Summary: ${whiskiesWithCurrency}/${totalWhiskies} whiskies have currency data`);

    if (whiskiesWithCurrency === totalWhiskies) {
      console.log('🎉 All whiskies now have proper currency data!');
    } else {
      console.warn(`⚠️ ${totalWhiskies - whiskiesWithCurrency} whiskies still missing currency data`);
    }

  } catch (error) {
    console.error('❌ Failed to update whisky currency data:', error);
    throw error;
  }
};

// Run update if called directly
if (require.main === module) {
  updateWhiskyCurrency()
    .then(() => {
      console.log('🔄 Whisky currency update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Whisky currency update failed:', error);
      process.exit(1);
    });
}

module.exports = updateWhiskyCurrency;