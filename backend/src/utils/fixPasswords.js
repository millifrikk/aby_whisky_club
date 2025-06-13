const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { Op } = require('sequelize');

async function fixPasswords() {
  try {
    console.log('🔑 Starting password fix for member users...');
    
    // Find users with unhashed passwords
    const users = await User.findAll({ 
      where: { 
        email: { 
          [Op.in]: ['erik@example.com', 'anna@example.com', 'lars@example.com'] 
        } 
      } 
    });
    
    for (const user of users) {
      // Check if password looks unhashed (plain text)
      if (user.password_hash === 'MemberPass123!' || (!user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$'))) {
        console.log(`📝 Fixing password for ${user.email}...`);
        
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('MemberPass123!', salt);
        
        await user.update({ password_hash: hashedPassword });
        console.log(`✅ Fixed password for ${user.email}`);
      } else {
        console.log(`✓ Password for ${user.email} already properly hashed`);
      }
    }
    
    console.log('🎉 Password fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
    process.exit(1);
  }
}

fixPasswords();