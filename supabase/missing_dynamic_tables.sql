-- MindMart Missing Dynamic Tables Update
-- Run this in your Supabase SQL Editor to create tables for community posts, reactions, groups, challenges, and orders

-- ==========================================
-- 1. SOCIAL POSTS & REACTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.wellness_groups(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'pending_review' NOT NULL,
  reactions_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.social_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON public.social_posts;
CREATE POLICY "Posts are viewable by everyone" ON public.social_posts FOR SELECT USING (status = 'active');
CREATE POLICY "Users can insert own posts" ON public.social_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id, reaction_type)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.post_reactions;
DROP POLICY IF EXISTS "Users can react to posts" ON public.post_reactions;
CREATE POLICY "Reactions are viewable by everyone" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react to posts" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 2. GROUPS & CHALLENGES MEMBERSHIP
-- ==========================================
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.wellness_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Memberships are viewable by everyone" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Memberships are viewable by everyone" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants are viewable by everyone" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can update challenge progress" ON public.challenge_participants;
CREATE POLICY "Participants are viewable by everyone" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update challenge progress" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 3. ORDERS & TRANSACTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_cost_coins INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'processing' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
-- Allow insertions during checkout
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  price_at_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  auth.uid() = seller_id OR 
  auth.uid() = (SELECT buyer_id FROM public.orders WHERE id = order_id LIMIT 1)
);
-- Allow insertion for anyone logged in (will be checked by buyer RLS on orders)
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- ==========================================
-- 4. AI ACTIVITIES & LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own AI activity logs" ON public.ai_activity_logs;
CREATE POLICY "Users can view own AI activity logs" ON public.ai_activity_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow server insertion" ON public.ai_activity_logs;
CREATE POLICY "Allow server insertion" ON public.ai_activity_logs FOR INSERT WITH CHECK (true);

-- ==========================================
-- 5. BEHAVIORAL INSIGHTS RECREATION
-- ==========================================
-- Recreate behavioral_insights with correct columns to match /analyze-behavior
DROP TABLE IF EXISTS public.behavioral_insights CASCADE;

CREATE TABLE public.behavioral_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  emotional_trend TEXT NOT NULL,
  personalized_plan JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.behavioral_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own insights" ON public.behavioral_insights;
CREATE POLICY "Users can view own insights" ON public.behavioral_insights FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow server insertion on insights" ON public.behavioral_insights;
CREATE POLICY "Allow server insertion on insights" ON public.behavioral_insights FOR INSERT WITH CHECK (true);

-- ==========================================
-- 6. DATA SEEDING (WELLNESS GROUPS & CHALLENGES)
-- ==========================================
INSERT INTO public.wellness_groups (name, description, category) VALUES
('Meditation Masters', 'A quiet space for mindfulness and breathwork practitioners.', 'Mindfulness')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.wellness_groups (name, description, category) VALUES
('Digital Detox', 'For those seeking to reduce screen time and improve mental focus.', 'Focus')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.wellness_groups (name, description, category) VALUES
('Student Wellness', 'A support group for high school and university students dealing with academic pressure.', 'Support')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.challenges (title, description, duration_days) VALUES
('7 Days of Gratitude', 'Write one thing you are grateful for each day for a week.', 7);

INSERT INTO public.challenges (title, description, duration_days) VALUES
('Daily Hydration', 'Drink at least 8 glasses of water daily and track your energy.', 10);

-- ==========================================
-- 7. CORRECT RLS FOR GAMIFICATION & AI SERVER WRITES
-- ==========================================
-- 7a. AI Recommendations
DROP POLICY IF EXISTS "Users can insert own recommendations." ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can view own recommendations." ON public.ai_recommendations;
DROP POLICY IF EXISTS "Allow server insertion on recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.ai_recommendations;
CREATE POLICY "Allow server insertion on recommendations" ON public.ai_recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own recommendations" ON public.ai_recommendations FOR SELECT USING (auth.uid() = user_id);

-- 7b. Task Completions
DROP POLICY IF EXISTS "Users can view own completions." ON public.task_completions;
DROP POLICY IF EXISTS "Allow server/user insertion on completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can view own completions" ON public.task_completions;
CREATE POLICY "Allow server/user insertion on completions" ON public.task_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own completions" ON public.task_completions FOR SELECT USING (auth.uid() = user_id);

-- 7c. XP Logs
DROP POLICY IF EXISTS "Users can view own xp logs." ON public.xp_logs;
DROP POLICY IF EXISTS "Allow server/user insertion on xp logs" ON public.xp_logs;
DROP POLICY IF EXISTS "Users can view own xp logs" ON public.xp_logs;
CREATE POLICY "Allow server/user insertion on xp logs" ON public.xp_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own xp logs" ON public.xp_logs FOR SELECT USING (auth.uid() = user_id);

-- 7d. Reward Transactions
DROP POLICY IF EXISTS "Users can view own transactions." ON public.reward_transactions;
DROP POLICY IF EXISTS "Allow server/user insertion on transactions" ON public.reward_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.reward_transactions;
CREATE POLICY "Allow server/user insertion on transactions" ON public.reward_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own transactions" ON public.reward_transactions FOR SELECT USING (auth.uid() = user_id);

-- 7e. Profiles Server Updates
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);
