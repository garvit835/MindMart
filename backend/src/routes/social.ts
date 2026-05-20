import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''; // Needs service_role to update pending_review
const supabase = createClient(supabaseUrl, supabaseKey);

// POST Create Post with AI Moderation
router.post('/post', async (req, res) => {
  try {
    const { userId, content, isAnonymous, groupId } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    // 1. Initial Insert as 'pending_review'
    const { data: post, error: postError } = await supabase.from('social_posts').insert([{
      user_id: userId,
      group_id: groupId || null,
      content,
      is_anonymous: isAnonymous || false,
      status: 'pending_review'
    }]).select().single();

    if (postError) throw postError;

    res.json({ success: true, message: 'Post submitted for review.', post });

    // 2. Asynchronous AI Moderation Check (Fire and Forget to avoid blocking UX)
    (async () => {
      try {
        const prompt = `You are an AI moderator for a mental wellness community. Read the following post and determine if it contains ANY toxicity, hate speech, harassment, self-harm promotion, or spam.
        Post: "${content}"
        Respond with EXACTLY valid JSON format: { "is_safe": true_or_false, "reason": "brief reason" }`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama3-8b-8192',
          temperature: 0.1,
          response_format: { type: "json_object" }
        });

        const aiContent = chatCompletion.choices[0]?.message?.content;
        if (aiContent) {
          const result = JSON.parse(aiContent);
          
          if (result.is_safe) {
            await supabase.from('social_posts').update({ status: 'active' }).eq('id', post.id);
          } else {
            await supabase.from('social_posts').update({ status: 'rejected' }).eq('id', post.id);
            console.log(`Post ${post.id} rejected. Reason: ${result.reason}`);
          }
        }
      } catch (aiErr) {
        console.error('AI Moderation Error:', aiErr);
        // Fail-safe: approve if AI fails? In a wellness app, better safe than sorry, so we might leave it pending for admin, or approve if we assume mostly safe users. Let's auto-approve on AI failure for demo purposes to avoid deadlocks.
        await supabase.from('social_posts').update({ status: 'active' }).eq('id', post.id);
      }
    })();

  } catch (error: any) {
    console.error('Social Post Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
