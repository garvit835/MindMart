import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  setSession: (session: Session | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  setSession: (session) => set({ session, user: session?.user || null }),
  signOut: () => set({ session: null, user: null }),
}));
