const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkTable() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if table exists with detailed column info
    const result = await sql`
      SELECT 
        column_name, 
        data_type,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'qliro_orders'
      ORDER BY ordinal_position
    `;
    
    if (result.length > 0) {
      console.log('✓ qliro_orders table exists with columns:');
      let hasErrors = false;
      
      result.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}${row.numeric_precision ? `(${row.numeric_precision},${row.numeric_scale})` : ''} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        
        // Validate critical columns
        if (row.column_name === 'id' && row.data_type !== 'uuid') {
          console.log(`    ⚠️  Expected 'id' to be uuid, got ${row.data_type}`);
          hasErrors = true;
        }
        if (row.column_name === 'amount' && (row.data_type !== 'numeric' || row.numeric_precision !== 10 || row.numeric_scale !== 2)) {
          console.log(`    ⚠️  Expected 'amount' to be numeric(10,2), got ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
          hasErrors = true;
        }
      });
      
      // Check for required columns
      const columnNames = result.map(r => r.column_name);
      const requiredColumns = ['id', 'qliro_order_id', 'merchant_reference', 'amount', 'currency', 'status'];
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`    ⚠️  Missing required columns: ${missingColumns.join(', ')}`);
        hasErrors = true;
      }
      
      // Check unique constraints
      const constraints = await sql`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = 'qliro_orders' AND constraint_type IN ('UNIQUE', 'PRIMARY KEY')
      `;
      
      console.log('\n  Constraints:');
      constraints.forEach(c => {
        console.log(`  - ${c.constraint_name}: ${c.constraint_type}`);
      });
      
      if (hasErrors) {
        console.log('\n❌ Table schema has issues that need to be fixed manually');
        console.log('Expected schema:');
        console.log('  - id: uuid PRIMARY KEY');
        console.log('  - amount: numeric(10,2) NOT NULL');
        console.log('  - qliro_order_id: varchar(255) NOT NULL UNIQUE');
        process.exit(1);
      } else {
        console.log('\n✅ Table schema is correct');
      }
    } else {
      console.log('❌ qliro_orders table does not exist');
      console.log('\nThe table should be created via Drizzle migrations:');
      console.log('  npm run db:generate');
      console.log('  npm run db:migrate');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTable();
