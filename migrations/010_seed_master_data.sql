-- Migration 010: Seed Master Lookup Data for Countries, States, Districts, and Taxonomies
-- Created: 2026-08-06

-- 1. Seed Countries
IF NOT EXISTS (SELECT 1 FROM dbo.Countries WHERE name = 'India')
BEGIN
  INSERT INTO dbo.Countries (name, code) VALUES ('India', 'IN');
  INSERT INTO dbo.Countries (name, code) VALUES ('United States', 'US');
  INSERT INTO dbo.Countries (name, code) VALUES ('United Kingdom', 'UK');
  INSERT INTO dbo.Countries (name, code) VALUES ('Singapore', 'SG');
  INSERT INTO dbo.Countries (name, code) VALUES ('United Arab Emirates', 'AE');
  INSERT INTO dbo.Countries (name, code) VALUES ('Saudi Arabia', 'SA');
  INSERT INTO dbo.Countries (name, code) VALUES ('Qatar', 'QA');
  INSERT INTO dbo.Countries (name, code) VALUES ('Oman (Muscat)', 'OM');
  INSERT INTO dbo.Countries (name, code) VALUES ('Canada', 'CA');
  INSERT INTO dbo.Countries (name, code) VALUES ('Australia', 'AU');
  INSERT INTO dbo.Countries (name, code) VALUES ('Germany', 'DE');
END;

-- 2. Seed Indian States
DECLARE @IndiaId INT = (SELECT id FROM dbo.Countries WHERE name = 'India');

IF @IndiaId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.States WHERE country_id = @IndiaId AND name = 'Tamil Nadu')
BEGIN
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Tamil Nadu');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Karnataka');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Kerala');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Andhra Pradesh');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Telangana');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Maharashtra');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Puducherry');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Madhya Pradesh');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Rajasthan');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Jharkhand');
  INSERT INTO dbo.States (country_id, name) VALUES (@IndiaId, 'Odisha');
END;

-- 3. Seed Tamil Nadu Districts
DECLARE @TNId INT = (SELECT id FROM dbo.States WHERE name = 'Tamil Nadu');

IF @TNId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Districts WHERE state_id = @TNId AND name = 'Sivaganga')
BEGIN
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Sivaganga');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Pudukkottai');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Chennai');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Madurai');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Coimbatore');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Tiruchirappalli');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Thanjavur');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Ramanathapuram');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Salem');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Tirunelveli');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Erode');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Vellore');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Dindigul');
  INSERT INTO dbo.Districts (state_id, name) VALUES (@TNId, 'Kanchipuram');
END;

-- 4. Seed Sivaganga Cities
DECLARE @SivagangaId INT = (SELECT id FROM dbo.Districts WHERE name = 'Sivaganga');

IF @SivagangaId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Cities WHERE district_id = @SivagangaId AND name = 'Karaikudi')
BEGIN
  INSERT INTO dbo.Cities (district_id, name) VALUES (@SivagangaId, 'Karaikudi');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@SivagangaId, 'Devakottai');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@SivagangaId, 'Sivaganga');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@SivagangaId, 'Manamadurai');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@SivagangaId, 'Kalayarkoil');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@SivagangaId, 'Thiruppuvanam');
END;

-- 5. Seed Pudukkottai Cities
DECLARE @PudukkottaiId INT = (SELECT id FROM dbo.Districts WHERE name = 'Pudukkottai');

IF @PudukkottaiId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Cities WHERE district_id = @PudukkottaiId AND name = 'Pudukkottai')
BEGIN
  INSERT INTO dbo.Cities (district_id, name) VALUES (@PudukkottaiId, 'Pudukkottai');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@PudukkottaiId, 'Aranthangi');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@PudukkottaiId, 'Thirumayam');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@PudukkottaiId, 'Alangudi');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@PudukkottaiId, 'Illuppur');
  INSERT INTO dbo.Cities (district_id, name) VALUES (@PudukkottaiId, 'Ponnamaravathi');
END;
