-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_bookings_user_id;
DROP INDEX IF EXISTS idx_bookings_scheduled_date;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_payment_status;
DROP INDEX IF EXISTS idx_blocked_slots_date;
DROP INDEX IF EXISTS idx_slot_settings_day;
DROP INDEX IF EXISTS idx_user_credits_user_lesson;

-- Drop existing tables if they need to be recreated
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;

-- Create slot_settings table
CREATE TABLE IF NOT EXISTS slot_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day_of_week, time_start, time_end)
);

-- Create blocked_slots table for specific day blocks
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  is_all_day BOOLEAN DEFAULT false,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create lesson_types table
CREATE TABLE IF NOT EXISTS lesson_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  price DECIMAL(10,2) NOT NULL,
  price_student DECIMAL(10,2), -- Price for enrolled students
  sale_price DECIMAL(10,2), -- Optional sale price
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  price_student DECIMAL(10,2), -- Price for enrolled students
  sale_price DECIMAL(10,2), -- Optional sale price
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create package_contents table
CREATE TABLE IF NOT EXISTS package_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  lesson_type_id UUID REFERENCES lesson_types(id) ON DELETE CASCADE,
  credits INTEGER DEFAULT 0,
  free_text TEXT, -- For non-lesson perks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create or update bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  lesson_type_id UUID NOT NULL REFERENCES lesson_types(id),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  transmission_type VARCHAR(20) CHECK (transmission_type IN ('manual', 'automatic')),
  teacher_id UUID,
  status VARCHAR(50) DEFAULT 'on_hold' CHECK (status IN ('on_hold', 'booked', 'confirmed', 'completed', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'pending', 'refunded')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('swish', 'klarna', 'qliro', 'credits', 'pay_at_location', 'invoice')),
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  -- Guest booking fields
  is_guest_booking BOOLEAN DEFAULT false,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE -- For soft deletes
);

-- Create user_credits table for package credits
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_type_id UUID NOT NULL REFERENCES lesson_types(id),
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_total INTEGER NOT NULL DEFAULT 0,
  package_id UUID REFERENCES packages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_type_id, package_id)
);

-- Insert default slot settings (weekdays 8-18 with lunch break)
INSERT INTO slot_settings (day_of_week, time_start, time_end) VALUES
-- Monday
(1, '08:00', '09:00'),
(1, '09:00', '10:00'),
(1, '10:00', '11:00'),
(1, '11:00', '12:00'),
(1, '13:00', '14:00'),
(1, '14:00', '15:00'),
(1, '15:00', '16:00'),
(1, '16:00', '17:00'),
(1, '17:00', '18:00'),
-- Tuesday
(2, '08:00', '09:00'),
(2, '09:00', '10:00'),
(2, '10:00', '11:00'),
(2, '11:00', '12:00'),
(2, '13:00', '14:00'),
(2, '14:00', '15:00'),
(2, '15:00', '16:00'),
(2, '16:00', '17:00'),
(2, '17:00', '18:00'),
-- Wednesday
(3, '08:00', '09:00'),
(3, '09:00', '10:00'),
(3, '10:00', '11:00'),
(3, '11:00', '12:00'),
(3, '13:00', '14:00'),
(3, '14:00', '15:00'),
(3, '15:00', '16:00'),
(3, '16:00', '17:00'),
(3, '17:00', '18:00'),
-- Thursday
(4, '08:00', '09:00'),
(4, '09:00', '10:00'),
(4, '10:00', '11:00'),
(4, '11:00', '12:00'),
(4, '13:00', '14:00'),
(4, '14:00', '15:00'),
(4, '15:00', '16:00'),
(4, '16:00', '17:00'),
(4, '17:00', '18:00'),
-- Friday
(5, '08:00', '09:00'),
(5, '09:00', '10:00'),
(5, '10:00', '11:00'),
(5, '11:00', '12:00'),
(5, '13:00', '14:00'),
(5, '14:00', '15:00'),
(5, '15:00', '16:00'),
(5, '16:00', '17:00'),
(5, '17:00', '18:00'),
-- Saturday (shorter hours)
(6, '09:00', '10:00'),
(6, '10:00', '11:00'),
(6, '11:00', '12:00'),
(6, '12:00', '13:00'),
(6, '13:00', '14:00'),
(6, '14:00', '15:00')
ON CONFLICT (day_of_week, time_start, time_end) DO NOTHING;

-- Insert default lesson types from Våra Tjänster
INSERT INTO lesson_types (name, description, duration_minutes, price, price_student) VALUES
('Körlektion', 'Standard körlektion 45 minuter', 45, 550, 495),
('Introduktionslektion', 'Första lektionen för nya elever', 60, 650, 585),
('Riskutbildning 1', 'Riskutbildning del 1 - Halkbana', 240, 1200, 1080),
('Riskutbildning 2', 'Riskutbildning del 2 - Teori och körning', 300, 1400, 1260),
('Uppkörning', 'Uppkörning med Trafikverket', 90, 800, 720),
('Mörkerlektion', 'Körning i mörker', 60, 600, 540),
('Motorvägslektion', 'Körning på motorväg', 90, 750, 675),
('Teorilektion', 'Teoriundervisning i grupp', 90, 200, 180),
('Handledarkurs', 'Kurs för handledare', 180, 400, 360),
('Körkortstillstånd', 'Hjälp med ansökan om körkortstillstånd', 30, 300, 270)
ON CONFLICT DO NOTHING;

-- Insert default packages from Våra Tjänster
INSERT INTO packages (name, description, price, price_student) VALUES
('Startpaket', 'Perfekt för nybörjare - 10 körlektioner + introduktionslektion', 6050, 5445),
('Intensivpaket', '20 körlektioner för snabb progression', 11000, 9900),
('Komplett Paket', 'Allt du behöver - 25 lektioner + risk 1 & 2 + teori', 16950, 15255),
('Risk-paket', 'Risk 1 + Risk 2', 2600, 2340),
('Uppkörningspaket', '5 körlektioner + uppkörning', 3550, 3195)
ON CONFLICT DO NOTHING;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);
CREATE INDEX IF NOT EXISTS idx_slot_settings_day ON slot_settings(day_of_week);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_lesson ON user_credits(user_id, lesson_type_id);

-- Create function to auto-delete on_hold bookings after 10 minutes
CREATE OR REPLACE FUNCTION delete_expired_on_hold_bookings()
RETURNS void AS $$
BEGIN
  UPDATE bookings 
  SET deleted_at = CURRENT_TIMESTAMP
  WHERE status = 'on_hold' 
    AND payment_status = 'unpaid'
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '10 minutes'
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slot_settings_updated_at BEFORE UPDATE ON slot_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_slots_updated_at BEFORE UPDATE ON blocked_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_types_updated_at BEFORE UPDATE ON lesson_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
