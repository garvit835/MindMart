# MindMart 🌿

> An AI-powered mental wellness and sustainable marketplace platform.

MindMart is a revolutionary ecosystem that combines behavioral therapy principles with a sustainable gamified economy. Build healthy habits, earn "MindCoins," and redeem real eco-friendly rewards. 

## Features

- **AI Personalization (Groq Llama 3)**: Analyzes your daily mood logs to generate customized, adaptive wellness routines and tracks your weekly emotional trends.
- **Sustainable Marketplace**: Complete tasks to earn MindCoins. Spend them in our virtual storefront on eco-friendly products.
- **Safe Social Community**: A toxic-free, non-competitive feed. No likes or dislikes—only supportive reactions (🙏, ✨, 🌿). 
- **Crisis Failsafes**: Background AI constantly scans for signs of burnout or severe distress, adapting the UI to prioritize professional support over gamification if needed.
- **Abuse Prevention Engine**: Intelligent velocity and text-uniqueness tracking to ensure the MindCoin economy isn't exploited by spam.

## Tech Stack

- **Frontend**: React Native, Expo Router (Web & Mobile), NativeWind (Tailwind CSS), Zustand
- **Backend**: Node.js, Express, Groq API (AI Logic)
- **Database**: Supabase (PostgreSQL, Realtime, Row Level Security)

## Local Setup

### Prerequisites
- Node.js (v18+)
- Supabase Project (with the provided `schema.sql` applied)
- Groq API Key

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on the keys
npm run build
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Ensure .env contains EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start -w
```

### 3. Seeding Demo Data
To instantly populate the database with groups, challenges, and mock products:
```bash
cd backend
npx ts-node scripts/seed.ts
```

## Architecture Notes
MindMart uses a mono-repo style structure. The frontend handles authentication states directly via Supabase Auth. Complex AI operations, economic balancing, and checkout flows are securely routed through the Node.js backend to protect business logic.

---
*Built with ❤️ for emotional wellness and sustainable growth.*
