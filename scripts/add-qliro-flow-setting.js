const { db } = require('../lib/db');
const { siteSettings } = require('../lib/db/schema');

async function addQliroFlowSetting() {
  try {
    console.log('Adding qliro_checkout_flow setting...');
    
    const result = await db.insert(siteSettings).values({
      key: 'qliro_checkout_flow',
      value: 'window',
      description: 'Qliro checkout flow type: window (new window) or popup (modal popup)',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        description: 'Qliro checkout flow type: window (new window) or popup (modal popup)',
        updatedAt: new Date()
      }
    });
    
    console.log('✅ qliro_checkout_flow setting added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding setting:', error);
    process.exit(1);
  }
}

addQliroFlowSetting();
