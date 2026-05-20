import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''; // Typically use Service Role key for admin actions in real apps
const supabase = createClient(supabaseUrl, supabaseKey);

// GET AI Recommendation based on mood
router.post('/recommend', async (req, res) => {
  try {
    const { userId, currentMood, notes } = req.body;
    
    if (!userId || !currentMood) {
      return res.status(400).json({ error: 'userId and currentMood are required' });
    }

    const prompt = `You are a compassionate, non-toxic AI mental wellness guide. The user is currently feeling "${currentMood}" and noted: "${notes || 'none'}". Generate 3 short, personalized wellness tasks to help them, and a short supportive message. 
    Format your response EXACTLY as valid JSON with the following structure:
    {
      "message": "A short comforting message (max 2 sentences)",
      "tasks": [
        { "title": "Task 1 title", "description": "Short description" },
        { "title": "Task 2 title", "description": "Short description" },
        { "title": "Task 3 title", "description": "Short description" }
      ]
    }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content;
    
    if (!aiContent) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    const aiData = JSON.parse(aiContent);

    // Store in DB for caching/history
    const { data: dbData, error } = await supabase.from('ai_recommendations').insert([
      {
        user_id: userId,
        tasks: aiData.tasks,
        message: aiData.message
      }
    ]).select().single();

    if (error) {
      console.error('Supabase Error:', error);
      // Still return the AI data even if DB insert fails
    }

    res.json({ recommendation: dbData || { tasks: aiData.tasks, message: aiData.message } });

  } catch (error: any) {
    console.error('Groq/Backend Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST Complete Task (Gamification)
router.post('/complete', async (req, res) => {
  try {
    const { userId, taskId, taskTitle } = req.body;

    if (!userId || !taskTitle) {
      return res.status(400).json({ error: 'userId and taskTitle are required' });
    }

    // Award 50 XP and 10 MindCoins
    const xpAwarded = 50;
    const coinsAwarded = 10;

    // 1. Log completion
    await supabase.from('task_completions').insert([{
      user_id: userId,
      task_id: taskId,
      task_title: taskTitle,
      xp_awarded: xpAwarded,
      coins_awarded: coinsAwarded
    }]);

    // 2. Log XP
    await supabase.from('xp_logs').insert([{
      user_id: userId,
      amount: xpAwarded,
      reason: 'Completed task: ' + taskTitle
    }]);

    // 3. Log Reward Transaction
    await supabase.from('reward_transactions').insert([{
      user_id: userId,
      amount: coinsAwarded,
      transaction_type: 'earned',
      description: 'Reward for: ' + taskTitle
    }]);

    // 4. Update Profile XP
    const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', userId).single();
    let newXp = (profile?.xp || 0) + xpAwarded;
    let currentLevel = profile?.level || 1;
    let levelUp = false;

    // Simple level progression: 200 XP per level
    if (newXp >= currentLevel * 200) {
      currentLevel += 1;
      levelUp = true;
    }

    await supabase.from('profiles').update({ xp: newXp, level: currentLevel }).eq('id', userId);

    res.json({ success: true, xpAwarded, coinsAwarded, newXp, currentLevel, levelUp });

  } catch (error: any) {
    console.error('Completion Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
