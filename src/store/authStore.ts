import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  nama: string;
  username: string;
  role: 'super_admin' | 'admin_desa' | 'bidan' | 'kader' | 'masyarakat';
  posyandu_id: string | null;
  aktif: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      // Dapatkan session aktif saat ini
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session) {
        const user = session.user;
        // Dapatkan profil user berdasarkan id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // Jika profile tidak ditemukan atau error, kita tetap set user dan session
          console.error('Gagal memuat profil user:', profileError.message);
          set({ session, user, profile: null, loading: false });
        } else {
          set({ session, user, profile: profile as Profile, loading: false });
        }
      } else {
        set({ session: null, user: null, profile: null, loading: false });
      }

      // Dengarkan perubahan auth state (login/logout/token refreshed)
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          const user = session.user;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          set({ session, user, profile: profile as Profile, loading: false });
        } else {
          set({ session: null, user: null, profile: null, loading: false });
        }
      });

    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null, profile: null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  clearError: () => set({ error: null })
}));
