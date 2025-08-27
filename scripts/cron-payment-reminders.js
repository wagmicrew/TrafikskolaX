#!/usr/bin/env node

// Cron job to send payment reminders for unpaid bookings older than 5 hours
// This should be scheduled to run every hour via cron

import './send-payment-reminders.js';
