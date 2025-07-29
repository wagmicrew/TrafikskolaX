-- Add booking_steps table for Swedish driving education curriculum
CREATE TABLE IF NOT EXISTS booking_steps (
  id SERIAL PRIMARY KEY,
  step_number INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add step_identifier column to user_feedback table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'userFeedback' AND column_name = 'step_identifier') THEN
        ALTER TABLE "userFeedback" ADD COLUMN step_identifier VARCHAR(50);
    END IF;
END $$;

-- Add valuation column to user_feedback table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'userFeedback' AND column_name = 'valuation') THEN
        ALTER TABLE "userFeedback" ADD COLUMN valuation INTEGER CHECK (valuation >= 1 AND valuation <= 10);
    END IF;
END $$;

-- Insert Swedish driving education steps based on Utbildningskort B
INSERT INTO booking_steps (step_number, category, subcategory, description) VALUES 
-- 1. Körställning
(1, 'Körställning', 'stol och halte', 'Justering av förarstol och säkerhetsbälte'),
(1, 'Körställning', 'reglage och instrument', 'Förtrogenhetsträning med bilens reglage och instrument'),

-- 2. Inledande manövrering
(2, 'Inledande manövrering', 'start och stannade', 'Grundläggande start- och stanningsteknik'),
(2, 'Inledande manövrering', 'koppling och styrning', 'Kopplings- och styrningsövningar'),

-- 3. Växling
(3, 'Växling', 'uppväxling', 'Teknik för uppväxling'),
(3, 'Växling', 'bromsning', 'Bromsningstekniker'),
(3, 'Växling', 'nedväxling', 'Teknik för nedväxling'),

-- 4. Lutning
(4, 'Lutning', 'motlut', 'Körning i motlut'),
(4, 'Lutning', 'medlut', 'Körning i medlut'),

-- 5. Manövrering
(5, 'Manövrering', 'backning', 'Backningsmanövrer'),
(5, 'Manövrering', 'vändning', 'Vändningsmanövrer'),
(5, 'Manövrering', 'parkering', 'Parkeringsmanövrer'),

-- 6. Funktion och kontroll
(6, 'Funktion och kontroll', 'bilen', 'Bilens funktioner och kontroller'),
(6, 'Funktion och kontroll', 'last och passagerare', 'Hantering av last och passagerare'),
(6, 'Funktion och kontroll', 'säkerhetsavstånd', 'Säkerhetsavstånd och positionering'),
(6, 'Funktion och kontroll', 'säkerhetskontroll', 'Säkerhetskontroller av fordonet'),

-- 7. Samordning och bromsning
(7, 'Samordning och bromsning', 'avseende och riskbedömning', 'Avseende och riskbedömning i trafiken'),
(7, 'Samordning och bromsning', 'samordning och motorik', 'Samordning och motoriska färdigheter'),
(7, 'Samordning och bromsning', 'acceleration', 'Accelerationsteknik'),
(7, 'Samordning och bromsning', 'härd bromsning', 'Nödbromsning och härd bromsning'),

-- 8. Mindre samhälle
(8, 'Mindre samhälle', 'avseende och riskbedömning', 'Riskbedömning i mindre samhällen'),
(8, 'Mindre samhälle', 'hastighetanpassning', 'Hastighetanpassning'),
(8, 'Mindre samhälle', 'placering', 'Korrekt placering på körbanan'),
(8, 'Mindre samhälle', 'väjningsregler', 'Väjningsregler och trafiklogik'),
(8, 'Mindre samhälle', 'mittracksväg', 'Körning på vägar med mittracke'),

-- 9. Mindre landsväg
(9, 'Mindre landsväg', 'avseende och riskbedömning', 'Riskbedömning på landsvägar'),
(9, 'Mindre landsväg', 'hastighetanpassning', 'Hastighetanpassning på landsväg'),
(9, 'Mindre landsväg', 'placering', 'Placering på landsväg'),
(9, 'Mindre landsväg', 'väjningsregler', 'Väjningsregler på landsväg'),
(9, 'Mindre landsväg', 'trafikrorsning', 'Navigation av trafikrorsningar'),

-- 10. Stad
(10, 'Stad', 'avseende och riskbedömning', 'Riskbedömning i stadstrafik'),
(10, 'Stad', 'hastighetanpassning', 'Hastighetanpassning i stad'),
(10, 'Stad', 'placering', 'Placering i stadstrafik'),
(10, 'Stad', 'väjningsregler', 'Väjningsregler i stadstrafik'),
(10, 'Stad', 'trafiksignal', 'Trafiksignaler och ljusreglering'),
(10, 'Stad', 'enkelriktad trafik', 'Enkelriktad trafik'),
(10, 'Stad', 'cirkulationsplats', 'Cirkulationsplatser'),
(10, 'Stad', 'vändning och parkering', 'Vändning och parkering i stad'),

-- 11. Landsväg
(11, 'Landsväg', 'avseende och riskbedömning', 'Riskbedömning på större landsvägar'),
(11, 'Landsväg', 'hastighetanpassning', 'Hastighetanpassning på landsväg'),
(11, 'Landsväg', 'placering', 'Placering på landsväg'),
(11, 'Landsväg', 'påfart och avfart', 'Påfarter och avfarter'),
(11, 'Landsväg', 'omkörning', 'Omkörningsmanövrer'),
(11, 'Landsväg', 'vändning och parkering', 'Vändning och parkering på landsväg'),

-- 12. Högfartsväg
(12, 'Högfartsväg', 'avseende och riskbedömning', 'Riskbedömning på högfartsvägar'),
(12, 'Högfartsväg', 'hastighetanpassning', 'Hastighetanpassning på högfartsväg'),
(12, 'Högfartsväg', 'motorväg', 'Körning på motorväg'),
(12, 'Högfartsväg', 'motortrafikled', 'Körning på motortrafikled'),
(12, 'Högfartsväg', 'mittracksväg', 'Mittracksvägar'),

-- 13. Mörker
(13, 'Mörker', 'avseende och riskbedömning', 'Riskbedömning vid mörker'),
(13, 'Mörker', 'hastighetanpassning', 'Hastighetanpassning i mörker'),
(13, 'Mörker', 'mörkerdemonstration', 'Demonstration av mörkerseende'),
(13, 'Mörker', 'möte', 'Möten i mörker'),
(13, 'Mörker', 'omkörning', 'Omkörning i mörker'),
(13, 'Mörker', 'parkering', 'Parkering i mörker'),
(13, 'Mörker', 'ställsatt stol', 'Körställning i mörker'),

-- 14. Halt väglag
(14, 'Halt väglag', 'olika typer av halka', 'Olika typer av halt väglag'),
(14, 'Halt väglag', 'utrustning och hjälpsystem', 'Säkerhetsutrustning och hjälpsystem'),

-- 15. Utbildningskontroll
(15, 'Utbildningskontroll', 'tillämpad stadskörning', 'Tillämpad körning i stadsmiljö'),
(15, 'Utbildningskontroll', 'tillämpad landsvägskörning', 'Tillämpad körning på landsväg'),
(15, 'Utbildningskontroll', 'utbildningskontroll', 'Slutlig utbildningskontroll');

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_booking_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_booking_steps_updated_at_trigger
    BEFORE UPDATE ON booking_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_steps_updated_at();
