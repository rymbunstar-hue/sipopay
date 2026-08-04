import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Scale, Activity, HeartPulse, Search, X, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { useAuthStore } from '../../store/authStore';
import { getActiveSesiId } from '../../lib/seedPosyandu';
// ── Searchable Combobox Component ──────────────────────────────────────────
interface ComboboxOption { id: string; nama: string; nik?: string | null; }

function LansiaCombobox({
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
            placeholder="Ketik nama atau NIK lansia..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 text-sm truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
            {selected ? selected.nama : '-- Cari & Pilih Lansia --'}
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
                Tidak ada lansia ditemukan
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
            {filtered.length} dari {options.length} lansia
          </div>
        </div>
      )}
      <input type="hidden" name="peserta_id" value={value} required />
    </div>
  );
}

// ── Main Form ───────────────────────────────────────────────────────────────
export default function FormKunjunganLansia() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    peserta_id: '',
    tanggal_kunjungan: new Date().toISOString().split('T')[0],
    berat_badan: '',
    tekanan_darah: '',
    gula_darah: '',
    kolesterol: '',
    asam_urat: '',
    keluhan: '',
    tindak_lanjut: ''
  });

  useEffect(() => {
    const fetchPeserta = async () => {

      const { data } = await supabase
        .from('peserta')
        .select('id, nama, nik')
        .eq('kategori', 'lansia')
        .order('nama', { ascending: true });
      
      if (data) setPesertaList(data);
    };
    fetchPeserta();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.peserta_id) {
      alert('Silakan pilih peserta lansia terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const sesiId = await getActiveSesiId();

      const kunjunganData: any = {
        peserta_id: formData.peserta_id,
        berat_badan: parseFloat(formData.berat_badan),
        tekanan_darah: formData.tekanan_darah,
        gula_darah: formData.gula_darah ? parseInt(formData.gula_darah) : null,
        kolesterol: formData.kolesterol ? parseInt(formData.kolesterol) : null,
        asam_urat: formData.asam_urat ? parseFloat(formData.asam_urat) : null,
        keluhan: formData.keluhan || null,
        tindak_lanjut: formData.tindak_lanjut || null,
        tanggal: formData.tanggal_kunjungan
      };

      if (sesiId) kunjunganData.sesi_id = sesiId;
      if (user?.id) kunjunganData.petugas_id = user.id;

      let { error } = await supabase.from('kunjungan_lansia').insert([kunjunganData]);

      if (error && (error.code === '23503' || error.message?.includes('sesi_id_fkey'))) {
        delete kunjunganData.sesi_id;
        const retry = await supabase.from('kunjungan_lansia').insert([kunjunganData]);
        error = retry.error;
      }

      if (error) throw error;
      
      navigate('/lansia');
    } catch (error: any) {
      console.error('Error saving kunjungan lansia:', error);
      alert(`Gagal menyimpan data kunjungan: ${error?.message || 'Error tidak diketahui'}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Input Kunjungan Lansia</h1>
          <p className="text-gray-500 mt-1">Pencatatan hasil pemeriksaan kesehatan Posyandu Lansia.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-gov-green" />
              Data Lansia & Jadwal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Cari Lansia
                  <span className="ml-1 text-xs font-normal text-gray-400">(ketik nama atau NIK)</span>
                </label>
                <LansiaCombobox
                  options={pesertaList}
                  value={formData.peserta_id}
                  onChange={(id) => setFormData(prev => ({ ...prev, peserta_id: id }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Kunjungan</label>
                <input 
                  type="date" 
                  name="tanggal_kunjungan"
                  required
                  value={formData.tanggal_kunjungan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-gov-green" />
              Pemeriksaan Kesehatan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-gray-400" /> Berat Badan (kg)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  name="berat_badan"
                  required
                  value={formData.berat_badan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Tekanan Darah (mmHg)</label>
                <input 
                  type="text" 
                  name="tekanan_darah"
                  required
                  value={formData.tekanan_darah}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="Contoh: 120/80"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Gula Darah (mg/dL) - Opsional</label>
                <input 
                  type="number" 
                  name="gula_darah"
                  value={formData.gula_darah}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Kolesterol (mg/dL) - Opsional</label>
                <input 
                  type="number" 
                  name="kolesterol"
                  value={formData.kolesterol}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Asam Urat (mg/dL) - Opsional</label>
                <input 
                  type="number" 
                  step="0.1"
                  name="asam_urat"
                  value={formData.asam_urat}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="0.0"
                />
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-gov-green" />
              Keluhan & Tindak Lanjut
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Keluhan</label>
                <textarea 
                  name="keluhan"
                  rows={2}
                  value={formData.keluhan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors resize-none"
                  placeholder="Contoh: Sering pegal, pusing..."
                ></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tindak Lanjut</label>
                <textarea 
                  name="tindak_lanjut"
                  rows={2}
                  value={formData.tindak_lanjut}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors resize-none"
                  placeholder="Contoh: Diberikan obat, disarankan ke Puskesmas..."
                ></textarea>
              </div>
            </div>
          </section>

        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => navigate('/lansia')}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors text-sm"
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-white bg-gov-green rounded-xl hover:bg-gov-green-dark font-medium transition-colors text-sm shadow-md shadow-gov-green/20 disabled:opacity-70"
          >
            {loading ? 'Menyimpan...' : (
              <>
                <Save className="h-4 w-4" />
                Simpan Data
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
