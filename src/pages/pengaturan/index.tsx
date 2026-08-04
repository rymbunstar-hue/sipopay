import React, { useState, useEffect } from 'react';
import { Settings, User, Save, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function Pengaturan() {
  const { user, role, profileName, setProfileName } = useAuthStore();
  const [nama, setNama] = useState(profileName || '');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setFetching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('nama')
        .eq('id', user.id)
        .maybeSingle();

      if (data && data.nama) {
        setNama(data.nama);
      } else {
        setNama(profileName || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const trimmedNama = nama.trim();
      if (!trimmedNama) {
        throw new Error('Nama pengguna tidak boleh kosong.');
      }

      // Upsert/Update hanya ke kolom id, nama, username, & role yang pasti ada di tabel profiles
      const usernameVal = user.email ? user.email.split('@')[0] : '11111';

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          nama: trimmedNama,
          username: usernameVal,
          role: role || 'super_admin'
        });

      if (error) throw error;

      // Update state authStore secara langsung
      setProfileName(trimmedNama);
      setSuccessMsg('Profil dan Nama Pengguna berhasil diperbarui!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-7 w-7 text-gov-green" />
          Pengaturan Akun & Profil
        </h1>
        <p className="text-gray-500 mt-1">Kelola data profil, nama pengguna, dan akun Anda.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 text-sm font-medium animate-in fade-in">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p>{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in fade-in">
          <p>⚠️ {errorMsg}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="h-16 w-16 rounded-2xl bg-gov-green/10 border border-gov-green/20 flex items-center justify-center font-bold text-2xl text-gov-green uppercase">
            {(nama || 'A').charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{nama || 'Super Admin'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gov-green/10 text-gov-green">
                <ShieldCheck className="h-3.5 w-3.5" />
                {role ? role.replace(/_/g, ' ').toUpperCase() : 'SUPER ADMIN'}
              </span>
              <span className="text-xs text-gray-400">• {user?.email}</span>
            </div>
          </div>
        </div>

        {fetching ? (
          <div className="py-12 flex justify-center items-center text-gray-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-gov-green" />
            <span className="text-sm">Memuat profil...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 max-w-lg">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-gov-green" />
                Nama Pengguna (Tampilan) *
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all"
                placeholder="Masukkan nama pengguna..."
              />
              <p className="text-xs text-gray-400">Nama ini yang akan ditampilkan di pojok kanan atas aplikasi.</p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-start">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark disabled:opacity-60 text-white px-6 py-3 rounded-xl font-medium shadow-md shadow-gov-green/20 transition-all text-sm cursor-pointer"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="h-4 w-4" /> Simpan Perubahan</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
