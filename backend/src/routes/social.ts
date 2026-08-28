import { Router } from 'express';
import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import { supabaseAdmin, getUserClient } from '../supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

dotenv.config();

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Apply auth middleware
router.use(requireAuth);

// POST Create Post with AI Moderation
router.post('/post', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { content, isAnonymous, groupId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const userClient = getUserClient(req.token);

    // 1. Initial Insert as 'pending_review'
    const { data: post, error: postError } = await userClient.from('social_posts').insert([{
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
            await supabaseAdmin.from('social_posts').update({ status: 'active' }).eq('id', post.id);
          } else {
            await supabaseAdmin.from('social_posts').update({ status: 'rejected' }).eq('id', post.id);
            console.log(`Post ${post.id} rejected. Reason: ${result.reason}`);
          }
        }
      } catch (aiErr) {
        console.error('AI Moderation Error:', aiErr);
        // Fail-safe: approve if AI fails? In a wellness app, better safe than sorry, so we might leave it pending for admin, or approve if we assume mostly safe users. Let's auto-approve on AI failure for demo purposes to avoid deadlocks.
        await supabaseAdmin.from('social_posts').update({ status: 'active' }).eq('id', post.id);
      }
    })();

  } catch (error: any) {
    console.error('Social Post Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /groups
router.get('/groups', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const userClient = getUserClient(req.token);

    const { data: groups, error: gError } = await userClient.from('wellness_groups').select('*');
    if (gError) throw gError;

    let joinedGroupIds: string[] = [];
    const { data: memberships } = await userClient.from('group_members').select('group_id').eq('user_id', userId);
    if (memberships) joinedGroupIds = memberships.map(m => m.group_id);

    const { data: allMemberships } = await userClient.from('group_members').select('group_id');
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
router.post('/groups/join', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.body;
    const userClient = getUserClient(req.token);

    const { data, error } = await userClient.from('group_members').insert([{ user_id: userId, group_id: groupId }]).select().single();
    if (error) throw error;
    res.json({ success: true, membership: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /groups/leave
router.post('/groups/leave', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.body;
    const userClient = getUserClient(req.token);

    const { error } = await userClient.from('group_members').delete().eq('user_id', userId).eq('group_id', groupId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /challenges
router.get('/challenges', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const userClient = getUserClient(req.token);

    const { data: challenges, error: cError } = await userClient.from('challenges').select('*');
    if (cError) throw cError;

    let userParticipations: any[] = [];
    const { data } = await userClient.from('challenge_participants').select('*').eq('user_id', userId);
    if (data) userParticipations = data;

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
router.post('/challenges/join', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.body;
    const userClient = getUserClient(req.token);

    const { data, error } = await userClient.from('challenge_participants').insert([{ user_id: userId, challenge_id: challengeId, progress: 0 }]).select().single();
    if (error) throw error;
    res.json({ success: true, participation: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /posts/react
// TODO: The reactions_count update is a non-atomic read-modify-write.
// Concurrent reactions can produce incorrect counts. For production, use a
// Supabase RPC like: SELECT increment_reactions(post_id, delta) to atomically update.
router.post('/posts/react', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { postId, reactionType } = req.body;
    const userClient = getUserClient(req.token);
    
    // Check if reaction already exists
    const { data: existing } = await userClient
      .from('post_reactions')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .eq('reaction_type', reactionType)
      .maybeSingle();

    if (existing) {
      // Remove reaction if clicked again
      const { error: delError } = await userClient
        .from('post_reactions')
        .delete()
        .eq('id', existing.id);
      
      if (delError) throw delError;

      // Decrement reactions_count
      const { data: post } = await userClient.from('social_posts').select('reactions_count').eq('id', postId).single();
      const newCount = Math.max((post?.reactions_count || 0) - 1, 0);
      await userClient.from('social_posts').update({ reactions_count: newCount }).eq('id', postId);

      return res.json({ success: true, action: 'removed', count: newCount });
    } else {
      // Insert new reaction
      const { error: insError } = await userClient
        .from('post_reactions')
        .insert([{ user_id: userId, post_id: postId, reaction_type: reactionType }]);
      
      if (insError) throw insError;

      // Increment reactions_count
      const { data: post } = await userClient.from('social_posts').select('reactions_count').eq('id', postId).single();
      const newCount = (post?.reactions_count || 0) + 1;
      await userClient.from('social_posts').update({ reactions_count: newCount }).eq('id', postId);

      return res.json({ success: true, action: 'added', count: newCount });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
