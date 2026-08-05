import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, HeartPulse, Scale, Stethoscope, Pill, Search, X, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { getActiveSesiId } from '../../lib/seedPosyandu';

interface ComboboxOption { id: string; nama: string; nik?: string | null; }

function BumilCombobox({
  options,
  value,
  onChange,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter(o =>
        o.nama.toLowerCase().includes(query.toLowerCase()) ||
        (o.nik ?? '').includes(query)
      )
    : options;

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setOpen(prev => !prev)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 border rounded-xl cursor-pointer transition-colors ${
          open ? 'border-gov-green ring-2 ring-gov-green/20' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {open ? (
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
            placeholder="Ketik nama atau NIK ibu hamil..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 text-sm truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
            {selected ? selected.nama : '-- Cari & Pilih Ibu Hamil --'}
          </span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && !open && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
              title="Hapus pilihan"
            >
              <X className="h-3.5 w-3.5 text-gray-500" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Tidak ada ibu hamil ditemukan
              </div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gov-green/5 transition-colors ${
                    opt.id === value ? 'bg-gov-green/10' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{opt.nama}</p>
                    {opt.nik && (
                      <p className="text-xs text-gray-400">NIK: {opt.nik}</p>
                    )}
                  </div>
                  {opt.id === value && (
                    <span className="text-xs font-semibold text-gov-green">✓ Dipilih</span>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} dari {options.length} ibu hamil
          </div>
        </div>
      )}
      <input type="hidden" name="peserta_id" value={value} required />
    </div>
  );
}

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

    if (!formData.peserta_id) {
      alert('Silakan pilih ibu hamil terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const sesiId = await getActiveSesiId();

      const payload: any = {
        ...formData,
        hpht: formData.hpht || null,
        hpl: formData.hpl || null,
        berat_badan: parseFloat(formData.berat_badan),
        lila: parseFloat(formData.lila),
        tfu: formData.tfu ? parseFloat(formData.tfu) : null,
        usia_kehamilan: parseInt(formData.usia_kehamilan),
        detak_jantung_janin: formData.detak_jantung_janin ? parseInt(formData.detak_jantung_janin) : null,
        tablet_tambah_darah: formData.tablet_tambah_darah ? parseInt(formData.tablet_tambah_darah) : 0,
      };

      if (user?.id) payload.bidan_id = user.id;
      if (sesiId) payload.sesi_id = sesiId;

      let { error } = await supabase.from('kunjungan_ibu_hamil').insert([payload]);

      if (error && (error.code === '23503' || error.message?.includes('sesi_id_fkey'))) {
        delete payload.sesi_id;
        const retry = await supabase.from('kunjungan_ibu_hamil').insert([payload]);
        error = retry.error;
      }

      if (error) throw error;

      navigate('/bumil');
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(`Gagal menyimpan data: ${error?.message || 'Periksa koneksi internet Anda.'}`);
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
                <label className="text-sm font-medium text-gray-700">
                  Cari Ibu Hamil <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs font-normal text-gray-400">(ketik nama atau NIK)</span>
                </label>
                <BumilCombobox
                  options={pesertaList}
                  value={formData.peserta_id}
                  onChange={(id) => setFormData(prev => ({ ...prev, peserta_id: id }))}
                />
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
