-- MindMart Complete Schema Update (Idempotent for Phases 1-6)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES & CORE AUTH
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add new columns safely if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 100.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS abuse_flags INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crisis_mode BOOLEAN DEFAULT false;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- ==========================================
-- 2. ECONOMY & WALLETS (Phase 1 & 3)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS mindcoins_balance INTEGER DEFAULT 0;

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallet." ON public.wallets;
CREATE POLICY "Users can view own wallet." ON public.wallets FOR SELECT USING (auth.uid() = user_id);


-- ==========================================
-- 3. WELLNESS & GAMIFICATION (Phase 2 & 4)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wellness_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wellness_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own tasks." ON public.wellness_tasks;
CREATE POLICY "Users can manage own tasks." ON public.wellness_tasks FOR ALL USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  note TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mood_logs ADD COLUMN IF NOT EXISTS mood_type TEXT;

ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own mood logs." ON public.mood_logs;
CREATE POLICY "Users can manage own mood logs." ON public.mood_logs FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 4. MARKETPLACE (Phase 3)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  shop_name TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers are viewable by everyone." ON public.sellers;
DROP POLICY IF EXISTS "Sellers can update own profile." ON public.sellers;
CREATE POLICY "Sellers are viewable by everyone." ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Sellers can update own profile." ON public.sellers FOR UPDATE USING (auth.uid() = id);


CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Depending on phase 1 schema, seller_id might have referenced profiles directly. 
-- For simplicity and backward compatibility without dropping the column, we'll keep it referencing profiles,
-- but the user must be in the sellers table.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_in_mindcoins INTEGER NOT NULL DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
DROP POLICY IF EXISTS "Users can manage own products." ON public.products;
DROP POLICY IF EXISTS "Sellers can manage own products." ON public.products;
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Sellers can manage own products." ON public.products FOR ALL USING (auth.uid() = seller_id);


-- ==========================================
-- 5. SOCIAL & COMMUNITIES (Phase 4)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wellness_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wellness_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Groups are viewable by everyone." ON public.wellness_groups;
CREATE POLICY "Groups are viewable by everyone." ON public.wellness_groups FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Challenges are viewable by everyone." ON public.challenges;
CREATE POLICY "Challenges are viewable by everyone." ON public.challenges FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
DROP POLICY IF EXISTS "Users can manage own posts." ON public.posts;
CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can manage own posts." ON public.posts FOR ALL USING (auth.uid() = author_id);


-- ==========================================
-- 6. NOTIFICATIONS & ANALYTICS (Phase 5)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notifications." ON public.notifications;
CREATE POLICY "Users can manage own notifications." ON public.notifications FOR ALL USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.behavioral_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  insight_text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.behavioral_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own insights." ON public.behavioral_insights;
CREATE POLICY "Users can view own insights." ON public.behavioral_insights FOR SELECT USING (auth.uid() = user_id);
