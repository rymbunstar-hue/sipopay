import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { 
  Activity, Calendar, 
  Baby, Heart, ShieldAlert, Award, 
  ArrowUpRight, Plus, CheckCircle, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState({
    totalBalita: 0,
    totalIbuHamil: 0,
    totalKunjunganBulanIni: 0,
    stuntingAlertsCount: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // 1. Fetch total Balita
        const { count: balitaCount } = await supabase
          .from('peserta')
          .select('*', { count: 'exact', head: true })
          .eq('kategori', 'balita')
          .eq('aktif', true);

        // 2. Fetch total Ibu Hamil
        const { count: bumilCount } = await supabase
          .from('peserta')
          .select('*', { count: 'exact', head: true })
          .eq('kategori', 'ibu_hamil')
          .eq('aktif', true);

        // 3. Fetch Kunjungan Bulan Ini
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
        
        const { count: kunjunganCount } = await supabase
          .from('kunjungan_balita')
          .select('*', { count: 'exact', head: true })
          .gte('tanggal', startOfMonthStr);

        // 4. Fetch Stunting Alerts (Status Gizi Sangat Kurang / Stunting)
        const { count: stuntingCount } = await supabase
          .from('kunjungan_balita')
          .select('*', { count: 'exact', head: true })
          .in('stunting_status', ['severely_stunted', 'stunted']);

        setStats({
          totalBalita: balitaCount || 0,
          totalIbuHamil: bumilCount || 0,
          totalKunjunganBulanIni: kunjunganCount || 0,
          stuntingAlertsCount: stuntingCount || 0
        });

        // 5. Fetch Recent Activities (Kunjungan Balita Terbaru)
        const { data: recentKunjungan } = await supabase
          .from('kunjungan_balita')
          .select(`
            id,
            tanggal,
            berat_badan,
            tinggi_badan,
            stunting_status,
            peserta (nama)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentKunjungan) {
          setRecentActivities(recentKunjungan);
        }

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    if (profile?.role !== 'masyarakat') {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gov-green"></div>
      </div>
    );
  }

  // JIKA ROLE ADALAH MASYARAKAT / ORANG TUA WALI
  if (profile?.role === 'masyarakat') {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-gov-green to-gov-green-dark text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 space-y-2">
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Portal Orang Tua</span>
            <h1 className="text-2xl md:text-3xl font-extrabold">Halo, Ibu/Bapak {profile?.nama}!</h1>
            <p className="text-sm text-primary-50 max-w-xl font-medium">
              Pantau terus tumbuh kembang anak Anda, jadwal imunisasi, serta tips kesehatan gizi anak langsung dari layanan digital Desa Sukasenang.
            </p>
          </div>
        </div>

        {/* Anak Ku Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Anak Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-800 flex items-center">
                <Baby className="h-5 w-5 text-gov-green mr-2" />
                Data Anak Anda
              </h3>
              <span className="text-xs bg-emerald-50 text-gov-green font-bold px-2.5 py-1 rounded-full">
                Terdaftar Posyandu
              </span>
            </div>
            
            <div className="p-4 bg-gov-light rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Nama Balita</span>
                <span className="font-bold text-gray-800">M. Yusuf Pratama</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Tanggal Lahir</span>
                <span className="font-bold text-gray-800">12 Maret 2024 (16 Bulan)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Posyandu Sesi</span>
                <span className="font-bold text-gray-800">Posyandu Mawar I</span>
              </div>
            </div>
          </div>

          {/* Pengukuran Terakhir */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-gray-800 flex items-center">
              <Activity className="h-5 w-5 text-blue-600 mr-2" />
              Pengukuran Terakhir (Juni 2026)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
                <p className="text-xs text-gray-500 font-semibold">Berat Badan</p>
                <p className="text-2xl font-black text-blue-700 mt-1">9.8 kg</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                  Normal
                </span>
              </div>

              <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl text-center">
                <p className="text-xs text-gray-500 font-semibold">Tinggi Badan</p>
                <p className="text-2xl font-black text-teal-700 mt-1">79.2 cm</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                  Tinggi Sesuai
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Imunisasi Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-800 flex items-center">
            <Award className="h-5 w-5 text-amber-500 mr-2" />
            Jadwal Imunisasi Anak
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-gov-green" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Vaksin BCG + Polio 1</p>
                  <p className="text-[10px] text-gray-500">Usia 1 Bulan (Telah Diberikan)</p>
                </div>
              </div>
              <span className="text-[10px] bg-gov-green text-white px-2 py-0.5 rounded-md font-bold">Lengkap</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Campak / MR Rubela Booster</p>
                  <p className="text-[10px] text-gray-500">Jadwal: Usia 18 Bulan (September 2026)</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-md font-bold">Mendatang</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JIKA ROLE ADALAH KADER, BIDAN, ATAU ADMIN DESA
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gov-green to-gov-green-dark text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 space-y-2">
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Sistem Posyandu Desa</span>
          <h1 className="text-2xl md:text-3xl font-extrabold">Dashboard Layanan Kesehatan</h1>
          <p className="text-sm text-primary-50 max-w-2xl font-medium">
            Monitor prevalensi gizi buruk, catat kunjungan pelayanan 5 meja, dan susun laporan digital bulanan desa dengan cepat dan efisien.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 bg-gov-green-light text-gov-green rounded-xl flex items-center justify-center">
            <Baby className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Balita</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{stats.totalBalita} Anak</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ibu Hamil Aktif</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{stats.totalIbuHamil} Orang</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Kunjungan Bulan Ini</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{stats.totalKunjunganBulanIni} Sesi</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 animate-bounce" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Berisiko Stunting</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{stats.stuntingAlertsCount} Kasus</p>
          </div>
        </div>
      </div>

      {/* Quick Action & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-800 text-base border-b border-gray-100 pb-3">Aksi Cepat Menu</h3>
          <div className="grid grid-cols-1 gap-2.5">
            {profile?.role === 'kader' && (
              <Link
                to="/sesi"
                className="flex items-center justify-between p-3 border border-gov-green/10 bg-gov-light hover:bg-gov-green-light rounded-xl font-bold text-xs text-gov-green-dark transition-all group"
              >
                <span>Buka Pelayanan Hari Ini</span>
                <Plus className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            <Link
              to="/peserta"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gov-green/20 hover:bg-gray-50 rounded-xl font-bold text-xs text-gray-700 transition-all group"
            >
              <span>Daftarkan Peserta Baru</span>
              <Plus className="h-4 w-4 text-gray-400 group-hover:text-gov-green" />
            </Link>

            <Link
              to="/gizi"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gov-green/20 hover:bg-gray-50 rounded-xl font-bold text-xs text-gray-700 transition-all group"
            >
              <span>Lihat Hasil Tumbuh Kembang / KMS</span>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              to="/laporan"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gov-green/20 hover:bg-gray-50 rounded-xl font-bold text-xs text-gray-700 transition-all group"
            >
              <span>Cetak Laporan Bulanan Posyandu</span>
              <FileText className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-gray-800 text-base">Aktivitas Pelayanan Terbaru</h3>
            <span className="text-[10px] text-gray-400 font-semibold">Desa Sukasenang</span>
          </div>

          <div className="overflow-x-auto">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 font-medium">
                Belum ada aktivitas pelayanan tercatat di database.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3">Nama Balita</th>
                    <th className="pb-3">Tanggal</th>
                    <th className="pb-3 text-center">BB (kg)</th>
                    <th className="pb-3 text-center">TB (cm)</th>
                    <th className="pb-3 text-right">Status Gizi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                  {recentActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">{act.peserta?.nama}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(act.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-3 text-center font-bold text-blue-600">{act.berat_badan}</td>
                      <td className="py-3 text-center font-bold text-teal-600">{act.tinggi_badan}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          act.stunting_status === 'normal' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {act.stunting_status === 'normal' ? 'Normal' : act.stunting_status === 'stunted' ? 'Stunting' : 'Sangat Pendek'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
