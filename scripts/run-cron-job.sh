#!/bin/bash

# Script to run email cron jobs
# This script handles environment setup and TypeScript execution

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_ROOT"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(cat "$PROJECT_ROOT/.env.local" | grep -v '^#' | xargs)
fi

# Check if job type is provided
if [ -z "$1" ]; then
    echo "Error: Job type not specified"
    echo "Usage: $0 <job-type>"
    echo "Available job types: booking-reminders, teacher-daily-bookings, credit-reminders, feedback-reminders"
    exit 1
fi

JOB_TYPE=$1
LOG_DIR="$PROJECT_ROOT/logs/cron"
LOG_FILE="$LOG_DIR/${JOB_TYPE}-$(date +%Y%m%d).log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Log start time
echo "=== Starting $JOB_TYPE at $(date) ===" >> "$LOG_FILE"

# Run the TypeScript job using tsx (TypeScript executor)
# First check if tsx is installed globally, otherwise use npx
if command -v tsx &> /dev/null; then
    tsx "$PROJECT_ROOT/scripts/email-cron-jobs.ts" "$JOB_TYPE" >> "$LOG_FILE" 2>&1
else
    npx tsx "$PROJECT_ROOT/scripts/email-cron-jobs.ts" "$JOB_TYPE" >> "$LOG_FILE" 2>&1
fi

# Capture exit code
EXIT_CODE=$?

# Log end time and exit code
echo "=== Completed $JOB_TYPE at $(date) with exit code $EXIT_CODE ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Rotate logs if they get too large (keep last 30 days)
find "$LOG_DIR" -name "${JOB_TYPE}-*.log" -mtime +30 -delete

exit $EXIT_CODE
