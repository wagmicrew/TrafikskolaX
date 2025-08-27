#!/bin/bash

# Setup cron job for payment reminders
# Run this script on the server to set up automatic payment reminders

PROJECT_DIR="/path/to/your/trafikskolax"  # Update this path
SCRIPT_PATH="$PROJECT_DIR/scripts/send-payment-reminders.js"
LOG_PATH="$PROJECT_DIR/logs/payment-reminders.log"

# Create log directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Add cron job to run every hour
# This will check for unpaid bookings older than 5 hours and send reminders
CRON_JOB="0 * * * * cd $PROJECT_DIR && node $SCRIPT_PATH >> $LOG_PATH 2>&1"

# Check if cron job already exists
if crontab -l | grep -q "send-payment-reminders.js"; then
    echo "Payment reminder cron job already exists. Skipping..."
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Payment reminder cron job added successfully!"
    echo "Will run every hour to check for unpaid bookings older than 5 hours."
fi

echo "Current cron jobs:"
crontab -l

echo ""
echo "To remove the cron job later, run: crontab -r"
echo "Or edit with: crontab -e"
