# Payment Reminders System

This system automatically sends email reminders to students who have unpaid bookings older than 5 hours.

## Features

- ✅ Automatically detects unpaid bookings older than 5 hours
- ✅ Sends professional HTML email reminders with payment links
- ✅ Includes Swish payment details in the email
- ✅ Uses SendGrid for reliable email delivery
- ✅ Includes direct link to payment page for easy access
- ✅ Runs automatically every hour via cron job

## Setup Instructions

### 1. Install Dependencies

Make sure you have the required dependencies:

```bash
npm install @sendgrid/mail date-fns
```

### 2. Configure SendGrid API Key

The script will automatically fetch the SendGrid API key from the database (site_settings table with key 'sendgrid_api_key'). You can also set it as an environment variable:

```bash
export SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### 3. Set Up Cron Job (Linux/Mac)

Run the setup script:

```bash
chmod +x scripts/setup-payment-reminders-cron.sh
./scripts/setup-payment-reminders-cron.sh
```

**Important:** Edit the script first to set the correct PROJECT_DIR path!

### 4. Manual Testing

You can test the payment reminder system manually:

```bash
cd /path/to/your/project
node scripts/send-payment-reminders.js
```

### 5. Windows Setup (Alternative)

For Windows servers, you can use Task Scheduler:

1. Create a new task
2. Set trigger: Daily, every 1 hour
3. Set action: Start a program
4. Program: `node.exe`
5. Arguments: `scripts/send-payment-reminders.js`
6. Start in: `C:\path\to\your\project`

## Email Template Features

The payment reminder emails include:

- **Professional design** with responsive layout
- **Booking details** (date, time, lesson type, price)
- **Direct payment link** to `/booking/payment/{bookingId}`
- **Swish payment details** (number, amount, reference)
- **School contact information**
- **Clear call-to-action** buttons

## Database Requirements

The script expects these database tables and columns:

- `bookings` table with: `id`, `userId`, `paymentStatus`, `status`, `createdAt`, `scheduledDate`, `startTime`, `endTime`, `totalPrice`, `swishUUID`, `lessonTypeId`
- `users` table with: `id`, `email`, `firstName`, `lastName`
- `lessonTypes` table with: `id`, `name`
- `siteSettings` table with: `key`, `value` (for SendGrid API key and school settings)

## Monitoring

Check the logs to monitor the payment reminder system:

```bash
tail -f logs/payment-reminders.log
```

## Troubleshooting

### Common Issues:

1. **"SendGrid API key not found"**
   - Make sure the API key is set in the database or environment variables
   - Check that the site_settings table has the correct key

2. **"No unpaid bookings found"**
   - This is normal if there are no bookings older than 5 hours
   - Check that bookings have `paymentStatus = 'unpaid'` and `status = 'temp'`

3. **"Error sending email"**
   - Check SendGrid account status and API key validity
   - Verify the recipient email addresses are valid

### Debug Mode:

Add this to the top of `send-payment-reminders.js` for more detailed logging:

```javascript
process.env.DEBUG = 'true';
```

## Customization

### Change Reminder Timing

To change the reminder time from 5 hours, modify this line in `send-payment-reminders.js`:

```javascript
const fiveHoursAgo = subHours(new Date(), 5); // Change 5 to your desired hours
```

### Customize Email Template

The email template is embedded in the `sendPaymentReminderEmail` function. You can modify the HTML content there to match your school's branding.

### Change Cron Schedule

To change how often the script runs, modify the cron job:

```bash
# Every 2 hours instead of every hour
0 */2 * * * cd $PROJECT_DIR && node $SCRIPT_PATH >> $LOG_PATH 2>&1

# Every 30 minutes
*/30 * * * * cd $PROJECT_DIR && node $SCRIPT_PATH >> $LOG_PATH 2>&1
```

## Security Notes

- The script uses environment variables or database settings for sensitive data
- Email content includes payment URLs but no sensitive payment data
- All database queries use parameterized statements to prevent SQL injection
- The script has limited database permissions (read-only for most operations)
