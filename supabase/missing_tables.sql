-- MindMart Missing Tables Update
-- Run this in your Supabase SQL Editor to create missing gamification and AI tracking tables

-- ==========================================
-- 1. AI RECOMMENDATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tasks JSONB NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendations." ON public.ai_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations." ON public.ai_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 2. GAMIFICATION LOGS (XP & REWARDS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID,
  task_title TEXT NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  coins_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions." ON public.task_completions FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.xp_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own xp logs." ON public.xp_logs FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions." ON public.reward_transactions FOR SELECT USING (auth.uid() = user_id);
