import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Activity, HeartPulse, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function PosyanduLansia() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();

  const handleDeleteLansia = async (id: string, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data lansia "${nama}"?`)) return;
    try {
      await supabase.from('kunjungan_lansia').delete().eq('peserta_id', id);
      const { error } = await supabase.from('peserta').delete().eq('id', id);
      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
      alert(`Data lansia "${nama}" berhasil dihapus.`);
    } catch (err: any) {
      alert(`Gagal menghapus lansia: ${err?.message || 'Error'}`);
    }
  };

  useEffect(() => {
    const fetchKunjungan = async () => {
      try {
        setLoading(true);

        const { data: rawPeserta } = await supabase
          .from('peserta')
          .select('*')
          .eq('kategori', 'lansia')
          .order('created_at', { ascending: false, nullsFirst: false });

        const { data: rawKunjungan } = await supabase
          .from('kunjungan_lansia')
          .select(`
            *,
            peserta (nama, nik, jenis_kelamin, tanggal_lahir)
          `)
          .order('tanggal', { ascending: false });

        if (rawPeserta && rawPeserta.length > 0) {
          const list = rawPeserta.map(p => {
            const kunjungans = rawKunjungan?.filter((k: any) => k.peserta_id === p.id) || [];
            kunjungans.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
            const latest = kunjungans[0];
            return {
              id: p.id,
              peserta: { nama: p.nama, nik: p.nik },
              tanggal: latest?.tanggal || p.created_at || new Date().toISOString(),
              tekanan_darah: latest?.tekanan_darah || '-',
              gula_darah: latest?.gula_darah || null,
              keluhan: latest?.keluhan || 'Belum ada catatan periksa',
              has_kunjungan: !!latest,
            };
          });
          setData(list);
        } else if (rawKunjungan && rawKunjungan.length > 0) {
          setData(rawKunjungan.map(k => ({ ...k, has_kunjungan: true })));
        } else {
          setData([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchKunjungan();
  }, [user]);

  const filteredData = data.filter(item =>
    item.peserta?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.peserta?.nik && item.peserta.nik.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-7 w-7 text-gov-green" />
            Posyandu Lansia
          </h1>
          <p className="text-gray-500 mt-1">Data kunjungan bulanan dan pemantauan kesehatan lansia.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/daftar-peserta?kategori=Lansia&redirect=/lansia"
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Daftar Lansia Baru
          </Link>
          <Link 
            to="/lansia/tambah"
            className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Input Kunjungan
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Kunjungan Bulan Ini</p>
            <h3 className="text-2xl font-bold text-gray-900">0 <span className="text-sm font-normal text-gray-500">Kunjungan</span></h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tekanan Darah Tinggi</p>
            <h3 className="text-2xl font-bold text-gray-900">0 <span className="text-sm font-normal text-gray-500">Orang</span></h3>
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
              placeholder="Cari nama atau NIK lansia..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lansia</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tensi / Gula Darah</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Keluhan</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Memuat data lansia...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada lansia yang cocok dengan pencarian.' : 'Belum ada data lansia terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.peserta?.nama || 'Tidak diketahui'}</div>
                      <div className="text-xs text-gray-500">NIK: {item.peserta?.nik || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div><span className="font-medium">TD:</span> {item.tekanan_darah}</div>
                      <div><span className="font-medium">GD:</span> {item.gula_darah ? `${item.gula_darah} mg/dL` : '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {item.keluhan || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link to="/lansia/tambah" className="px-3 py-1.5 bg-gov-green/10 text-gov-green hover:bg-gov-green/20 rounded-lg text-xs font-semibold transition-colors">
                          + Input Periksa
                        </Link>
                        <button
                          onClick={() => handleDeleteLansia(item.id, item.peserta?.nama || 'Lansia')}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus data lansia"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
