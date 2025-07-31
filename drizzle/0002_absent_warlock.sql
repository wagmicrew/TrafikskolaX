CREATE TABLE "booking_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"step_number" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(200) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"booking_id" uuid,
	"message_type" varchar(50) DEFAULT 'general',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "handledar_bookings" ALTER COLUMN "supervisor_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_credits" ALTER COLUMN "lesson_type_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "step_identifier" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "step_identifier" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_feedback" ALTER COLUMN "feedback_text" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD COLUMN "price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD COLUMN "payment_status" varchar(50) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD COLUMN "swish_uuid" varchar(255);--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD COLUMN "booked_by" uuid;--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD COLUMN "reminder_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "handledar_sessions" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "handledar_sessions" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "handledar_sessions" ADD COLUMN "price_per_participant" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "handledar_session_id" uuid;--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "credit_type" varchar(50) DEFAULT 'lesson' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "valuation" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "workplace" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "work_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mobile_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kk_validity_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "risk_education_1" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "risk_education_2" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "knowledge_test" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "driving_test" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "send_internal_messages_to_email" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD CONSTRAINT "handledar_bookings_booked_by_users_id_fk" FOREIGN KEY ("booked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_handledar_session_id_handledar_sessions_id_fk" FOREIGN KEY ("handledar_session_id") REFERENCES "public"."handledar_sessions"("id") ON DELETE no action ON UPDATE no action;