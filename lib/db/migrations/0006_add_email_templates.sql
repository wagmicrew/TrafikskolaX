-- Create email trigger type enum
CREATE TYPE email_trigger_type AS ENUM (
  'user_login',
  'forgot_password',
  'new_user',
  'new_booking',
  'moved_booking',
  'cancelled_booking',
  'booking_reminder',
  'credits_reminder',
  'payment_reminder',
  'payment_confirmation_request',
  'payment_confirmed',
  'payment_declined',
  'feedback_received',
  'teacher_daily_bookings',
  'teacher_feedback_reminder'
);

-- Create email receiver type enum
CREATE TYPE email_receiver_type AS ENUM (
  'student',
  'teacher',
  'admin',
  'specific_user'
);

-- Create email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type email_trigger_type NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create email triggers table
CREATE TABLE email_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id),
  trigger_type email_trigger_type NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create email receivers table
CREATE TABLE email_receivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id),
  receiver_type email_receiver_type NOT NULL,
  specific_user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX idx_email_templates_trigger_type ON email_templates(trigger_type);
CREATE INDEX idx_email_triggers_template_id ON email_triggers(template_id);
CREATE INDEX idx_email_receivers_template_id ON email_receivers(template_id);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_triggers_updated_at BEFORE UPDATE ON email_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
