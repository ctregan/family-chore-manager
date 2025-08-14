-- Family Chore Manager Database Schema for Supabase
-- Single family with rotating chore assignments and numeric frequency

-- 1. Users table - family members
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  color TEXT NOT NULL DEFAULT '#007AFF',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chore Templates table
CREATE TABLE chore_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  weeks_between INTEGER NOT NULL DEFAULT 1, -- 1=weekly, 2=biweekly, 4=monthly, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Chore Assignments table - defines which users can be assigned to a chore
CREATE TABLE chore_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_template_id UUID NOT NULL REFERENCES chore_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rotation_order INTEGER NOT NULL, -- 1, 2, 3... for rotation sequence
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chore_template_id, user_id),
  UNIQUE(chore_template_id, rotation_order)
);

-- 4. Chore Completions table - tracks who completes chores each week
CREATE TABLE chore_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_template_id UUID NOT NULL REFERENCES chore_templates(id) ON DELETE CASCADE,
  assigned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- who is assigned this week
  completed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- who actually completed it
  week_start_date DATE NOT NULL, -- Monday of the week
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chore_template_id, week_start_date)
);

-- Indexes for performance
CREATE INDEX idx_chore_assignments_chore ON chore_assignments(chore_template_id);
CREATE INDEX idx_chore_assignments_user ON chore_assignments(user_id);
CREATE INDEX idx_chore_completions_week ON chore_completions(week_start_date);
CREATE INDEX idx_chore_completions_assigned_user ON chore_completions(assigned_user_id);
CREATE INDEX idx_chore_completions_chore_week ON chore_completions(chore_template_id, week_start_date);

-- Row Level Security (RLS) - allow all access for single family
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access to chore_templates" ON chore_templates FOR ALL USING (true);
CREATE POLICY "Allow all access to chore_assignments" ON chore_assignments FOR ALL USING (true);
CREATE POLICY "Allow all access to chore_completions" ON chore_completions FOR ALL USING (true);

-- Insert default users
INSERT INTO users (name, color) VALUES 
  ('Charlie', '#FF9500'),
  ('Callie', '#007AFF');

-- Helper function to get Monday of a given date
CREATE OR REPLACE FUNCTION get_week_start(input_date DATE) 
RETURNS DATE AS $$
BEGIN
  RETURN input_date - (EXTRACT(DOW FROM input_date)::INTEGER - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a chore is due for a given week
CREATE OR REPLACE FUNCTION is_chore_due_for_week(
  chore_id UUID,
  week_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  weeks_between INTEGER;
  week_number INTEGER;
BEGIN
  -- Get the frequency of this chore
  SELECT ct.weeks_between INTO weeks_between
  FROM chore_templates ct 
  WHERE ct.id = chore_id;
  
  -- If chore doesn't exist, return false
  IF weeks_between IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate week number since epoch
  week_number := EXTRACT(DAYS FROM (get_week_start(week_date) - DATE '1970-01-05')) / 7;
  
  -- Check if this week number is divisible by the frequency
  RETURN (week_number % weeks_between) = 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get assigned user for a chore in a given week (handles rotation)
CREATE OR REPLACE FUNCTION get_assigned_user_for_week(
  chore_id UUID,
  week_date DATE
) RETURNS UUID AS $$
DECLARE
  assigned_users UUID[];
  weeks_between INTEGER;
  week_number INTEGER;
  occurrence_number INTEGER;
  rotation_index INTEGER;
BEGIN
  -- Only assign if chore is due this week
  IF NOT is_chore_due_for_week(chore_id, week_date) THEN
    RETURN NULL;
  END IF;
  
  -- Get all users assigned to this chore in rotation order
  SELECT array_agg(user_id ORDER BY rotation_order) 
  INTO assigned_users
  FROM chore_assignments 
  WHERE chore_template_id = chore_id;
  
  -- If no users assigned, return NULL
  IF assigned_users IS NULL OR array_length(assigned_users, 1) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Get frequency
  SELECT ct.weeks_between INTO weeks_between
  FROM chore_templates ct 
  WHERE ct.id = chore_id;
  
  -- Calculate which occurrence this is (for rotation)
  week_number := EXTRACT(DAYS FROM (get_week_start(week_date) - DATE '1970-01-05')) / 7;
  occurrence_number := week_number / weeks_between;
  
  -- Calculate which user in rotation based on occurrence
  rotation_index := (occurrence_number % array_length(assigned_users, 1)) + 1;
  
  RETURN assigned_users[rotation_index];
END;
$$ LANGUAGE plpgsql STABLE;