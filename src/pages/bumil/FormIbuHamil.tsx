import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, HeartPulse, Scale, Stethoscope, Pill } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DEMO_EMAILS, demoPeserta } from '../../lib/demoData';
import { useAuthStore } from '../../store/authStore';

export default function FormIbuHamil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    peserta_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    hpht: '',
    hpl: '',
    usia_kehamilan: '',
    berat_badan: '',
    tekanan_darah: '',
    lila: '',
    tfu: '',
    detak_jantung_janin: '',
    tablet_tambah_darah: '0',
    status_kek: false,
    status_risiko: 'normal',
    catatan: ''
  });

  useEffect(() => {
    const fetchPeserta = async () => {
      // Demo mode: load from demoPeserta
      if (DEMO_EMAILS.includes(user?.email || '')) {
        const bumilDemo = demoPeserta.filter(p => p.kategori === 'ibu_hamil');
        setPesertaList(bumilDemo);
        return;
      }

      const { data } = await supabase
        .from('peserta')
        .select('id, nama, nik')
        .eq('kategori', 'ibu_hamil')
        .order('nama', { ascending: true });
      if (data) setPesertaList(data);
    };
    fetchPeserta();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Auto-calc HPL & Usia Kehamilan saat HPHT berubah
  const handleHPHTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hpht = e.target.value;
    if (hpht) {
      const hphtDate = new Date(hpht);
      const hplDate = new Date(hphtDate.getTime() + 280 * 24 * 60 * 60 * 1000);
      const hplString = hplDate.toISOString().split('T')[0];
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - hphtDate.getTime()) / (1000 * 60 * 60 * 24));
      const usiaKehamilan = Math.floor(diffDays / 7);
      setFormData(prev => ({
        ...prev,
        hpht,
        hpl: hplString,
        usia_kehamilan: usiaKehamilan > 0 ? String(usiaKehamilan) : '',
      }));
    } else {
      setFormData(prev => ({ ...prev, hpht, hpl: '', usia_kehamilan: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (DEMO_EMAILS.includes(user?.email || '')) {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Simpan ke localStorage agar muncul di riwayat
        const selectedPeserta = pesertaList.find((p: any) => p.id === formData.peserta_id);
        const newKunjungan = {
          id: `bumil-${Date.now()}`,
          tanggal: formData.tanggal,
          usia_kehamilan: parseInt(formData.usia_kehamilan) || 0,
          berat_badan: parseFloat(formData.berat_badan) || 0,
          tekanan_darah: formData.tekanan_darah,
          status_risiko: formData.status_risiko,
          status_kek: formData.status_kek,
          peserta: { nama: selectedPeserta?.nama || 'Tidak diketahui', nik: selectedPeserta?.nik || '-' },
        };
        const saved = localStorage.getItem('demo_kunjungan_bumil');
        const { demoKunjunganBumil } = await import('../../lib/demoData');
        const existing = saved ? JSON.parse(saved) : [...demoKunjunganBumil];
        localStorage.setItem('demo_kunjungan_bumil', JSON.stringify([newKunjungan, ...existing]));
        alert('Data ibu hamil berhasil disimpan!');
        navigate('/bumil');
        return;
      }

      const payload = {
        ...formData,
        berat_badan: parseFloat(formData.berat_badan),
        lila: parseFloat(formData.lila),
        tfu: formData.tfu ? parseFloat(formData.tfu) : null,
        usia_kehamilan: parseInt(formData.usia_kehamilan),
        detak_jantung_janin: formData.detak_jantung_janin ? parseInt(formData.detak_jantung_janin) : null,
        tablet_tambah_darah: parseInt(formData.tablet_tambah_darah),
        bidan_id: user?.id,
        sesi_id: '00000000-0000-0000-0000-000000000000', // placeholder
      };

      const { error } = await supabase.from('kunjungan_ibu_hamil').insert([payload]);
      if (error) throw error;

      navigate('/bumil');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Gagal menyimpan data. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Input Pemeriksaan Ibu Hamil</h1>
          <p className="text-gray-500 mt-1">Pencatatan hasil pemeriksaan ANC (Antenatal Care).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">

          {/* Section: Identifikasi */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-gov-green" />
              Identifikasi Ibu Hamil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pilih Ibu Hamil <span className="text-red-500">*</span></label>
                <select
                  name="peserta_id"
                  required
                  value={formData.peserta_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                >
                  <option value="">-- Pilih Ibu Hamil --</option>
                  {pesertaList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.nik?.slice(0, 6)}...)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Pemeriksaan <span className="text-red-500">*</span></label>
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
                <label className="text-sm font-medium text-gray-700">HPHT (Hari Pertama Haid Terakhir)</label>
                <input
                  type="date"
                  name="hpht"
                  value={formData.hpht}
                  onChange={handleHPHTChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Usia Kehamilan (Minggu) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="usia_kehamilan"
                  required
                  min={1}
                  max={42}
                  value={formData.usia_kehamilan}
                  onChange={handleChange}
                  placeholder="Otomatis dari HPHT atau isi manual"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Section: Pengukuran */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-gov-green" />
              Hasil Pengukuran
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Berat Badan (kg) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="berat_badan"
                  required
                  step="0.1"
                  value={formData.berat_badan}
                  onChange={handleChange}
                  placeholder="0.0"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tekanan Darah (mmHg) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="tekanan_darah"
                  required
                  value={formData.tekanan_darah}
                  onChange={handleChange}
                  placeholder="Cth: 120/80"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">LiLA (cm) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="lila"
                  required
                  step="0.1"
                  value={formData.lila}
                  onChange={handleChange}
                  placeholder="0.0"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">TFU/Tinggi Fundus (cm)</label>
                <input
                  type="number"
                  name="tfu"
                  step="0.1"
                  value={formData.tfu}
                  onChange={handleChange}
                  placeholder="Opsional"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">DJJ (kali/menit)</label>
                <input
                  type="number"
                  name="detak_jantung_janin"
                  value={formData.detak_jantung_janin}
                  onChange={handleChange}
                  placeholder="Opsional"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Section: Penanganan */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-gov-green" />
              Status & Penanganan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tablet Tambah Darah (diberikan)</label>
                <div className="flex items-center gap-3">
                  <Pill className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="number"
                    name="tablet_tambah_darah"
                    min={0}
                    value={formData.tablet_tambah_darah}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  />
                  <span className="text-sm text-gray-500">tablet</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tingkat Risiko <span className="text-red-500">*</span></label>
                <select
                  name="status_risiko"
                  required
                  value={formData.status_risiko}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                >
                  <option value="normal">Normal</option>
                  <option value="tinggi">Risiko Tinggi</option>
                  <option value="sangat_tinggi">Risiko Sangat Tinggi</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100 col-span-1 md:col-span-2">
                <input
                  type="checkbox"
                  id="status_kek"
                  name="status_kek"
                  checked={formData.status_kek}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="status_kek" className="text-sm font-medium text-red-700 cursor-pointer">
                  Status KEK (Kekurangan Energi Kronik) — LiLA &lt; 23,5 cm
                </label>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Catatan Bidan</label>
                <textarea
                  name="catatan"
                  rows={3}
                  value={formData.catatan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors resize-none"
                  placeholder="Keluhan, saran, atau rencana tindak lanjut..."
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/bumil')}
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
                Simpan Pemeriksaan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
