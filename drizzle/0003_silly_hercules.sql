CREATE TYPE "public"."email_receiver_type" AS ENUM('student', 'teacher', 'admin', 'specific_user');--> statement-breakpoint
CREATE TYPE "public"."email_trigger_type" AS ENUM('user_login', 'forgot_password', 'new_user', 'new_booking', 'moved_booking', 'cancelled_booking', 'booking_reminder', 'booking_confirmed', 'credits_reminder', 'payment_reminder', 'payment_confirmation_request', 'payment_confirmed', 'payment_declined', 'feedback_received', 'teacher_daily_bookings', 'teacher_feedback_reminder', 'awaiting_school_confirmation', 'pending_school_confirmation');--> statement-breakpoint
CREATE TABLE "email_receivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"receiver_type" "email_receiver_type" NOT NULL,
	"specific_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger_type" "email_trigger_type" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"html_content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_trigger_type_unique" UNIQUE("trigger_type")
);
--> statement-breakpoint
CREATE TABLE "email_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"trigger_type" "email_trigger_type" NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_receivers" ADD CONSTRAINT "email_receivers_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_triggers" ADD CONSTRAINT "email_triggers_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;