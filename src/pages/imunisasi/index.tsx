import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Syringe, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DataImunisasi() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: result, error } = await supabase
          .from('imunisasi')
          .select(`
            *,
            peserta (nama, nik),
            profiles (nama)
          `)
          .order('tanggal', { ascending: false });
        
        if (!error && result) {
          setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Syringe className="h-7 w-7 text-gov-green" />
            Layanan Imunisasi Dasar
          </h1>
          <p className="text-gray-500 mt-1">Pemantauan dan pencatatan riwayat imunisasi wajib Balita.</p>
        </div>
        <Link 
          to="/imunisasi/tambah"
          className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm"
        >
          <Plus className="h-4 w-4" />
          Input Vaksinasi
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Capaian Bulan Ini</p>
            <h3 className="text-2xl font-bold text-gray-900">28 <span className="text-sm font-normal text-gray-500">Anak</span></h3>
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
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green sm:text-sm transition-all"
              placeholder="Cari nama balita..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Balita</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis Vaksin</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Petugas Pelaksana</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Memuat riwayat imunisasi...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Belum ada riwayat imunisasi.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.peserta?.nama || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.jenis_vaksin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.profiles?.nama || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Selesai
                      </span>
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
