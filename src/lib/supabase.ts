import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'placeholder-key-replace-me') {
  console.warn(
    'Peringatan: Kredensial Supabase belum dikonfigurasi dengan benar di file .env. ' +
    'Silakan buka file .env di folder utama dan ganti nilainya dengan kredensial dari dashboard Supabase Anda.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
