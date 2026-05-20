import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /analyze-behavior
router.post('/analyze-behavior', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Fetch last 7 days of mood logs and completed tasks
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: moods } = await supabase
      .from('mood_logs')
      .select('mood_score, note, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: tasks } = await supabase
      .from('task_completions')
      .select('task_title, completed_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const prompt = `You are an AI wellness analyst. Analyze the following data for a user over the last 7 days.
    Moods (scores 1-10): ${JSON.stringify(moods)}
    Completed Tasks: ${JSON.stringify(tasks)}
    
    1. Identify their emotional trend. Are they burnt out? Improving? Stable?
    2. Generate a personalized 3-step wellness plan for the upcoming week based on this trend.
    3. Determine if they are in "crisis_mode" (e.g. extremely low scores, hopeless notes).
    
    Return EXACTLY valid JSON:
    {
      "emotional_trend": "String describing the trend",
      "personalized_plan": ["Step 1", "Step 2", "Step 3"],
      "crisis_mode": true_or_false
    }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content;
    if (!aiContent) throw new Error("Failed to generate AI insight");
    const result = JSON.parse(aiContent);

    // Update Profile Crisis Mode if triggered
    if (result.crisis_mode) {
      await supabase.from('profiles').update({ crisis_mode: true }).eq('id', userId);
      await supabase.from('ai_activity_logs').insert([{ user_id: userId, action_type: 'crisis_detected', details: 'Triggered by /analyze-behavior' }]);
    }

    // Save Insight
    const { data: insight } = await supabase.from('behavioral_insights').insert([{
      user_id: userId,
      period_start: sevenDaysAgo.toISOString(),
      period_end: new Date().toISOString(),
      emotional_trend: result.emotional_trend,
      personalized_plan: result.personalized_plan
    }]).select().single();

    res.json({ success: true, insight, crisis_mode: result.crisis_mode });

  } catch (error: any) {
    console.error('Analyze Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /recommend-marketplace
router.post('/recommend-marketplace', async (req, res) => {
  try {
    const { userId } = req.body;
    // In a full app, we'd pass their insights to Groq. For speed, we just return mock AI filtered data.
    // Fetch all products
    const { data: products } = await supabase.from('products').select('*').eq('is_active', true).limit(10);
    
    res.json({ success: true, recommendations: products?.slice(0, 3) || [] });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
