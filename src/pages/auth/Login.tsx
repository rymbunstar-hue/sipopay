import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Shield, Lock, Mail, Users, Heart, Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [isUsernameLogin, setIsUsernameLogin] = useState(false);
  
  const { loading, error: authError, clearError } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (isUsernameLogin && !customUsername) {
      setLocalError('Username wajib diisi');
      return;
    }
    if (!isUsernameLogin && !email) {
      setLocalError('Email wajib diisi');
      return;
    }
    if (!password) {
      setLocalError('Kata sandi wajib diisi');
      return;
    }

    setLocalLoading(true);
    try {
      let loginEmail = email;

      // Jika login menggunakan username, kita asumsikan format email: username@sipopay.desa.id
      if (isUsernameLogin) {
        loginEmail = `${customUsername.trim().toLowerCase()}@sipopay.desa.id`;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email/Username atau Kata Sandi salah');
        }
        throw error;
      }
    } catch (err: any) {
      setLocalError(err.message || 'Terjadi kesalahan saat masuk');
    } finally {
      setLocalLoading(false);
    }
  };

  // Demo Login Helper untuk memudahkan presentasi ke Pemdes Sukasenang
  const handleDemoLogin = async (role: 'kader' | 'bidan' | 'admin_desa') => {
    setLocalError(null);
    clearError();
    setLocalLoading(true);

    try {
      const demoEmail = `${role}@sipopay.desa.id`;
      const demoPassword = `password123`; // Password demo standar

      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        // Jika belum dikonfigurasi di Supabase, kita berikan petunjuk yang jelas
        throw new Error(
          `Akun demo ${role} belum terdaftar di database Supabase Anda. ` +
          `Silakan daftarkan user "${demoEmail}" dengan password "password123" di panel Supabase Auth.`
        );
      }
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-gov-light via-white to-primary-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo / Icon */}
        <div className="mx-auto h-16 w-16 bg-gov-green rounded-2xl flex items-center justify-center shadow-lg shadow-gov-green/20">
          <Heart className="h-9 w-9 text-white animate-pulse" />
        </div>
        
        <h2 className="mt-6 text-3xl font-extrabold text-gov-green-dark tracking-tight">
          SIPOPAY
        </h2>
        <p className="mt-2 text-sm text-gray-600 font-medium">
          Sistem Informasi Posyandu Terintegrasi
        </p>
        <p className="mt-1 text-xs text-gov-green/80 font-semibold bg-gov-green-light px-3 py-1 rounded-full inline-block">
          Desa Sukasenang, Tanjungjaya, Tasikmalaya
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100 sm:px-10">
          
          {/* Tabs Login Method */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => { setIsUsernameLogin(false); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                !isUsernameLogin ? 'bg-white text-gov-green shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Email Kemenkes
            </button>
            <button
              onClick={() => { setIsUsernameLogin(true); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                isUsernameLogin ? 'bg-white text-gov-green shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Username Desa
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Error Alerts */}
            {(localError || authError) && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700 font-medium">
                  {localError || authError}
                </p>
              </div>
            )}

            {isUsernameLogin ? (
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    placeholder="nama_kader"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-green focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Alamat Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="kader@sukasenang.desa.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-green focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Kata Sandi
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-green focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={localLoading || loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-gov-green hover:bg-gov-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-green transition-all disabled:opacity-50"
              >
                {localLoading || loading ? 'Memproses...' : 'Masuk Aplikasi'}
              </button>
            </div>
          </form>

          {/* Demo Login Section untuk Presentasi */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="relative flex justify-center text-sm mb-4">
              <span className="bg-white px-3 text-xs text-gray-400 font-bold tracking-wider uppercase">
                Akses Demo Presentasi
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('kader')}
                className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-xl hover:border-gov-green hover:bg-gov-light transition-all group"
              >
                <Users className="h-5 w-5 text-gov-green mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-700">Kader</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleDemoLogin('bidan')}
                className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-xl hover:border-gov-green hover:bg-gov-light transition-all group"
              >
                <Activity className="h-5 w-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-700">Bidan</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin_desa')}
                className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-xl hover:border-gov-green hover:bg-gov-light transition-all group"
              >
                <Shield className="h-5 w-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-gray-700">Kades</span>
              </button>
            </div>
            <p className="mt-3 text-[10px] text-center text-gray-400 leading-normal">
              *Akses demo sekali klik di atas memerlukan pembuatan akun auth di Supabase terlebih dahulu dengan password default: <b>password123</b>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
