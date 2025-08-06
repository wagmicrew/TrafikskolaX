import { db } from '../lib/db/index.ts';

async function addEnumValue() {
  try {
    console.log('Adding swish_payment_verification to email_trigger_type enum...');
    
    // Add the new enum value
    await db.execute('ALTER TYPE email_trigger_type ADD VALUE \'swish_payment_verification\';');
    
    console.log('Successfully added swish_payment_verification to email_trigger_type enum');
  } catch (error) {
    console.error('Error adding enum value:', error.message);
    if (error.message.includes('already exists')) {
      console.log('Enum value already exists, continuing...');
    } else {
      throw error;
    }
  }
}

addEnumValue()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 