#!/bin/bash

# Setup script for TrafikskolaX email cron jobs on Ubuntu
# This script installs and configures all necessary cron jobs

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the absolute path of the project
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}TrafikskolaX Email Cron Jobs Setup${NC}"
echo "====================================="
echo ""

# Check if running on Ubuntu/Debian
if ! command -v crontab &> /dev/null; then
    echo -e "${RED}Error: crontab not found. Please install cron:${NC}"
    echo "sudo apt-get update && sudo apt-get install cron"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Make the run script executable
chmod +x "$PROJECT_ROOT/scripts/run-cron-job.sh"

# Install tsx globally for better performance (optional)
echo -e "${YELLOW}Installing tsx (TypeScript executor) globally...${NC}"
npm install -g tsx || echo -e "${YELLOW}Warning: Could not install tsx globally. Will use npx instead.${NC}"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs/cron"

# Function to add cron job if it doesn't exist
add_cron_job() {
    local schedule="$1"
    local job_type="$2"
    local description="$3"
    
    # Full cron command
    local cron_cmd="$schedule $PROJECT_ROOT/scripts/run-cron-job.sh $job_type"
    
    # Check if job already exists
    if crontab -l 2>/dev/null | grep -q "$job_type"; then
        echo -e "${YELLOW}Cron job for $job_type already exists. Skipping...${NC}"
    else
        # Add the cron job
        (crontab -l 2>/dev/null; echo "# $description"; echo "$cron_cmd") | crontab -
        echo -e "${GREEN}Added cron job: $description${NC}"
        echo "  Schedule: $schedule"
        echo "  Command: $cron_cmd"
        echo ""
    fi
}

echo -e "${GREEN}Setting up cron jobs...${NC}"
echo ""

# Add cron jobs
# Note: Times are in server's local timezone

# 1. Booking reminders - Daily at 6:00 PM (for next day's bookings)
add_cron_job "0 18 * * *" "booking-reminders" "Daily booking reminders for tomorrow's lessons"

# 2. Teacher daily bookings - Daily at 6:00 AM
add_cron_job "0 6 * * *" "teacher-daily-bookings" "Daily booking summary for teachers"

# 3. Credit reminders - Weekly on Mondays at 10:00 AM
add_cron_job "0 10 * * 1" "credit-reminders" "Weekly credit reminders for inactive students"

# 4. Feedback reminders - Daily at 7:00 PM
add_cron_job "0 19 * * *" "feedback-reminders" "Daily feedback reminders for teachers"

# Display current crontab
echo -e "${GREEN}Current crontab:${NC}"
crontab -l | grep -A1 -B1 "trafikskola\|booking-reminders\|teacher-daily\|credit-reminders\|feedback-reminders" || echo "No TrafikskolaX cron jobs found."

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Cron jobs have been installed with the following schedule:"
echo "  - Booking reminders: Daily at 6:00 PM"
echo "  - Teacher daily summary: Daily at 6:00 AM"
echo "  - Credit reminders: Weekly on Mondays at 10:00 AM"
echo "  - Feedback reminders: Daily at 7:00 PM"
echo ""
echo "Logs will be stored in: $PROJECT_ROOT/logs/cron/"
echo ""
echo -e "${YELLOW}Important notes:${NC}"
echo "1. Make sure your server's timezone is correctly configured"
echo "2. Ensure the .env.local file contains all necessary environment variables"
echo "3. The cron daemon must be running: sudo systemctl status cron"
echo "4. To view logs: tail -f $PROJECT_ROOT/logs/cron/*.log"
echo ""
echo "To manually test a cron job, run:"
echo "  $PROJECT_ROOT/scripts/run-cron-job.sh <job-type>"
echo ""
echo "To remove all cron jobs, run:"
echo "  $PROJECT_ROOT/scripts/remove-cron-jobs.sh"
