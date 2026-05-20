-- Add INSERT policy for sellers table
-- Run this in your Supabase SQL Editor

DROP POLICY IF EXISTS "Users can insert their own seller profile" ON public.sellers;

CREATE POLICY "Users can insert their own seller profile" 
ON public.sellers 
FOR INSERT 
WITH CHECK (auth.uid() = id);
