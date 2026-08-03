import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, ArrowRight, Activity, Users, Eye, EyeOff, Info } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotInfo, setShowForgotInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ubah 5 digit NIK menjadi format email Supabase
      const supabaseEmail = `${email}@sipopay.local`;
      const { error } = await supabase.auth.signInWithPassword({
        email: supabaseEmail,
        password,
      });

      if (error) throw error;

      // onAuthStateChange di authStore akan menangani update state,
      // navigate setelah delay singkat agar state sempat terupdate
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'NIK atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gov-light flex flex-col md:flex-row">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-gov-green relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-primary-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white p-2 rounded-xl">
              <Activity className="h-8 w-8 text-gov-green" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SIPOPAY</h1>
              <p className="text-gov-green-light text-sm font-medium">Sistem Informasi Posyandu Terintegrasi</p>
            </div>
          </div>
          
          <div className="mt-20">
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Digitalisasi Layanan<br />Kesehatan Desa
            </h2>
            <p className="text-gov-green-light text-lg max-w-md leading-relaxed">
              Platform terpadu untuk kader posyandu dan bidan desa dalam memantau tumbuh kembang balita, ibu hamil, dan lansia secara real-time.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-6 text-sm text-gov-green-light">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span>Aman & Terenkripsi</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Terintegrasi Desa</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center justify-center gap-3 mb-10">
            <div className="bg-gov-green p-3 rounded-2xl shadow-lg shadow-gov-green/20">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SIPOPAY</h1>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Selamat Datang</h2>
              <p className="text-gray-500 mt-2 text-sm">Masuk ke akun Anda untuk melanjutkan akses.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <p>{error}</p>
              </div>
            )}

            {showForgotInfo ? (
              <div className="space-y-6">
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                  <div className="flex justify-center mb-3">
                    <div className="bg-amber-100 p-3 rounded-full">
                      <Info className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-amber-800 mb-2">Lupa Password?</p>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Silakan hubungi <span className="font-bold">Ketua Kader Posyandu</span> untuk mengetahui password Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotInfo(false)}
                  className="w-full py-3.5 px-4 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                >
                  ← Kembali ke Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">NIK</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={5}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value.replace(/\D/g, ''))}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all duration-200"
                      placeholder="Masukkan 5 digit terakhir NIK"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-1">Masukkan 5 digit terakhir NIK Anda.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotInfo(true)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Lupa sandi?
                    </button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gov-green hover:bg-gov-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-green transition-all duration-200 shadow-lg shadow-gov-green/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    <>
                      Masuk ke Sistem
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
