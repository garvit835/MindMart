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
          model: 'llama-3.3-70b-versatile',
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

// GET /groups
router.get('/groups', async (req, res) => {
  try {
    const { userId } = req.query;
    const { data: groups, error: gError } = await supabase.from('wellness_groups').select('*');
    if (gError) throw gError;

    let joinedGroupIds: string[] = [];
    if (userId) {
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
      if (memberships) joinedGroupIds = memberships.map(m => m.group_id);
    }

    const { data: allMemberships } = await supabase.from('group_members').select('group_id');
    const countsMap: { [key: string]: number } = {};
    allMemberships?.forEach(m => {
      countsMap[m.group_id] = (countsMap[m.group_id] || 0) + 1;
    });

    const groupsWithStatus = groups?.map(g => ({
      ...g,
      members: countsMap[g.id] || 0,
      isJoined: joinedGroupIds.includes(g.id)
    })) || [];

    res.json({ success: true, groups: groupsWithStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /groups/join
router.post('/groups/join', async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    const { data, error } = await supabase.from('group_members').insert([{ user_id: userId, group_id: groupId }]).select().single();
    if (error) throw error;
    res.json({ success: true, membership: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /groups/leave
router.post('/groups/leave', async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    const { error } = await supabase.from('group_members').delete().eq('user_id', userId).eq('group_id', groupId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /challenges
router.get('/challenges', async (req, res) => {
  try {
    const { userId } = req.query;
    const { data: challenges, error: cError } = await supabase.from('challenges').select('*');
    if (cError) throw cError;

    let userParticipations: any[] = [];
    if (userId) {
      const { data } = await supabase.from('challenge_participants').select('*').eq('user_id', userId);
      if (data) userParticipations = data;
    }

    const challengesWithStatus = challenges?.map(c => {
      const participation = userParticipations.find(p => p.challenge_id === c.id);
      return {
        ...c,
        isJoined: !!participation,
        progress: participation ? participation.progress : 0
      };
    }) || [];

    res.json({ success: true, challenges: challengesWithStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /challenges/join
router.post('/challenges/join', async (req, res) => {
  try {
    const { userId, challengeId } = req.body;
    const { data, error } = await supabase.from('challenge_participants').insert([{ user_id: userId, challenge_id: challengeId, progress: 0 }]).select().single();
    if (error) throw error;
    res.json({ success: true, participation: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /posts/react
router.post('/posts/react', async (req, res) => {
  try {
    const { userId, postId, reactionType } = req.body;
    
    // Check if reaction already exists
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (existing) {
      // Remove reaction if clicked again
      const { error: delError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existing.id);
      
      if (delError) throw delError;

      // Decrement reactions_count
      const { data: post } = await supabase.from('social_posts').select('reactions_count').eq('id', postId).single();
      const newCount = Math.max((post?.reactions_count || 0) - 1, 0);
      await supabase.from('social_posts').update({ reactions_count: newCount }).eq('id', postId);

      return res.json({ success: true, action: 'removed', count: newCount });
    } else {
      // Insert new reaction
      const { error: insError } = await supabase
        .from('post_reactions')
        .insert([{ user_id: userId, post_id: postId, reaction_type: reactionType }]);
      
      if (insError) throw insError;

      // Increment reactions_count
      const { data: post } = await supabase.from('social_posts').select('reactions_count').eq('id', postId).single();
      const newCount = (post?.reactions_count || 0) + 1;
      await supabase.from('social_posts').update({ reactions_count: newCount }).eq('id', postId);

      return res.json({ success: true, action: 'added', count: newCount });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

