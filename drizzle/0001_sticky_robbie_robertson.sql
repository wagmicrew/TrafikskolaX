CREATE TABLE "blocked_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"time_start" time,
	"time_end" time,
	"is_all_day" boolean DEFAULT false,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings_old" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"teacher_id" uuid,
	"car_id" uuid,
	"invoice_id" varchar(100),
	"booking_date" timestamp NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"lesson_type" "lesson_type" NOT NULL,
	"price" numeric(10, 2),
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handledar_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid,
	"supervisor_name" varchar(255),
	"supervisor_email" varchar(255),
	"supervisor_phone" varchar(50),
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handledar_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"max_participants" integer DEFAULT 2,
	"current_participants" integer DEFAULT 0,
	"teacher_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"duration_minutes" integer DEFAULT 45 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"price_student" numeric(10, 2),
	"sale_price" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"lesson_type_id" uuid,
	"credits" integer DEFAULT 0,
	"free_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"price_paid" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50),
	"payment_status" varchar(50) DEFAULT 'pending',
	"invoice_number" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"price_student" numeric(10, 2),
	"sale_price" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text,
	"description" text,
	"category" varchar(100),
	"is_env" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "slot_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"time_start" time NOT NULL,
	"time_end" time NOT NULL,
	"reason" text,
	"is_available" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slot_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_of_week" integer NOT NULL,
	"time_start" time NOT NULL,
	"time_end" time NOT NULL,
	"is_active" boolean DEFAULT true,
	"admin_minutes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_student_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_credits" DROP CONSTRAINT "user_credits_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "payment_status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "payment_status" SET DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "payment_status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "is_completed" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "lesson_type_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "scheduled_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "start_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "end_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "duration_minutes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "transmission_type" varchar(20);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "status" varchar(50) DEFAULT 'on_hold';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "total_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "is_guest_booking" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "guest_name" varchar(255);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "guest_email" varchar(255);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "guest_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "feedback_ready" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "invoice_number" varchar(100);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "invoice_date" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "swish_uuid" varchar(255);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "lesson_type_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "credits_remaining" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "credits_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "package_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "inskriven" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "inskriven_date" timestamp;--> statement-breakpoint
ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings_old" ADD CONSTRAINT "bookings_old_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings_old" ADD CONSTRAINT "bookings_old_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings_old" ADD CONSTRAINT "bookings_old_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD CONSTRAINT "handledar_bookings_session_id_handledar_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."handledar_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handledar_bookings" ADD CONSTRAINT "handledar_bookings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handledar_sessions" ADD CONSTRAINT "handledar_sessions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_contents" ADD CONSTRAINT "package_contents_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_contents" ADD CONSTRAINT "package_contents_lesson_type_id_lesson_types_id_fk" FOREIGN KEY ("lesson_type_id") REFERENCES "public"."lesson_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_purchases" ADD CONSTRAINT "package_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_purchases" ADD CONSTRAINT "package_purchases_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_overrides" ADD CONSTRAINT "slot_overrides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lesson_type_id_lesson_types_id_fk" FOREIGN KEY ("lesson_type_id") REFERENCES "public"."lesson_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_lesson_type_id_lesson_types_id_fk" FOREIGN KEY ("lesson_type_id") REFERENCES "public"."lesson_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "student_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "invoice_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "booking_date";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "duration";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "lesson_type";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "is_cancelled";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "cancel_reason";--> statement-breakpoint
ALTER TABLE "user_credits" DROP COLUMN "lesson_type";--> statement-breakpoint
ALTER TABLE "user_credits" DROP COLUMN "credits";--> statement-breakpoint
ALTER TABLE "user_credits" DROP COLUMN "purchase_date";--> statement-breakpoint
ALTER TABLE "user_credits" DROP COLUMN "expiry_date";--> statement-breakpoint
ALTER TABLE "user_credits" DROP COLUMN "notes";