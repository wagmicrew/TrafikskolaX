// Test script to verify Qliro API connectivity and settings
import { QliroService } from './lib/payment/qliro-service';

export async function testQliroAPI() {
  console.log('=== Testing Qliro API ===');
  
  try {
    const qliroService = QliroService.getInstance();
    
    // Test 1: Check if enabled
    console.log('\n1. Checking if Qliro is enabled...');
    const isEnabled = await qliroService.isEnabled();
    console.log(`Qliro enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      return {
        success: false,
        message: 'Qliro is not enabled in settings'
      };
    }
    
    // Test 2: Test connection
    console.log('\n2. Testing API connection...');
    const connectionTest = await qliroService.testConnection({ extended: true });
    
    if (connectionTest.success) {
      console.log('✅ Connection test passed');
      return {
        success: true,
        message: 'Qliro API is working correctly',
        details: connectionTest
      };
    } else {
      console.log('❌ Connection test failed');
      return {
        success: false,
        message: connectionTest.message,
        debug: connectionTest.debug
      };
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    };
  }
}

// Export for use in API routes
export default testQliroAPI;
