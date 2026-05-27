import { Router } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { supabaseAdmin, getUserClient } from '../supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

dotenv.config();

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Apply authentication middleware to all wellness routes
router.use(requireAuth);

// GET AI Recommendation based on mood
router.post('/recommend', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { currentMood, notes } = req.body;
    
    if (!currentMood) {
      return res.status(400).json({ error: 'currentMood is required' });
    }

    const prompt = `You are a compassionate, non-toxic AI mental wellness guide. The user is currently feeling "${currentMood}" and noted: "${notes || 'none'}". Generate 3 short, personalized wellness tasks to help them, and a short supportive message. 
    Format your response EXACTLY as valid JSON with the following structure:
    {
      "message": "A short comforting message (max 2 sentences)",
      "tasks": [
        { "title": "Task 1 title", "description": "Short description" }
      ]
    }`;

    // Note: prompt asks for 3, example shows 1 structure. We'll stick to the original logic
    const detailedPrompt = `You are a compassionate, non-toxic AI mental wellness guide. The user is currently feeling "${currentMood}" and noted: "${notes || 'none'}". Generate 3 short, personalized wellness tasks to help them, and a short supportive message. 
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
      messages: [{ role: 'user', content: detailedPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content;
    
    if (!aiContent) {
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    const aiData = JSON.parse(aiContent);

    // Store in DB for caching/history using admin client (bypasses direct user write RLS restrictions if any)
    const { data: dbData, error } = await supabaseAdmin.from('ai_recommendations').insert([
      {
        user_id: userId,
        tasks: aiData.tasks,
        message: aiData.message
      }
    ]).select().single();

    if (error) {
      console.error('Supabase Error:', error);
    }

    res.json({ recommendation: dbData || { tasks: aiData.tasks, message: aiData.message } });

  } catch (error: any) {
    console.error('Groq/Backend Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST Complete Task (Gamification)
router.post('/complete', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { taskId, taskTitle } = req.body;

    if (!taskTitle) {
      return res.status(400).json({ error: 'taskTitle is required' });
    }

    // Award 50 XP and 10 MindCoins
    const xpAwarded = 50;
    const coinsAwarded = 10;

    // Use admin client to perform trusted state changes: logs, rewards, and profiles updates.
    // 1. Log completion
    await supabaseAdmin.from('task_completions').insert([{
      user_id: userId,
      task_id: taskId || null,
      task_title: taskTitle,
      xp_awarded: xpAwarded,
      coins_awarded: coinsAwarded
    }]);

    // 2. Log XP
    await supabaseAdmin.from('xp_logs').insert([{
      user_id: userId,
      amount: xpAwarded,
      reason: 'Completed task: ' + taskTitle
    }]);

    // 3. Log Reward Transaction
    await supabaseAdmin.from('reward_transactions').insert([{
      user_id: userId,
      amount: coinsAwarded,
      transaction_type: 'earned',
      description: 'Reward for: ' + taskTitle
    }]);

    // 4. Update Profile XP
    const { data: profile } = await supabaseAdmin.from('profiles').select('xp, level').eq('id', userId).single();
    let newXp = (profile?.xp || 0) + xpAwarded;
    let currentLevel = profile?.level || 1;
    let levelUp = false;

    // Simple level progression: 200 XP per level
    if (newXp >= currentLevel * 200) {
      currentLevel += 1;
      levelUp = true;
    }

    await supabaseAdmin.from('profiles').update({ xp: newXp, level: currentLevel }).eq('id', userId);

    res.json({ success: true, xpAwarded, coinsAwarded, newXp, currentLevel, levelUp });

  } catch (error: any) {
    console.error('Completion Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
