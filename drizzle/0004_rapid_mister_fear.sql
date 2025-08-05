ALTER TYPE "public"."email_trigger_type" ADD VALUE 'new_password';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'temp';--> statement-breakpoint
ALTER TABLE "package_contents" ADD COLUMN "handledar_session_id" uuid;--> statement-breakpoint
ALTER TABLE "package_contents" ADD COLUMN "content_type" varchar(50) DEFAULT 'lesson' NOT NULL;--> statement-breakpoint
ALTER TABLE "package_contents" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "customer_number" varchar(20);--> statement-breakpoint
ALTER TABLE "package_contents" ADD CONSTRAINT "package_contents_handledar_session_id_handledar_sessions_id_fk" FOREIGN KEY ("handledar_session_id") REFERENCES "public"."handledar_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_customer_number_unique" UNIQUE("customer_number");