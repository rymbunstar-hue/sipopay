import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Calendar, Plus, X, Save, Clock, MapPin, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
const LOKASI_POSYANDU = [
  { id: 'pos-1', nama: 'Posyandu Bojong' },
  { id: 'pos-2', nama: 'Posyandu Leuwiceri' },
  { id: 'pos-3', nama: 'Posyandu Panonjer' },
  { id: 'pos-4', nama: 'Posyandu Bebedahan' },
  { id: 'pos-5', nama: 'Posyandu Cideeng' },
  { id: 'pos-6', nama: 'Posyandu Citundun' },
];

export default function JadwalPosyandu() {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    tempat: 'Posyandu Bojong',
    jam_mulai: '08:00',
    catatan: '',
  });

  const [posyandus, setPosyandus] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
    fetchPosyandus();
  }, [user]);

  const fetchPosyandus = async () => {
    const { data } = await supabase.from('posyandu').select('*');
    if (data) setPosyandus(data);
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('sesi_posyandu')
        .select('*, posyandu(*)')
        .order('tanggal', { ascending: false })
        .limit(20);

      if (!error && data) {
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      let posyanduId = formData.tempat;

      // Jika belum ada posyandu sama sekali
      if (!posyanduId || posyandus.length === 0) {
        // Coba cek sekali lagi di DB
        const { data: existingPos } = await supabase.from('posyandu').select('id').limit(1);
        if (existingPos && existingPos.length > 0) {
          posyanduId = existingPos[0].id;
        } else {
          throw new Error("Data Posyandu belum ada di database. Silakan login sebagai Super Admin untuk otomatis membuat data posyandu, atau tambahkan manual di Supabase.");
        }
      }

      // Gabungkan jam mulai ke dalam catatan agar tidak hilang (karena kolom jam_mulai belum ada di DB)
      const catatanLengkap = `[Jam: ${formData.jam_mulai}] ${formData.catatan}`;

      const payload = {
        posyandu_id: posyanduId,
        tanggal: formData.tanggal,
        status: 'aktif',
        kader_id: user?.id || null,
        catatan: catatanLengkap,
      };

      const { error } = await supabase.from('sesi_posyandu').insert([payload]);
      if (error) {
        if (error.message.includes('foreign key constraint')) {
          throw new Error("Posyandu yang dipilih tidak valid atau sudah dihapus.");
        }
        throw error;
      }

      fetchSessions();
      setShowModal(false);
      setFormData({ tanggal: new Date().toISOString().split('T')[0], tempat: posyandus[0]?.id || '', jam_mulai: '08:00', catatan: '' });
    } catch (err: any) {
      console.error(err);
      alert('Gagal menjadwalkan sesi posyandu baru:\n' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Set default tempat when modal opens
  useEffect(() => {
    if (showModal && posyandus.length > 0 && !formData.tempat) {
      setFormData(prev => ({ ...prev, tempat: posyandus[0].id }));
    }
  }, [showModal, posyandus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-gov-green" />
            Jadwal Posyandu
          </h1>
          <p className="text-gray-500 mt-1">Kelola jadwal kegiatan operasional Posyandu di seluruh wilayah desa.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Jadwal Posyandu Baru
        </button>
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
              placeholder="Cari jadwal posyandu..."
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors">
              <option>Semua Status</option>
              <option>Aktif</option>
              <option>Selesai</option>
            </select>
          </div>
        </div>

        <div className="p-0">
          {loadingSessions ? (
            <div className="py-20 text-center text-gray-500">
              <div className="animate-spin h-8 w-8 border-2 border-gov-green border-t-transparent rounded-full mx-auto mb-4"></div>
              <span>Memuat jadwal sesi...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base text-gray-500 mb-4">Belum ada jadwal posyandu.</p>
              <button 
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 bg-gov-green text-white rounded-xl text-sm font-medium hover:bg-gov-green-dark transition-colors"
              >
                Buat Jadwal Pertama
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${session.status === 'aktif' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-1">
                        {new Date(session.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {session.posyandu && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                            <MapPin className="h-4 w-4 text-gov-green" />
                            {session.posyandu.nama}
                          </span>
                        )}
                      </div>
                      {session.catatan && (
                        <p className="text-sm text-gray-500 mt-2">{session.catatan}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize w-full sm:w-auto text-center ${
                      session.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {session.status}
                    </span>
                    <button className="px-4 py-1.5 text-sm font-medium text-gov-green bg-gov-green/10 rounded-lg hover:bg-gov-green/20 transition-colors w-full sm:w-auto">
                      Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Jadwal Sesi Posyandu Baru</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSession}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Tempat Posyandu <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      required
                      value={formData.tempat}
                      onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors text-sm appearance-none"
                    >
                      {posyandus.length === 0 && <option value="">Belum ada posyandu</option>}
                      {posyandus.map(lok => (
                        <option key={lok.id} value={lok.id}>{lok.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Tanggal <span className="text-red-500">*</span></label>
                    <input 
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Jam Mulai <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="time"
                        required
                        value={formData.jam_mulai}
                        onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Catatan Agenda / Keterangan</label>
                  <textarea 
                    rows={3}
                    placeholder="Contoh: Pemberian vitamin A merah, Imunisasi DPT lengkap, penyuluhan PMT."
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors text-sm resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-gov-green rounded-xl hover:bg-gov-green-dark font-medium transition-colors shadow-md shadow-gov-green/20"
                >
                  {submitLoading ? 'Menyimpan...' : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Jadwal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
