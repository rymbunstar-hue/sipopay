import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, MoreVertical, UserCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Peserta {
  id: string;
  nik: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  kategori: string;
  nama_ibu: string;
}

export default function DataPeserta() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');

  useEffect(() => {
    fetchPeserta();
  }, []);

  const fetchPeserta = async () => {
    try {
      setLoading(true);
      // Dummy query format based on our schema
      const { data, error } = await supabase
        .from('peserta')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching peserta:', error);
      } else {
        setPeserta(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // In a real app, this should debounce and call supabase RPC or ILIKE query
  };

  const filteredPeserta = peserta.filter(p => {
    const matchSearch = p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.nik.includes(searchQuery);
    const matchKategori = kategoriFilter === 'Semua' || p.kategori === kategoriFilter;
    return matchSearch && matchKategori;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Peserta</h1>
          <p className="text-gray-500 mt-1">Kelola data balita, ibu hamil, dan lansia terdaftar.</p>
        </div>
        <Link 
          to="/peserta/tambah"
          className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Peserta
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green sm:text-sm transition-all"
              placeholder="Cari NIK atau Nama Peserta..."
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="block w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green sm:text-sm appearance-none"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Balita">Balita</option>
                <option value="Ibu Hamil">Ibu Hamil</option>
                <option value="Lansia">Lansia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Profil
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kelamin
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Ibu/Wali
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-gov-green border-t-transparent rounded-full"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPeserta.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">Tidak ada data ditemukan</p>
                    <p className="text-sm">Cobalah menyesuaikan filter atau pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredPeserta.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gov-green-light text-gov-green rounded-full flex items-center justify-center font-bold">
                          {p.nama_lengkap.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{p.nama_lengkap}</div>
                          <div className="text-xs text-gray-500">NIK: {p.nik}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${p.kategori === 'Balita' ? 'bg-blue-100 text-blue-800' : 
                          p.kategori === 'Ibu Hamil' ? 'bg-pink-100 text-pink-800' : 
                          'bg-purple-100 text-purple-800'}`}>
                        {p.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {p.nama_ibu || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gov-green p-1 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        {!loading && filteredPeserta.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between sm:px-6">
            <div className="text-sm text-gray-500">
              Menampilkan <span className="font-medium">1</span> - <span className="font-medium">{filteredPeserta.length}</span> dari <span className="font-medium">{peserta.length}</span> data
            </div>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 border border-gray-200 rounded-md bg-white text-gray-400 text-sm cursor-not-allowed">
                Sebelumnya
              </button>
              <button disabled className="px-3 py-1 border border-gray-200 rounded-md bg-white text-gray-400 text-sm cursor-not-allowed">
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
