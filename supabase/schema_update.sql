-- MindMart Schema Update (Delta: Phase 2 through Phase 6)
-- Run this if you already have the Phase 1 schema applied.

-- ==========================================
-- 1. ADD NEW COLUMNS TO EXISTING TABLES
-- ==========================================

-- Profiles (Gamification & AI Safety)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 100.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS abuse_flags INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crisis_mode BOOLEAN DEFAULT false;

-- Wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS mindcoins_balance INTEGER DEFAULT 0;

-- Mood Logs
ALTER TABLE public.mood_logs ADD COLUMN IF NOT EXISTS mood_type TEXT;

-- Products (Marketplace updates)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_in_mindcoins INTEGER NOT NULL DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Posts (Social)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;


-- ==========================================
-- 2. CREATE ENTIRELY NEW TABLES & POLICIES
-- ==========================================

-- Sellers
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  shop_name TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers are viewable by everyone." ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Sellers can update own profile." ON public.sellers FOR UPDATE USING (auth.uid() = id);


-- Wellness Groups
CREATE TABLE IF NOT EXISTS public.wellness_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wellness_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups are viewable by everyone." ON public.wellness_groups FOR SELECT USING (true);


-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are viewable by everyone." ON public.challenges FOR SELECT USING (true);


-- Behavioral Insights (AI)
CREATE TABLE IF NOT EXISTS public.behavioral_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  insight_text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.behavioral_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insights." ON public.behavioral_insights FOR SELECT USING (auth.uid() = user_id);
