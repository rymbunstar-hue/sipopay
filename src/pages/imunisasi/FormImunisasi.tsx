import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Syringe, User, Calendar, Search, X, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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

interface ComboboxOption { id: string; nama: string; nik?: string | null; tanggal_lahir?: string | null; }

function ImunisasiBalitaCombobox({
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
            placeholder="Ketik nama atau NIK balita..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 text-sm truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
            {selected ? selected.nama : '-- Cari & Pilih Balita --'}
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
                Tidak ada balita ditemukan
              </div>
            ) : (
              filtered.map(opt => {
                const usia = opt.tanggal_lahir
                  ? Math.floor((new Date().getTime() - new Date(opt.tanggal_lahir).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
                  : null;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gov-green/5 transition-colors ${
                      opt.id === value ? 'bg-gov-green/10' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {opt.nama} {usia !== null ? <span className="text-xs text-gray-500 font-normal">({usia} bln)</span> : ''}
                      </p>
                      {opt.nik && (
                        <p className="text-xs text-gray-400">NIK: {opt.nik}</p>
                      )}
                    </div>
                    {opt.id === value && (
                      <span className="text-xs font-semibold text-gov-green">✓ Dipilih</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} dari {options.length} balita
          </div>
        </div>
      )}
      <input type="hidden" name="peserta_id" value={value} required />
    </div>
  );
}

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

    if (!formData.peserta_id) {
      alert('Silakan pilih balita terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {

      const { error } = await supabase.from('imunisasi').insert([{
        ...formData,
        no_batch: formData.no_batch || null,
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
              <label className="text-sm font-medium text-gray-700">
                Cari Balita <span className="text-red-500">*</span>
                <span className="ml-1 text-xs font-normal text-gray-400">(ketik nama atau NIK)</span>
              </label>
              <ImunisasiBalitaCombobox
                options={pesertaList}
                value={formData.peserta_id}
                onChange={(id) => setFormData(prev => ({ ...prev, peserta_id: id }))}
              />
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
