import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import wellnessRoutes from './routes/wellness';
import marketplaceRoutes from './routes/marketplace';
import socialRoutes from './routes/social';
import aiRoutes from './routes/ai';

app.use('/api/wellness', wellnessRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/ai', aiRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MindMart backend is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
