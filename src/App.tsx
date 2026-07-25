import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Components & Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import UnderConstruction from './components/common/UnderConstruction';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';

// Placeholder Pages for under construction modules
const SesiPosyanduPlaceholder = () => (
  <UnderConstruction 
    title="Sesi Posyandu & Penimbangan" 
    phase="Fase 1: Inti (Pengembangan Berlanjut)" 
    description="Modul ini digunakan kader untuk membuka loket pelayanan bulanan posyandu, mencatat kehadiran, dan menginput hasil penimbangan berat/tinggi badan peserta secara langsung."
  />
);

const PesertaPlaceholder = () => (
  <UnderConstruction 
    title="Manajemen Data Peserta" 
    phase="Fase 1: Inti (Pengembangan Berlanjut)" 
    description="Modul ini digunakan untuk mendaftarkan, mengedit, dan mencari data identitas peserta Posyandu Desa Sukasenang (Balita, Ibu Hamil, dan Lansia)."
  />
);

const GiziKMSPlaceholder = () => (
  <UnderConstruction 
    title="KMS Digital & Pemantauan Gizi" 
    phase="Fase 1: Inti (Pengembangan Berlanjut)" 
    description="Modul ini menghitung status antropometri Z-Score berdasarkan standar Kemenkes RI/WHO secara real-time dan menampilkan grafik kurva tumbuh kembang Kartu Menuju Sehat (KMS) digital."
  />
);

const ImunisasiPlaceholder = () => (
  <UnderConstruction 
    title="Riwayat & Jadwal Imunisasi" 
    phase="Fase 1: Inti (Selesai Akhir Bulan 2)" 
    description="Modul pencatatan pemberian vaksin bayi dan imunisasi wajib nasional Kemenkes (HB0, BCG, DPT-HB-Hib, Polio, Campak/MR) beserta alert jadwal mendatang."
  />
);

const IbuHamilPlaceholder = () => (
  <UnderConstruction 
    title="Kesehatan Ibu Hamil (ANC/KIA)" 
    phase="Fase 2: Perluasan (Bulan 3)" 
    description="Pencatatan data antenatal care (ANC) untuk ibu hamil (K1-K4), status KEK (Kekurangan Energi Kronis), lingkar lengan (LILA), tinggi fundus uteri, dan deteksi risiko kehamilan."
  />
);

const LansiaPlaceholder = () => (
  <UnderConstruction 
    title="Kesehatan Lansia" 
    phase="Fase 2: Perluasan (Bulan 3)" 
    description="Modul pemeriksaan bulanan posyandu lansia, mencakup data tensi darah, gula darah sewaktu (GDS), kolesterol, asam urat, serta keluhan kesehatan harian."
  />
);

const LaporanBulananPlaceholder = () => (
  <UnderConstruction 
    title="Laporan Bulanan Posyandu" 
    phase="Fase 1: Inti (Pengembangan Berlanjut)" 
    description="Generator laporan bulanan otomatis posyandu (Format Formulir F1, F2, F3, dan F4 Kemenkes) siap ekspor ke PDF dan Excel untuk pelaporan ke Puskesmas Tanjungjaya."
  />
);

const ManajemenPenggunaPlaceholder = () => (
  <UnderConstruction 
    title="Manajemen Akun Pengguna" 
    phase="Fase 1: Inti (Selesai Akhir Bulan 1)" 
    description="Panel kontrol admin untuk mendaftarkan akun kader baru, bidan desa, perangkat desa, serta mengatur hak akses menu masing-masing role."
  />
);

export default function App() {
  const { initialize, user, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gov-light">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gov-green"></div>
          <p className="text-sm font-bold text-gov-green">Memuat data SIPOPAY...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Login */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Rute Terproteksi dengan Layout Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sesi"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin_desa', 'kader']}>
              <DashboardLayout>
                <SesiPosyanduPlaceholder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/peserta"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin_desa', 'bidan', 'kader']}>
              <DashboardLayout>
                <PesertaPlaceholder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/gizi"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin_desa', 'bidan', 'kader']}>
              <DashboardLayout>
                <GiziKMSPlaceholder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/imunisasi"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin_desa', 'bidan', 'kader']}>
              <DashboardLayout>
                <ImunisasiPlaceholder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ibu-hamil"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin_desa', 'bidan']}>
              <DashboardLayout>
                <IbuHamilPlaceholder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lansia"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin_desa', 'bidan', 'kader']}>
              <DashboardLayout>
                <LansiaPlaceholder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/laporan"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin_desa', 'bidan', 'kader']}>
              <DashboardLayout>
                <LaporanBulananPlaceholder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pengguna"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin_desa']}>
              <DashboardLayout>
                <ManajemenPenggunaPlaceholder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect Rute Tidak Dikenal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
