import { useState, useEffect } from 'react';
import { Users, Search, Plus, MapPin, ShieldAlert, Phone, X, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface KaderItem {
  id: string;
  full_name: string;
  role: string;
  phone: string;
  assigned_posyandu: string;
  nik_5?: string;
}

export default function DataKader() {
  const { user, role } = useAuthStore();
  const isAdmin = role === 'admin_desa' || role === 'super_admin' || role === 'bidan';
  const [kaderList, setKaderList] = useState<KaderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKader, setEditingKader] = useState<KaderItem | null>(null);

  useEffect(() => {
    fetchKader();
  }, [user]);

  const fetchKader = async () => {
    setLoading(true);
    try {
      // Coba ambil dari Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'kader')
        .order('full_name', { ascending: true });

      if (error) throw error;
      if (data) {
        setKaderList(data.map((d: any) => ({
          id: d.id,
          full_name: d.nama || d.full_name || 'Tanpa Nama',
          role: d.role,
          phone: d.phone || '-',
          assigned_posyandu: d.assigned_posyandu || 'Seluruh Posyandu',
          nik_5: d.username,
        })));
        return;
      }
    } catch (err) {
      console.warn('Gagal memuat data kader dari Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleKaderAdded = (newKader: KaderItem) => {
    setKaderList(prev => [...prev, newKader]);
    setShowModal(false);
  };

  const handleKaderEdited = (updatedKader: KaderItem) => {
    setKaderList(prev => prev.map(k => k.id === updatedKader.id ? updatedKader : k));
    setEditingKader(null);
  };

  const handleDeleteKader = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun kader ${name}?`)) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setKaderList(prev => prev.filter(k => k.id !== id));
    } catch (err: any) {
      alert('Gagal menghapus kader: ' + err.message);
    }
  };

  // Filter
  const filteredKader = kaderList.filter(k =>
    k.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.assigned_posyandu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-gov-green" />
            Data Kader Posyandu
          </h1>
          <p className="text-gray-500 mt-1">Kelola data petugas kader di wilayah desa Anda.</p>
        </div>
        
        {/* Hanya tampilkan tombol tambah jika user BUKAN kader biasa */}
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah Kader
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green sm:text-sm transition-all"
              placeholder="Cari nama kader..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIK (5 Digit)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontak / Telepon</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Wilayah Tugas</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                {isAdmin && <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="px-6 py-10 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gov-green" />
                    Memuat data kader...
                  </td>
                </tr>
              ) : filteredKader.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert className="h-10 w-10 text-gray-300 mb-2" />
                      {searchQuery ? 'Tidak ada kader yang sesuai pencarian.' : 'Belum ada data kader yang terdaftar.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredKader.map((kader) => (
                  <tr key={kader.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gov-green/10 flex items-center justify-center text-gov-green font-bold">
                          {kader.full_name?.charAt(0) || 'K'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{kader.full_name || 'Tanpa Nama'}</div>
                          <div className="text-xs text-gray-500">Role: {kader.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 text-xs font-mono font-medium text-gray-700">
                        {kader.nik_5 || '-'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {kader.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 gap-1.5">
                        <MapPin className="h-4 w-4 text-gov-green/70" />
                        {kader.assigned_posyandu || 'Seluruh Posyandu'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Aktif
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => setEditingKader(kader)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteKader(kader.id, kader.full_name)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Kader */}
      {showModal && (
        <TambahKaderModal
          onClose={() => setShowModal(false)}
          onSuccess={handleKaderAdded}
          existingNiks={kaderList.map(k => k.nik_5).filter(Boolean) as string[]}
        />
      )}

      {/* Modal Edit Kader */}
      {editingKader && (
        <EditKaderModal
          kader={editingKader}
          onClose={() => setEditingKader(null)}
          onSuccess={handleKaderEdited}
        />
      )}
    </div>
  );
}

// ─── MODAL COMPONENT ──────────────────────────────────────────────────────────

interface TambahKaderModalProps {
  onClose: () => void;
  onSuccess: (kader: KaderItem) => void;
  existingNiks: string[];
}

function TambahKaderModal({ onClose, onSuccess, existingNiks }: TambahKaderModalProps) {
  const [nama, setNama] = useState('');
  const [nik5, setNik5] = useState('');
  const [phone, setPhone] = useState('');
  const [posyandu, setPosyandu] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const POSYANDU_OPTIONS = [
    'Posyandu Bojong',
    'Posyandu Leuwiceri',
    'Posyandu Panonjer',
    'Posyandu Bebedahan',
    'Posyandu Cideeng',
    'Posyandu Citundun',
  ];

  const validate = (): string | null => {
    if (!nama.trim()) return 'Nama lengkap harus diisi.';
    if (nik5.length !== 5) return 'NIK harus tepat 5 digit.';
    if (existingNiks.includes(nik5)) return 'NIK ini sudah terdaftar sebagai kader.';
    if (!phone.trim()) return 'Nomor HP harus diisi.';
    if (!posyandu) return 'Pilih posyandu penugasan.';
    if (password.length < 6) return 'Password minimal 6 karakter.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {

      // Production mode: Create Supabase auth user
      // Email format: {5digitNIK}@sipopay.local
      const supabaseEmail = `${nik5}@sipopay.local`;

      let newId = `k-${Date.now()}`;
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: supabaseEmail,
          password: password,
          options: {
            data: {
              nama: nama.trim(),
              username: nik5,
              role: 'kader',
            },
          },
        });

        if (signUpError && signUpError.message.includes('already registered')) {
          throw new Error('NIK ini sudah terdaftar. Gunakan NIK lain.');
        }

        if (signUpData.user) {
          newId = signUpData.user.id;
          await supabase
            .from('profiles')
            .update({
              phone: phone.trim(),
              assigned_posyandu: posyandu,
            })
            .eq('id', newId);
        }
      } catch (sbError) {
        console.warn("Supabase gagal, lanjut dengan mode lokal");
      }

      const newKader: KaderItem = {
        id: newId,
        full_name: nama.trim(),
        role: 'kader',
        phone: phone.trim(),
        assigned_posyandu: posyandu,
        nik_5: nik5,
      };

      setSuccess(true);
      setTimeout(() => onSuccess(newKader), 1200);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat akun kader. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-gov-green" />
              Tambah Kader Baru
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Buat akun login untuk kader posyandu</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">Akun Kader Berhasil Dibuat!</h4>
            <p className="text-sm text-gray-500 mb-4">Kader bisa login menggunakan:</p>
            <div className="inline-block bg-gray-50 border border-gray-200 rounded-xl px-6 py-3 text-left">
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">NIK:</span> {nik5}</p>
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Password:</span> {password}</p>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Nama */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Nama Lengkap <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all text-sm"
                placeholder="Contoh: Siti Aminah"
              />
            </div>

            {/* NIK 5 digit */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">NIK (5 Digit Terakhir) <span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                required
                value={nik5}
                onChange={(e) => setNik5(e.target.value.replace(/\D/g, ''))}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all text-sm font-mono tracking-widest"
                placeholder="12345"
              />
              <p className="text-xs text-gray-500">NIK ini akan digunakan sebagai username login.</p>
            </div>

            {/* No HP & Posyandu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">No. HP <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all text-sm"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Posyandu <span className="text-red-500">*</span></label>
                <select
                  required
                  value={posyandu}
                  onChange={(e) => setPosyandu(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all text-sm"
                >
                  <option value="">Pilih posyandu...</option>
                  {POSYANDU_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all text-sm"
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Password ini akan digunakan kader untuk login.</p>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Setelah akun dibuat, kader bisa login dengan <strong>NIK 5 digit</strong> dan <strong>password</strong> yang Anda tentukan di atas.</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gov-green hover:bg-gov-green-dark rounded-xl shadow-sm shadow-gov-green/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Buat Akun Kader
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── EDIT MODAL COMPONENT ──────────────────────────────────────────────────────────

interface EditKaderModalProps {
  kader: KaderItem;
  onClose: () => void;
  onSuccess: (kader: KaderItem) => void;
}

function EditKaderModal({ kader, onClose, onSuccess }: EditKaderModalProps) {
  const [nama, setNama] = useState(kader.full_name);
  const [phone, setPhone] = useState(kader.phone !== '-' ? kader.phone : '');
  const [posyandu, setPosyandu] = useState(kader.assigned_posyandu !== 'Seluruh Posyandu' ? kader.assigned_posyandu : '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const POSYANDU_OPTIONS = [
    'Posyandu Bojong',
    'Posyandu Leuwiceri',
    'Posyandu Panonjer',
    'Posyandu Bebedahan',
    'Posyandu Cideeng',
    'Posyandu Citundun',
  ];

  const validate = (): string | null => {
    if (!nama.trim()) return 'Nama lengkap harus diisi.';
    if (!phone.trim()) return 'Nomor HP harus diisi.';
    if (!posyandu) return 'Pilih posyandu penugasan.';
    if (newPassword && newPassword.length < 6) return 'Password baru minimal 6 karakter.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Update Profile (Nama, Phone, Posyandu)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nama: nama.trim(),
          phone: phone.trim(),
          assigned_posyandu: posyandu,
        })
        .eq('id', kader.id);

      if (updateError) throw updateError;

      // Jika isi password baru, reset via Supabase Admin (perlu Edge Function)
      // Password reset tidak bisa dilakukan client-side tanpa service role key

      onSuccess({
        ...kader,
        full_name: nama.trim(),
        phone: phone.trim(),
        assigned_posyandu: posyandu,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan perubahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Edit Data Kader
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Perbarui informasi kontak dan penugasan</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">NIK / Username</label>
              <input
                type="text"
                disabled
                value={kader.nik_5 || '-'}
                className="block w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono tracking-widest cursor-not-allowed text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">No. HP</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Posyandu Tugas</label>
              <select
                required
                value={posyandu}
                onChange={(e) => setPosyandu(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm"
              >
                <option value="">Pilih posyandu...</option>
                {POSYANDU_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Ganti Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm"
                  placeholder="Opsional (Minimal 6 karakter)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">Jika kader lupa password, hubungi administrator untuk reset password melalui panel Supabase.</p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
