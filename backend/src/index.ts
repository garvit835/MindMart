import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MindMart backend is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
