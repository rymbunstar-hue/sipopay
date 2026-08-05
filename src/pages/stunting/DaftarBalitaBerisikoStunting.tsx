import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Eye, Baby, User, Calendar, Phone, MapPin, RefreshCw, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatAgeText } from '../../utils/stuntingCalculator';

interface BalitaStuntingItem {
  id: string;
  balita_id: string;
  nama_balita: string;
  nik: string | null;
  jenis_kelamin: string;
  tanggal_lahir: string;
  nama_ibu: string | null;
  nama_ayah: string | null;
  no_hp_ortu: string | null;
  alamat: string;
  rt: string;
  rw: string;
  tanggal_pemeriksaan: string;
  skor: number;
  kategori: string;
  tinggi_badan?: number | null;
  berat_badan?: number | null;
  z_score_tbu?: number | null;
}

export default function DaftarBalitaBerisikoStunting() {
  const navigate = useNavigate();
  const [data, setData] = useState<BalitaStuntingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<BalitaStuntingItem | null>(null);

  useEffect(() => {
    fetchData();

    // Realtime subscription — refresh otomatis saat ada perbaikan/penambahan data
    const sub = supabase
      .channel('stunting-list-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hasil_deteksi_stunting' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kunjungan_balita' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch data hasil_deteksi_stunting beserta peserta
      const { data: rawStunting } = await supabase
        .from('hasil_deteksi_stunting')
        .select(`
          *,
          peserta:balita_id (
            id, nama, nik, jenis_kelamin, tanggal_lahir, nama_ibu, nama_ayah, no_hp_ortu, alamat, rt, rw
          )
        `)
        .order('tanggal_pemeriksaan', { ascending: false });

      const latestPerBalitaMap = new Map<string, any>();

      if (rawStunting && rawStunting.length > 0) {
        // Ambil pemeriksaan terbaru per balita (DISTINCT ON balita_id)
        rawStunting.forEach((item: any) => {
          if (!latestPerBalitaMap.has(item.balita_id)) {
            latestPerBalitaMap.set(item.balita_id, item);
          }
        });

        // Filter hanya yang kategori = 'Risiko Tinggi'
        const filteredList: BalitaStuntingItem[] = [];
        latestPerBalitaMap.forEach((item) => {
          if (item.kategori === 'Risiko Tinggi' && item.peserta) {
            filteredList.push({
              id: item.id,
              balita_id: item.balita_id,
              nama_balita: item.peserta.nama || 'Tanpa Nama',
              nik: item.peserta.nik,
              jenis_kelamin: item.peserta.jenis_kelamin || 'L',
              tanggal_lahir: item.peserta.tanggal_lahir,
              nama_ibu: item.peserta.nama_ibu,
              nama_ayah: item.peserta.nama_ayah,
              no_hp_ortu: item.peserta.no_hp_ortu,
              alamat: item.peserta.alamat || 'Desa Sukasenang',
              rt: item.peserta.rt || '-',
              rw: item.peserta.rw || '-',
              tanggal_pemeriksaan: item.tanggal_pemeriksaan,
              skor: item.skor || 0,
              kategori: item.kategori,
            });
          }
        });

        setData(filteredList);
      } else {
        // Fallback ke kunjungan_balita jika tabel hasil_deteksi_stunting masih kosong
        const { data: rawKunjungan } = await supabase
          .from('kunjungan_balita')
          .select(`
            *,
            peserta (
              id, nama, nik, jenis_kelamin, tanggal_lahir, nama_ibu, nama_ayah, no_hp_ortu, alamat, rt, rw
            )
          `)
          .order('tanggal', { ascending: false });

        const latestKunjunganMap = new Map<string, any>();
        (rawKunjungan || []).forEach((k: any) => {
          if (k.peserta_id && !latestKunjunganMap.has(k.peserta_id)) {
            latestKunjunganMap.set(k.peserta_id, k);
          }
        });

        const fallbackList: BalitaStuntingItem[] = [];
        latestKunjunganMap.forEach((k) => {
          if ((k.stunting_status === 'severely_stunted' || k.status_gizi_tbu === 'Risiko Tinggi') && k.peserta) {
            fallbackList.push({
              id: k.id,
              balita_id: k.peserta_id,
              nama_balita: k.peserta.nama || 'Tanpa Nama',
              nik: k.peserta.nik,
              jenis_kelamin: k.peserta.jenis_kelamin || 'L',
              tanggal_lahir: k.peserta.tanggal_lahir,
              nama_ibu: k.peserta.nama_ibu,
              nama_ayah: k.peserta.nama_ayah,
              no_hp_ortu: k.peserta.no_hp_ortu,
              alamat: k.peserta.alamat || 'Desa Sukasenang',
              rt: k.peserta.rt || '-',
              rw: k.peserta.rw || '-',
              tanggal_pemeriksaan: k.tanggal,
              skor: 85.0,
              kategori: 'Risiko Tinggi',
              tinggi_badan: k.tinggi_badan,
              berat_badan: k.berat_badan,
              z_score_tbu: k.z_score_tbu
            });
          }
        });

        setData(fallbackList);
      }
    } catch (err) {
      console.error('Error fetching daftar balita berisiko stunting:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-7 w-7 text-red-600" />
              Daftar Balita Berisiko Stunting
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Data balita dengan status pemeriksaan terbaru kategori Risiko Tinggi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Main Content Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gov-green mb-3" />
            Memuat data balita berisiko stunting...
          </div>
        ) : data.length === 0 ? (
          /* Requirement 8: Jika belum ada data tampilkan "Tidak ada balita berisiko stunting." */
          <div className="p-16 text-center">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Baby className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Tidak ada balita berisiko stunting.
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Seluruh balita yang terdaftar saat ini berada dalam kondisi pertumbuhan normal dan risiko sedang.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nama Balita
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Umur
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nama Orang Tua
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tanggal Pemeriksaan
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Skor
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                    
                    {/* Nama Balita */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                          {item.nama_balita.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{item.nama_balita}</div>
                          <div className="text-xs text-gray-500">
                            {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} {item.nik ? `| NIK: ${item.nik}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Umur */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">
                        {formatAgeText(item.tanggal_lahir, item.tanggal_pemeriksaan)}
                      </span>
                    </td>

                    {/* Nama Orang Tua */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="font-medium text-gray-900">
                        {item.nama_ibu ? `Ibu: ${item.nama_ibu}` : item.nama_ayah ? `Ayah: ${item.nama_ayah}` : '-'}
                      </div>
                      {item.nama_ayah && item.nama_ibu && (
                        <div className="text-xs text-gray-500">Ayah: {item.nama_ayah}</div>
                      )}
                    </td>

                    {/* Tanggal Pemeriksaan */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(item.tanggal_pemeriksaan).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Skor */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className="inline-block font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                        {item.skor.toFixed(1)}
                      </span>
                    </td>

                    {/* Kategori */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                        ● {item.kategori}
                      </span>
                    </td>

                    {/* Tombol Detail */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gov-green text-white hover:bg-gov-green-dark rounded-xl text-xs font-semibold shadow-sm transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detail
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Balita */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-6 relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                  <Baby className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedItem.nama_balita}</h3>
                  <p className="text-xs text-gray-500">Detail Hasil Evaluasi Risiko Stunting</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-red-50 p-4 rounded-xl border border-red-100">
                <div>
                  <span className="text-xs text-red-600 font-medium block">Kategori Risiko</span>
                  <span className="font-bold text-red-800 text-base">● {selectedItem.kategori}</span>
                </div>
                <div>
                  <span className="text-xs text-red-600 font-medium block">Skor Stunting</span>
                  <span className="font-bold text-red-800 text-base">{selectedItem.skor.toFixed(1)} / 100</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  <span><strong>Orang Tua:</strong> Ibu {selectedItem.nama_ibu || '-'} {selectedItem.nama_ayah ? `/ Ayah ${selectedItem.nama_ayah}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span><strong>Tgl Pemeriksaan:</strong> {new Date(selectedItem.tanggal_pemeriksaan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span><strong>Usia Balita:</strong> {formatAgeText(selectedItem.tanggal_lahir, selectedItem.tanggal_pemeriksaan)}</span>
                </div>
                {selectedItem.no_hp_ortu && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span><strong>Kontak HP:</strong> {selectedItem.no_hp_ortu}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span><strong>Alamat:</strong> {selectedItem.alamat}, RT {selectedItem.rt} / RW {selectedItem.rw}</span>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900 text-xs space-y-1">
                <strong>Rekomendasi Tindak Lanjut:</strong>
                <p>1. Jadwalkan konseling gizi dan pendampingan oleh Kader / Bidan Desa.</p>
                <p>2. Berikan Pemberian Makanan Tambahan (PMT) kaya protein hewani.</p>
                <p>3. Pantau tinggi dan berat badan secara berkala setiap bulan.</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
