# TrafikskolaX Email Cron Jobs Setup Guide

This guide explains how to set up automated email reminders for the TrafikskolaX system on Ubuntu.

## Prerequisites

1. Ubuntu server with cron installed
2. Node.js installed (version 18+ recommended)
3. Project deployed to the server
4. Environment variables configured in `.env.local`

## Quick Setup

1. SSH into your Ubuntu server
2. Navigate to your project directory
3. Make the setup script executable and run it:

```bash
cd /path/to/trafikskola
chmod +x scripts/setup-cron-jobs.sh
./scripts/setup-cron-jobs.sh
```

## What Gets Installed

The setup script installs four cron jobs:

### 1. Booking Reminders
- **Schedule**: Daily at 6:00 PM
- **Purpose**: Sends reminders to students about their lessons tomorrow
- **Job Type**: `booking-reminders`

### 2. Teacher Daily Bookings
- **Schedule**: Daily at 6:00 AM
- **Purpose**: Sends teachers a summary of their bookings for the day
- **Job Type**: `teacher-daily-bookings`

### 3. Credit Reminders
- **Schedule**: Weekly on Mondays at 10:00 AM
- **Purpose**: Reminds students with unused credits to book lessons
- **Job Type**: `credit-reminders`

### 4. Feedback Reminders
- **Schedule**: Daily at 7:00 PM
- **Purpose**: Reminds teachers to provide feedback for completed lessons
- **Job Type**: `feedback-reminders`

## Manual Testing

To test a cron job manually:

```bash
/path/to/trafikskola/scripts/run-cron-job.sh booking-reminders
```

## Monitoring

### View Logs
```bash
# View all logs
tail -f /path/to/trafikskola/logs/cron/*.log

# View specific job logs
tail -f /path/to/trafikskola/logs/cron/booking-reminders-*.log
```

### Check Cron Status
```bash
# View all cron jobs
crontab -l

# Check if cron service is running
sudo systemctl status cron
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x scripts/run-cron-job.sh
   chmod +x scripts/setup-cron-jobs.sh
   ```

2. **Environment Variables Not Loading**
   - Ensure `.env.local` exists and is readable
   - Check file permissions: `chmod 644 .env.local`

3. **TypeScript Execution Errors**
   - Install tsx globally: `npm install -g tsx`
   - Or ensure npx is available

4. **Timezone Issues**
   - Check server timezone: `timedatectl`
   - Set timezone: `sudo timedatectl set-timezone Europe/Stockholm`

### Debug Mode

To run a job with verbose output:

```bash
cd /path/to/trafikskola
npx tsx scripts/email-cron-jobs.ts booking-reminders
```

## Customizing Schedule

To change the schedule, edit the crontab:

```bash
crontab -e
```

Cron schedule format:
```
* * * * * command
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `0 18 * * *` - Every day at 6:00 PM
- `0 6 * * 1-5` - Weekdays at 6:00 AM
- `*/30 * * * *` - Every 30 minutes

## Removing Cron Jobs

To remove all TrafikskolaX cron jobs:

```bash
./scripts/remove-cron-jobs.sh
```

## Alternative: Using Systemd Timers

For production environments, you might prefer systemd timers over cron:

1. Copy service files to systemd:
   ```bash
   sudo cp scripts/systemd/*.service /etc/systemd/system/
   sudo cp scripts/systemd/*.timer /etc/systemd/system/
   ```

2. Enable and start timers:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable trafikskola-booking-reminders.timer
   sudo systemctl start trafikskola-booking-reminders.timer
   ```

## Security Considerations

1. **File Permissions**
   - Ensure scripts are not world-writable
   - Protect `.env.local` file: `chmod 600 .env.local`

2. **User Permissions**
   - Run cron jobs as a non-root user
   - Consider using a dedicated service account

3. **Log Rotation**
   - Logs are automatically rotated (30-day retention)
   - Adjust in `run-cron-job.sh` if needed

## Support

If you encounter issues:

1. Check the logs in `/path/to/trafikskola/logs/cron/`
2. Verify environment variables are loaded correctly
3. Ensure database connectivity
4. Check email service configuration
