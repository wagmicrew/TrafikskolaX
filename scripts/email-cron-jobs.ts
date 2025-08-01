import { EmailCronService } from '../lib/email/email-cron-service';

// Get the job type from command line arguments
const jobType = process.argv[2];

async function runJob() {
  console.log(`Starting ${jobType} job at ${new Date().toISOString()}`);
  
  try {
    switch (jobType) {
      case 'booking-reminders':
        await EmailCronService.sendBookingReminders();
        break;
      
      case 'teacher-daily-bookings':
        await EmailCronService.sendTeacherDailyBookings();
        break;
      
      case 'credit-reminders':
        await EmailCronService.sendCreditReminders();
        break;
      
      case 'feedback-reminders':
        await EmailCronService.sendTeacherFeedbackReminders();
        break;
      
      default:
        console.error(`Unknown job type: ${jobType}`);
        process.exit(1);
    }
    
    console.log(`${jobType} job completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`Error running ${jobType} job:`, error);
    process.exit(1);
  }
}

// Run the job
runJob();
