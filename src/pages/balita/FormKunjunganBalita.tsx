import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Scale, Ruler, Activity, Baby } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function FormKunjunganBalita() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    peserta_id: '',
    tanggal_kunjungan: new Date().toISOString().split('T')[0],
    berat_badan: '',
    tinggi_badan: '',
    lingkar_kepala: '',
    lingkar_lengan: '',
    catatan_kader: ''
  });

  useEffect(() => {
    // Fetch registered balita
    const fetchPeserta = async () => {
      const { data } = await supabase
        .from('peserta')
        .select('id, nama_lengkap, nik')
        .eq('kategori', 'Balita')
        .order('nama_lengkap', { ascending: true });
      
      if (data) setPesertaList(data);
    };
    fetchPeserta();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate z-score calculation and standard deviation
      const kunjunganData = {
        ...formData,
        berat_badan: parseFloat(formData.berat_badan),
        tinggi_badan: parseFloat(formData.tinggi_badan),
        lingkar_kepala: formData.lingkar_kepala ? parseFloat(formData.lingkar_kepala) : null,
        lingkar_lengan: formData.lingkar_lengan ? parseFloat(formData.lingkar_lengan) : null,
        z_score_bb_u: 0.5, // Dummy calculated
        z_score_tb_u: 0.2, // Dummy calculated
        z_score_bb_tb: 0.3, // Dummy calculated
        status_gizi: 'Normal'
      };

      const { error } = await supabase.from('kunjungan_balita').insert([kunjunganData]);

      if (error) throw error;
      
      navigate('/balita');
    } catch (error) {
      console.error('Error saving kunjungan:', error);
      alert('Gagal menyimpan data kunjungan.');
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
          <h1 className="text-2xl font-bold text-gray-900">Input Kunjungan Balita</h1>
          <p className="text-gray-500 mt-1">Pencatatan hasil penimbangan dan pengukuran Posyandu bulanan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <Baby className="h-5 w-5 text-gov-green" />
              Data Balita & Jadwal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pilih Balita</label>
                <select 
                  name="peserta_id"
                  required
                  value={formData.peserta_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                >
                  <option value="">-- Pilih Balita --</option>
                  {pesertaList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama_lengkap} ({p.nik.slice(0,6)}...)</option>
                  ))}
                </select>
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
              <Scale className="h-5 w-5 text-gov-green" />
              Pengukuran Fisik
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
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gray-400" /> Tinggi / Panjang Badan (cm)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  name="tinggi_badan"
                  required
                  value={formData.tinggi_badan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Lingkar Kepala (cm) - Opsional</label>
                <input 
                  type="number" 
                  step="0.1"
                  name="lingkar_kepala"
                  value={formData.lingkar_kepala}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Lingkar Lengan (cm) - Opsional</label>
                <input 
                  type="number" 
                  step="0.1"
                  name="lingkar_lengan"
                  value={formData.lingkar_lengan}
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
              Catatan Kader
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Keterangan Tambahan / Keluhan</label>
              <textarea 
                name="catatan_kader"
                rows={3}
                value={formData.catatan_kader}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors resize-none"
                placeholder="Contoh: Balita mengalami demam ringan, disarankan minum ASI lebih sering."
              ></textarea>
            </div>
          </section>

        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => navigate('/balita')}
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
                Simpan Kunjungan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
