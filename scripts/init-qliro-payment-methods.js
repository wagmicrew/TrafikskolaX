const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.production.local' });

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function initQliroPaymentMethods() {
  try {
    console.log('Initializing Qliro payment method settings...');
    
    const settings = [
      { key: 'qliro_payment_invoice', value: 'true', category: 'payment', description: 'Enable Qliro Invoice payment method' },
      { key: 'qliro_payment_campaign', value: 'false', category: 'payment', description: 'Enable Qliro Campaign payment method' },
      { key: 'qliro_payment_partpayment_account', value: 'false', category: 'payment', description: 'Enable Qliro Part Payment Account' },
      { key: 'qliro_payment_partpayment_fixed', value: 'false', category: 'payment', description: 'Enable Qliro Part Payment Fixed' },
      { key: 'qliro_payment_creditcards', value: 'true', category: 'payment', description: 'Enable Qliro Credit Cards payment method' },
      { key: 'qliro_payment_free', value: 'false', category: 'payment', description: 'Enable Qliro Free payment method' },
      { key: 'qliro_payment_trustly_direct', value: 'false', category: 'payment', description: 'Enable Qliro Trustly Direct payment method' },
      { key: 'qliro_payment_swish', value: 'false', category: 'payment', description: 'Enable Qliro Swish payment method' }
    ];

    for (const setting of settings) {
      const result = await sql`
        INSERT INTO site_settings (key, value, category, description, created_at, updated_at)
        VALUES (${setting.key}, ${setting.value}, ${setting.category}, ${setting.description}, NOW(), NOW())
        ON CONFLICT (key) DO NOTHING
        RETURNING key
      `;
      
      if (result.length > 0) {
        console.log(`✅ Added: ${setting.key}`);
      } else {
        console.log(`⏭️  Skipped (exists): ${setting.key}`);
      }
    }
    
    console.log('✅ Qliro payment method settings initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing Qliro payment method settings:', error);
  } finally {
    await sql.end();
  }
}

initQliroPaymentMethods();
