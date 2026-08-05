import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, HeartPulse, AlertTriangle, Stethoscope, CalendarDays, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function DataIbuHamil() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, kunjunganBulanIni: 0, risikoTinggi: 0, kek: 0 });

  const handleDeleteBumil = async (id: string, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data ibu hamil "${nama}"?`)) return;
    try {
      await supabase.from('kunjungan_ibu_hamil').delete().eq('peserta_id', id);
      const { error } = await supabase.from('peserta').delete().eq('id', id);
      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      alert(`Data ibu hamil "${nama}" berhasil dihapus.`);
    } catch (err: any) {
      alert(`Gagal menghapus ibu hamil: ${err?.message || 'Error'}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        const { data: rawPeserta } = await supabase
          .from('peserta')
          .select('*')
          .eq('kategori', 'ibu_hamil')
          .order('created_at', { ascending: false, nullsFirst: false });

        const { data: rawKunjungan } = await supabase
          .from('kunjungan_ibu_hamil')
          .select(`
            *,
            peserta (nama, nik)
          `)
          .order('tanggal', { ascending: false });

        // Query kunjungan bulan ini
        const { count: kunjunganBulanIniCount } = await supabase
          .from('kunjungan_ibu_hamil')
          .select('*', { count: 'exact', head: true })
          .gte('tanggal', firstOfMonth);

        if (rawPeserta && rawPeserta.length > 0) {
          const list = rawPeserta.map(p => {
            const kunjungans = rawKunjungan?.filter((k: any) => k.peserta_id === p.id) || [];
            kunjungans.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
            const latest = kunjungans[0];
            return {
              id: p.id,
              peserta: { nama: p.nama, nik: p.nik },
              tanggal: latest?.tanggal || p.created_at || new Date().toISOString(),
              usia_kehamilan: latest?.usia_kehamilan || '-',
              berat_badan: latest?.berat_badan || '-',
              tekanan_darah: latest?.tekanan_darah || '-',
              status_risiko: latest?.status_risiko || 'normal',
              status_kek: latest?.status_kek || false,
              has_kunjungan: !!latest,
            };
          });
          setData(list);

          const rTinggi = list.filter(item => ['tinggi', 'sangat_tinggi'].includes(item.status_risiko)).length;
          const statusKekCount = list.filter(item => item.status_kek === true).length;

          setStats({
            total: rawPeserta.length,
            kunjunganBulanIni: kunjunganBulanIniCount || 0,
            risikoTinggi: rTinggi,
            kek: statusKekCount,
          });

        } else if (rawKunjungan && rawKunjungan.length > 0) {
          const list = rawKunjungan.map(k => ({ ...k, has_kunjungan: true }));
          setData(list);

          const uniqueBumil = new Set(list.map(k => k.peserta_id)).size;
          const rTinggi = list.filter(item => ['tinggi', 'sangat_tinggi'].includes(item.status_risiko)).length;
          const statusKekCount = list.filter(item => item.status_kek === true).length;

          setStats({
            total: uniqueBumil,
            kunjunganBulanIni: kunjunganBulanIniCount || 0,
            risikoTinggi: rTinggi,
            kek: statusKekCount,
          });
        } else {
          setData([]);
          setStats({ total: 0, kunjunganBulanIni: 0, risikoTinggi: 0, kek: 0 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredData = data.filter(item =>
    item.peserta?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.peserta?.nik && item.peserta.nik.includes(searchQuery))
  );

  const getRisikoColor = (risiko: string) => {
    switch (risiko) {
      case 'sangat_tinggi': return 'bg-red-100 text-red-800';
      case 'tinggi': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRisikoLabel = (risiko: string) => {
    switch (risiko) {
      case 'sangat_tinggi': return 'Sangat Tinggi';
      case 'tinggi': return 'Tinggi';
      default: return 'Normal';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HeartPulse className="h-7 w-7 text-gov-green" />
            Pemantauan Ibu Hamil
          </h1>
          <p className="text-gray-500 mt-1">Riwayat pemeriksaan ANC dan kesehatan ibu hamil terdaftar.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/daftar-peserta?kategori=Ibu+Hamil&redirect=/bumil"
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Daftar Bumil Baru
          </Link>
          <Link 
            to="/bumil/tambah"
            className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Input Pemeriksaan
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-pink-50 text-pink-600 rounded-xl">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Ibu Hamil</p>
            <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.total} <span className="text-sm font-normal text-gray-500">Orang</span></h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Kunjungan Bulan Ini</p>
            <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.kunjunganBulanIni} <span className="text-sm font-normal text-gray-500">Kunjungan</span></h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Risiko Tinggi</p>
            <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.risikoTinggi} <span className="text-sm font-normal text-gray-500">Orang</span></h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status KEK</p>
            <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.kek} <span className="text-sm font-normal text-gray-500">Orang</span></h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green sm:text-sm transition-all"
              placeholder="Cari nama atau NIK ibu hamil..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ibu Hamil</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tgl Periksa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usia Kehamilan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">BB / Tekanan Darah</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">KEK</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risiko</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-gov-green border-t-transparent rounded-full"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <HeartPulse className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">Belum ada data pemeriksaan</p>
                    <p className="text-sm text-gray-500 mt-1">Mulai tambahkan data kunjungan ibu hamil.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm">
                          {item.peserta?.nama?.charAt(0) || 'I'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{item.peserta?.nama || '-'}</div>
                          <div className="text-xs text-gray-500">NIK: {item.peserta?.nik || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.usia_kehamilan} minggu
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.berat_badan} kg / {item.tekanan_darah} mmHg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status_kek ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.status_kek ? 'Ya' : 'Tidak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRisikoColor(item.status_risiko)}`}>
                        {getRisikoLabel(item.status_risiko)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteBumil(item.id, item.peserta?.nama || 'Ibu Hamil')}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus data ibu hamil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
