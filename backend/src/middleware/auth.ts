import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';

export interface AuthenticatedRequest extends Request {
  user?: any;
  token?: string;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    (req as any).user = user;
    (req as any).token = token;
    next();
  } catch (err: any) {
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
