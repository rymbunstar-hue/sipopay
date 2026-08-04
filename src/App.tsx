import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Login from './pages/auth/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard';
import JadwalPosyandu from './pages/jadwal';
import DataKader from './pages/kader';
import FormPeserta from './pages/peserta/FormPeserta';
import PosyanduBalita from './pages/balita';
import FormKunjunganBalita from './pages/balita/FormKunjunganBalita';
import DataImunisasi from './pages/imunisasi';
import FormImunisasi from './pages/imunisasi/FormImunisasi';
import DataIbuHamil from './pages/bumil';
import FormIbuHamil from './pages/bumil/FormIbuHamil';
import DataLansia from './pages/lansia';
import FormLansia from './pages/lansia/FormKunjunganLansia';
import Laporan from './pages/laporan';
import Pengaturan from './pages/pengaturan';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jadwal" element={<JadwalPosyandu />} />
          
          {/* Data Kader */}
          <Route path="kader" element={<DataKader />} />
          <Route path="daftar-peserta" element={<FormPeserta />} />

          {/* Posyandu Balita */}
          <Route path="balita" element={<PosyanduBalita />} />
          <Route path="balita/tambah" element={<FormKunjunganBalita />} />
          
          {/* Imunisasi */}
          <Route path="imunisasi" element={<DataImunisasi />} />
          <Route path="imunisasi/tambah" element={<FormImunisasi />} />

          {/* Ibu Hamil */}
          <Route path="bumil" element={<DataIbuHamil />} />
          <Route path="bumil/tambah" element={<FormIbuHamil />} />

          {/* Lansia */}
          <Route path="lansia" element={<DataLansia />} />
          <Route path="lansia/tambah" element={<FormLansia />} />

          {/* Laporan */}
          <Route path="laporan" element={<Laporan />} />

          {/* Pengaturan Profil */}
          <Route path="pengaturan" element={<Pengaturan />} />
        </Route>

        {/* Fallback */}
        <Route path="/403" element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gov-light gap-4">
            <div className="bg-white rounded-2xl shadow-md p-10 flex flex-col items-center gap-4 border border-gray-100">
              <div className="text-6xl">🚫</div>
              <h1 className="text-2xl font-bold text-gray-900">Akses Ditolak</h1>
              <p className="text-gray-500 text-center max-w-xs">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
              <a href="/dashboard" className="mt-2 px-6 py-2.5 bg-gov-green text-white rounded-xl font-semibold hover:bg-gov-green-dark transition-colors">Kembali ke Dashboard</a>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
