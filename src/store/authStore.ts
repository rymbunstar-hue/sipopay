import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: string | null;
  profileName: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setRole: (role: string | null) => void;
  setProfileName: (profileName: string | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

async function loadUserProfile(userId: string, email?: string, userMeta?: any) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nama, username, role')
      .eq('id', userId)
      .maybeSingle();

    const userRole = profile?.role || userMeta?.role || (email?.startsWith('11111') ? 'super_admin' : 'kader');

    let displayName = profile?.nama || userMeta?.nama;

    // Jika nama tidak ada atau hanya berupa NIK/angka (seperti "11111")
    if (!displayName || /^\d+$/.test(displayName.trim())) {
      if (userRole === 'super_admin' || profile?.username === '11111' || email?.startsWith('11111')) {
        displayName = 'Super Admin';
      } else if (userRole === 'bidan') {
        displayName = 'Bidan Desa';
      } else if (userRole === 'admin_desa') {
        displayName = 'Admin Desa';
      } else {
        displayName = 'Petugas Kader';
      }
    }

    return { role: userRole, profileName: displayName };
  } catch (err) {
    const userRole = email?.startsWith('11111') ? 'super_admin' : 'kader';
    const displayName = email?.startsWith('11111') ? 'Super Admin' : 'Petugas Kader';
    return { role: userRole, profileName: displayName };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  profileName: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setRole: (role) => set({ role }),
  setProfileName: (profileName) => set({ profileName }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, role: null, profileName: null });
  },
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        set({ session, user: session.user });
        const { role, profileName } = await loadUserProfile(session.user.id, session.user.email, session.user.user_metadata);
        set({ role, profileName });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user || null });
      
      if (session?.user) {
        const { role, profileName } = await loadUserProfile(session.user.id, session.user.email, session.user.user_metadata);
        set({ role, profileName });
      } else {
        set({ role: null, profileName: null });
      }
    });
  }
}));
