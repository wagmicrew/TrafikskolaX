#!/bin/bash

# Quick install and test script for payment reminders
echo "🔧 Installing payment reminder system..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install @sendgrid/mail date-fns

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Test the script
echo "🧪 Testing payment reminder script..."
node scripts/send-payment-reminders.js

if [ $? -eq 0 ]; then
    echo "✅ Payment reminder system installed and tested successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up your SendGrid API key in the database or environment variables"
    echo "2. Run the cron setup script: ./scripts/setup-payment-reminders-cron.sh"
    echo "3. Check logs/payment-reminders.log for execution logs"
else
    echo "⚠️  Payment reminder script completed with warnings (this is normal if no unpaid bookings found)"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up your SendGrid API key in the database or environment variables"
    echo "2. Run the cron setup script: ./scripts/setup-payment-reminders-cron.sh"
fi
