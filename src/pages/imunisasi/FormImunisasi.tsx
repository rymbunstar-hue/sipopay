import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Syringe, User, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DEMO_EMAILS } from '../../lib/demoData';
import { useAuthStore } from '../../store/authStore';

const JENIS_VAKSIN_OPTIONS = [
  'Hepatitis B (HB0)',
  'BCG + Polio 1',
  'DPT-HB-Hib 1 + Polio 2',
  'DPT-HB-Hib 2 + Polio 3',
  'DPT-HB-Hib 3 + Polio 4 + IPV',
  'Campak Rubella (MR)',
  'DPT-HB-Hib 4 (Lanjutan 18 bln)',
  'Campak Rubella Lanjutan (24 bln)',
  'HPV Dosis 1',
  'HPV Dosis 2',
  'Lainnya',
];

export default function FormImunisasi() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    peserta_id: '',
    jenis_vaksin: '',
    tanggal: new Date().toISOString().split('T')[0],
    no_batch: '',
  });

  useEffect(() => {
    const fetchPeserta = async () => {
      const { data } = await supabase
        .from('peserta')
        .select('id, nama, nik, tanggal_lahir')
        .eq('kategori', 'balita')
        .order('nama', { ascending: true });
      if (data) setPesertaList(data);
    };
    fetchPeserta();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (DEMO_EMAILS.includes(user?.email || '')) {
        await new Promise(resolve => setTimeout(resolve, 800));
        navigate('/imunisasi');
        return;
      }

      const { error } = await supabase.from('imunisasi').insert([{
        ...formData,
        pemberi_id: user?.id,
      }]);

      if (error) throw error;
      navigate('/imunisasi');
    } catch (error) {
      console.error('Error saving imunisasi:', error);
      alert('Gagal menyimpan data imunisasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Input Data Imunisasi</h1>
          <p className="text-gray-500 mt-1">Pencatatan pemberian vaksin sesuai jadwal imunisasi dasar lengkap.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">

          {/* Identitas Balita */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gov-green" />
              Identitas Balita
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pilih Balita <span className="text-red-500">*</span></label>
              <select
                name="peserta_id"
                required
                value={formData.peserta_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
              >
                <option value="">-- Pilih Balita --</option>
                {pesertaList.map(p => {
                  const usia = p.tanggal_lahir
                    ? Math.floor((new Date().getTime() - new Date(p.tanggal_lahir).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    : null;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.nama} {usia !== null ? `(${usia} bln)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </section>

          {/* Data Vaksin */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <Syringe className="h-5 w-5 text-gov-green" />
              Data Vaksinasi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Jenis Vaksin <span className="text-red-500">*</span></label>
                <select
                  name="jenis_vaksin"
                  required
                  value={formData.jenis_vaksin}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                >
                  <option value="">-- Pilih Jenis Vaksin --</option>
                  {JENIS_VAKSIN_OPTIONS.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Tanggal Pemberian <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal"
                  required
                  value={formData.tanggal}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nomor Batch Vaksin</label>
                <input
                  type="text"
                  name="no_batch"
                  value={formData.no_batch}
                  onChange={handleChange}
                  placeholder="Opsional (cth: A2345678)"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
            <strong className="block mb-1">Catatan Penting:</strong>
            Pastikan identitas balita sesuai dengan buku KIA / KMS. Data pemberian vaksin akan tercatat atas nama bidan yang sedang login.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/imunisasi')}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-white bg-gov-green rounded-xl hover:bg-gov-green-dark font-medium transition-colors text-sm shadow-md shadow-gov-green/20 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Vaksinasi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
