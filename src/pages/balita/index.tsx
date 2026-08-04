import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Activity, Baby, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function PosyanduBalita() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kunjunganBulanIni, setKunjunganBulanIni] = useState(0);
  const [stuntingBulanIni, setStuntingBulanIni] = useState(0);

  const { user } = useAuthStore();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setStatsLoading(true);

        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        // 1. Fetch data peserta balita
        const { data: rawPeserta } = await supabase
          .from('peserta')
          .select('*')
          .eq('kategori', 'balita')
          .order('created_at', { ascending: false, nullsFirst: false });

        // 2. Fetch data kunjungan balita
        const { data: rawKunjungan } = await supabase
          .from('kunjungan_balita')
          .select(`
            *,
            peserta (nama, nik, jenis_kelamin, tanggal_lahir, nama_ibu)
          `)
          .order('tanggal', { ascending: false });

        if (rawPeserta && rawPeserta.length > 0) {
          const list = rawPeserta.map(p => {
            const kunjungans = rawKunjungan?.filter((k: any) => k.peserta_id === p.id) || [];
            kunjungans.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
            return {
              id: p.id,
              nama: p.nama,
              nik: p.nik,
              jenis_kelamin: p.jenis_kelamin,
              tanggal_lahir: p.tanggal_lahir,
              nama_ibu: p.nama_ibu,
              latest_kunjungan: kunjungans[0] || null,
            };
          });
          setData(list);
        } else if (rawKunjungan && rawKunjungan.length > 0) {
          // Fallback ke kunjungan jika peserta kosong
          const list = rawKunjungan.map(k => ({
            id: k.id,
            nama: k.peserta?.nama || 'Tanpa Nama',
            nik: k.peserta?.nik || '-',
            jenis_kelamin: k.peserta?.jenis_kelamin || 'L',
            tanggal_lahir: k.peserta?.tanggal_lahir || k.tanggal,
            nama_ibu: k.peserta?.nama_ibu || '-',
            latest_kunjungan: k,
          }));
          setData(list);
        } else {
          setData([]);
        }

        // Fetch stats bulan ini
        const { count: kunjunganCount } = await supabase
          .from('kunjungan_balita')
          .select('*', { count: 'exact', head: true })
          .gte('tanggal', firstOfMonth);

        const { count: stuntingCount } = await supabase
          .from('kunjungan_balita')
          .select('*', { count: 'exact', head: true })
          .gte('tanggal', firstOfMonth)
          .in('stunting_status', ['stunted', 'severely_stunted']);

        setKunjunganBulanIni(kunjunganCount || 0);
        setStuntingBulanIni(stuntingCount || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };
    
    fetchAll();
  }, [user]);

  const filteredData = data.filter(item =>
    item.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.nik && item.nik.includes(searchQuery)) ||
    (item.nama_ibu && item.nama_ibu.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Baby className="h-7 w-7 text-gov-green" />
            Posyandu Balita
          </h1>
          <p className="text-gray-500 mt-1">Data balita terdaftar, kunjungan bulanan, penimbangan, dan pengukuran.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/daftar-peserta?kategori=Balita&redirect=/balita"
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Daftar Balita Baru
          </Link>
          <Link 
            to="/balita/tambah"
            className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Input Kunjungan
          </Link>
        </div>
      </div>

      {/* Stats Cards for Posyandu Balita */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-gov-green/10 text-gov-green rounded-xl">
            <Baby className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Balita Terdaftar</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : data.length}{' '}
              <span className="text-sm font-normal text-gray-500">Anak</span>
            </h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Kunjungan Bulan Ini</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {statsLoading ? '...' : kunjunganBulanIni}{' '}
              <span className="text-sm font-normal text-gray-500">Kunjungan</span>
            </h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Perlu Perhatian (Stunting)</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {statsLoading ? '...' : stuntingBulanIni}{' '}
              <span className="text-sm font-normal text-gray-500">Balita</span>
            </h3>
          </div>
        </div>
      </div>

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
              placeholder="Cari nama balita, NIK, atau nama ibu..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Balita</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tgl Periksa Terakhir</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">BB / TB</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Gizi</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Memuat data balita...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada data balita yang cocok dengan pencarian.' : 'Belum ada data balita terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const kun = item.latest_kunjungan;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gov-green/10 text-gov-green flex items-center justify-center font-bold text-sm">
                            {item.nama?.charAt(0) || 'B'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{item.nama}</div>
                            <div className="text-xs text-gray-500">
                              {item.nik ? `NIK: ${item.nik} | ` : ''}Ibu: {item.nama_ibu || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {kun ? (
                          new Date(kun.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        ) : (
                          <span className="text-gray-400 text-xs italic">Belum pernah ditimbang</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {kun ? (
                          `${kun.berat_badan} kg / ${kun.tinggi_badan} cm`
                        ) : (
                          <span className="text-gray-400 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {kun ? (
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            kun.stunting_status === 'normal' || kun.status_gizi_bbu === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {kun.status_gizi_bbu || 'Normal'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">
                            Belum Diukur
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to="/balita/tambah"
                          className="px-3 py-1.5 bg-gov-green/10 text-gov-green hover:bg-gov-green/20 rounded-lg text-xs font-semibold transition-colors"
                        >
                          + Input Kunjungan
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
