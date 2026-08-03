import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Lock, ArrowRight, Activity, Users, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function Register() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi NIK harus 5 digit
    if (email.length !== 5) {
      setError('NIK harus terdiri dari 5 digit angka.');
      setLoading(false);
      return;
    }
    
    // Validasi Password
    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      setLoading(false);
      return;
    }

    try {
      // Ubah 5 digit NIK menjadi format email Supabase
      const supabaseEmail = `${email}@sipopay.local`;
      const { error } = await supabase.auth.signUp({
        email: supabaseEmail,
        password,
        options: {
          data: {
            nama: nama,
            username: email, // NIK 5 digit sebagai username
            role: 'masyarakat' // Role default untuk keamanan
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('NIK ini sudah terdaftar. Silakan login atau hubungi Admin.');
        }
        throw error;
      }

      setSuccess(true);
      
      // Arahkan ke login setelah 3 detik
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
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
              Daftar sekarang untuk memantau tumbuh kembang balita, ibu hamil, dan lansia secara real-time.
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

      {/* Right side - Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
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
              <h2 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h2>
              <p className="text-gray-500 mt-2 text-sm">Silakan isi formulir di bawah ini untuk mendaftar.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <p>{error}</p>
              </div>
            )}

            {success ? (
              <div className="space-y-6">
                <div className="p-5 bg-green-50 border border-green-200 rounded-2xl text-center">
                  <div className="flex justify-center mb-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">Pendaftaran Berhasil!</h3>
                  <p className="text-sm text-green-700 leading-relaxed mb-4">
                    Akun Anda telah berhasil dibuat. Anda akan dialihkan ke halaman Login dalam beberapa detik.
                  </p>
                  <p className="text-xs text-green-600 bg-green-100/50 p-3 rounded-lg border border-green-200/50">
                    <strong>Catatan:</strong> Akun baru Anda memiliki akses dasar. Jika Anda adalah Kader atau Admin, silakan hubungi Ketua untuk meningkatkan hak akses.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all duration-200"
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>
                </div>

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
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all duration-200"
                      placeholder="Masukkan 5 digit terakhir NIK"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-1">Gunakan 5 digit terakhir NIK Anda sebagai username.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all duration-200"
                      placeholder="Minimal 6 karakter"
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
                  className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 mt-2 border border-transparent text-sm font-bold rounded-xl text-white bg-gov-green hover:bg-gov-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-green transition-all duration-200 shadow-lg shadow-gov-green/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mendaftarkan...
                    </span>
                  ) : (
                    <>
                      Daftar Akun
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{' '}
                <Link to="/login" className="font-bold text-gov-green hover:text-gov-green-dark transition-colors">
                  Login di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
