#!/usr/bin/env node

/**
 * Cleanup Stale Qliro Orders Script
 * This script cleans up stale Qliro orders that are older than 24 hours
 * Can be run as a cron job: 0 2 * * * node scripts/cleanup-stale-qliro-orders.js
 */

const { qliroService } = require('../lib/payment/qliro-service');
const { logger } = require('../lib/logging/logger');

async function cleanupStaleOrders() {
  try {
    console.log('🧹 Starting stale Qliro orders cleanup...');
    
    const expiredCount = await qliroService.invalidateStaleOrders();
    
    console.log(`✅ Cleanup completed: ${expiredCount} stale orders invalidated`);
    
    // Log for monitoring
    logger.info('cron', 'Stale Qliro orders cleanup completed', {
      expiredCount,
      timestamp: new Date().toISOString()
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    
    // Log error for monitoring
    logger.error('cron', 'Stale Qliro orders cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    process.exit(1);
  }
}

// Run the cleanup
cleanupStaleOrders();
