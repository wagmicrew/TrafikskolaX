#!/bin/bash

# Script to remove TrafikskolaX email cron jobs

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}TrafikskolaX Email Cron Jobs Removal${NC}"
echo "====================================="
echo ""

# Check if crontab exists
if ! command -v crontab &> /dev/null; then
    echo -e "${RED}Error: crontab not found.${NC}"
    exit 1
fi

# Backup current crontab
BACKUP_FILE="/tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt"
crontab -l > "$BACKUP_FILE" 2>/dev/null || true
echo -e "${GREEN}Current crontab backed up to: $BACKUP_FILE${NC}"

# Remove TrafikskolaX related cron jobs
echo -e "${YELLOW}Removing TrafikskolaX cron jobs...${NC}"

# List of job types to remove
JOB_TYPES=("booking-reminders" "teacher-daily-bookings" "credit-reminders" "feedback-reminders")

# Remove each job type
for job_type in "${JOB_TYPES[@]}"; do
    if crontab -l 2>/dev/null | grep -q "$job_type"; then
        # Remove the job and its comment line
        crontab -l 2>/dev/null | grep -v "$job_type" | grep -v "^# .*$job_type" | crontab -
        echo -e "${GREEN}Removed cron job: $job_type${NC}"
    else
        echo -e "${YELLOW}No cron job found for: $job_type${NC}"
    fi
done

echo ""
echo -e "${GREEN}Removal complete!${NC}"
echo ""
echo "To restore the backup, run:"
echo "  crontab $BACKUP_FILE"
echo ""
echo "To reinstall the cron jobs, run:"
echo "  ./scripts/setup-cron-jobs.sh"
