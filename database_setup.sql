
-- Supabase Database Setup for AddaSangi
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create stories table if not exists
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL,
  music_url TEXT,
  music_title TEXT
);

-- 2. Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON stories;
DROP POLICY IF EXISTS "Users can insert their own stories" ON stories;

-- 4. Create proper policies
-- Anyone signed in can view stories
CREATE POLICY "Stories are viewable by everyone" 
ON stories FOR SELECT 
TO authenticated 
USING (true);

-- Users can only insert their own stories
CREATE POLICY "Users can insert their own stories" 
ON stories FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Optional: Users can delete their own stories
DROP POLICY IF EXISTS "Users can delete their own stories" ON stories;
CREATE POLICY "Users can delete their own stories" 
ON stories FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
