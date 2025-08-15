const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkTable() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if table exists
    const result = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'qliro_orders'
      ORDER BY ordinal_position
    `;
    
    if (result.length > 0) {
      console.log('✓ qliro_orders table exists with columns:');
      result.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('✗ qliro_orders table does not exist');
      
      // Try to create it manually
      console.log('Creating qliro_orders table...');
      await sql`
        CREATE TABLE IF NOT EXISTS qliro_orders (
          id SERIAL PRIMARY KEY,
          booking_id VARCHAR(255),
          handledar_booking_id VARCHAR(255),
          package_purchase_id VARCHAR(255),
          qliro_order_id VARCHAR(255) NOT NULL,
          merchant_reference VARCHAR(255) NOT NULL,
          amount INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          payment_link TEXT,
          environment VARCHAR(20) DEFAULT 'sandbox',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(qliro_order_id)
        )
      `;
      console.log('✓ Table created successfully');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTable();
