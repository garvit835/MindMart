const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../frontend/.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Seeding MindMart Demo Data...');

  // 1. Seed Wellness Groups
  console.log('Creating Wellness Groups...');
  const groups = [
    { name: 'Meditation Masters', description: 'Daily guided mindfulness.', category: 'mindfulness' },
    { name: 'Digital Detox', description: 'Reducing screen time together.', category: 'focus' },
    { name: 'Student Wellness', description: 'Balancing academics and health.', category: 'general' }
  ];
  
  for (const g of groups) {
    await supabase.from('wellness_groups').upsert({ name: g.name, description: g.description, category: g.category }, { onConflict: 'name' });
  }

  // 2. Seed Challenges
  console.log('Creating Challenges...');
  const challenges = [
    { title: '7 Days of Gratitude', description: 'Post one thing you are grateful for daily.', duration_days: 7 },
    { title: 'Daily Hydration', description: 'Drink 8 glasses of water.', duration_days: 1 }
  ];

  for (const c of challenges) {
    await supabase.from('challenges').insert(c);
  }

  // 3. Seed Products
  console.log('Creating Demo Products...');
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  if (users && users.length > 0) {
    const sellerId = users[0].id;
    
    // Make them a seller if not already
    await supabase.from('sellers').upsert({ id: sellerId, shop_name: 'MindMart Official' });

    const products = [
      { seller_id: sellerId, title: 'Bamboo Yoga Block', price_in_mindcoins: 500, stock: 100, category: 'fitness', is_active: true },
      { seller_id: sellerId, title: 'Organic Sleep Tea', price_in_mindcoins: 250, stock: 50, category: 'wellness', is_active: true },
      { seller_id: sellerId, title: 'Minimalist Focus Planner', price_in_mindcoins: 800, stock: 200, category: 'productivity', is_active: true }
    ];

    for (const p of products) {
      await supabase.from('products').insert(p);
    }
  }

  console.log('✅ Seeding Complete! MindMart is ready for demo.');
}

seed().catch(console.error);
