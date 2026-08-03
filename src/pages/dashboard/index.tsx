import { useState, useEffect } from 'react';
import { Users, Baby, Activity, AlertCircle, BookOpen, Loader2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function Dashboard() {
  const [stats, setStats] = useState({ balita: 0, bumil: 0, kehadiran: 0, stunting: 0 });
  const [attendanceData, setAttendanceData] = useState<{ name: string; kehadiran: number }[]>([]);
  const [giziData, setGiziData] = useState<{ name: string; normal: number; kurang: number; stunting: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscription — refresh otomatis saat ada data baru
    const balitaSub = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kunjungan_balita' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kunjungan_ibu_hamil' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta' }, () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(balitaSub); };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      // 1. Total balita aktif terdaftar
      const { count: balitaCount } = await supabase
        .from('peserta')
        .select('*', { count: 'exact', head: true })
        .eq('kategori', 'balita')
        .eq('aktif', true);

      // 2. Total ibu hamil aktif terdaftar
      const { count: bumilCount } = await supabase
        .from('peserta')
        .select('*', { count: 'exact', head: true })
        .eq('kategori', 'ibu_hamil')
        .eq('aktif', true);

      // 3. Stunting bulan ini
      const firstOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const { count: stuntingCount } = await supabase
        .from('kunjungan_balita')
        .select('*', { count: 'exact', head: true })
        .gte('tanggal', firstOfMonth)
        .in('stunting_status', ['stunted', 'severely_stunted']);

      // 4. Kunjungan balita bulan ini vs total balita → % kehadiran
      const { count: kunjunganCount } = await supabase
        .from('kunjungan_balita')
        .select('*', { count: 'exact', head: true })
        .gte('tanggal', firstOfMonth);

      const pctKehadiran = balitaCount && balitaCount > 0
        ? Math.round(((kunjunganCount || 0) / balitaCount) * 100)
        : 0;

      setStats({
        balita: balitaCount || 0,
        bumil: bumilCount || 0,
        kehadiran: pctKehadiran,
        stunting: stuntingCount || 0,
      });

      // 5. Tren kehadiran 7 bulan terakhir
      const trendData: { name: string; kehadiran: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

        const { count: monthCount } = await supabase
          .from('kunjungan_balita')
          .select('*', { count: 'exact', head: true })
          .gte('tanggal', start)
          .lte('tanggal', end);

        const pct = balitaCount && balitaCount > 0
          ? Math.round(((monthCount || 0) / balitaCount) * 100)
          : 0;

        trendData.push({ name: MONTH_NAMES[d.getMonth()], kehadiran: pct });
      }
      setAttendanceData(trendData);

      // 6. Distribusi status gizi dari semua kunjungan bulan ini
      const { data: kunjunganBulanIni } = await supabase
        .from('kunjungan_balita')
        .select('stunting_status, peserta(alamat, rt)')
        .gte('tanggal', firstOfMonth);

      // Group by RT/Wilayah
      const wilayahMap: Record<string, { normal: number; kurang: number; stunting: number }> = {};
      (kunjunganBulanIni || []).forEach((k: any) => {
        const rt = k.peserta?.rt ? `RT ${k.peserta.rt}` : 'Lainnya';
        if (!wilayahMap[rt]) wilayahMap[rt] = { normal: 0, kurang: 0, stunting: 0 };
        if (k.stunting_status === 'normal' || !k.stunting_status) wilayahMap[rt].normal++;
        else if (k.stunting_status === 'stunted' || k.stunting_status === 'severely_stunted') wilayahMap[rt].stunting++;
        else wilayahMap[rt].kurang++;
      });

      const giziArr = Object.entries(wilayahMap).map(([name, val]) => ({ name, ...val }));
      setGiziData(giziArr.length > 0 ? giziArr : [{ name: 'Belum ada data', normal: 0, kurang: 0, stunting: 0 }]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Balita', value: stats.balita.toString(), icon: Baby, color: 'bg-blue-500', sub: 'terdaftar aktif' },
    { title: 'Ibu Hamil', value: stats.bumil.toString(), icon: Users, color: 'bg-pink-500', sub: 'terdaftar aktif' },
    { title: 'Tingkat Kehadiran', value: `${stats.kehadiran}%`, icon: Activity, color: 'bg-green-500', sub: 'bulan ini' },
    { title: 'Beresiko Stunting', value: stats.stunting.toString(), icon: AlertCircle, color: 'bg-red-500', sub: 'kasus bulan ini' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Utama</h1>
          <p className="text-gray-500 mt-1">Ringkasan statistik kesehatan dan kehadiran warga desa.</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memperbarui data...
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                <stat.icon className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <span className="text-xs font-medium text-gov-green">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Line Chart Kehadiran */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Tren Tingkat Kehadiran Posyandu</h3>
          <div className="h-[300px] w-full">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}%`, 'Kehadiran']}
                  />
                  <Line type="monotone" dataKey="kehadiran" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Belum ada data kunjungan.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Bar Chart Status Gizi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribusi Status Gizi Balita per Wilayah</h3>
          <div className="h-[300px] w-full">
            {giziData.length > 0 && giziData[0].name !== 'Belum ada data' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={giziData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f9fafb' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar dataKey="normal" name="Normal" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="kurang" name="Gizi Kurang" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="stunting" name="Stunting" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Belum ada data kunjungan bulan ini.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Info & Kegiatan */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gov-green" />
          Panduan Kader & Info Penting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <strong className="block text-gray-900 font-semibold mb-1">Pengukuran Balita:</strong>
            Pastikan timbangan telah dikalibrasi ke angka nol sebelum anak naik ke alat ukur.
          </div>
          <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
            <strong className="block text-gray-900 font-semibold mb-1">Status KEK Bumil:</strong>
            Ibu hamil dengan Lingkar Lengan Atas (LiLA) &lt; 23.5 cm memerlukan perhatian khusus dan PMT tambahan.
          </div>
          <div className="p-4 bg-green-50/50 rounded-xl border border-green-100/50">
            <strong className="block text-gray-900 font-semibold mb-1">Pemberian Imunisasi:</strong>
            Catat nomor batch vaksin dengan benar untuk pelaporan dinas kesehatan setempat.
          </div>
        </div>
      </div>
    </div>
  );
}
