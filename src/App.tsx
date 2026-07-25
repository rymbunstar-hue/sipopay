import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Login from './pages/auth/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard';
import DataPeserta from './pages/peserta';
import FormPeserta from './pages/peserta/FormPeserta';
import PosyanduBalita from './pages/balita';
import FormKunjunganBalita from './pages/balita/FormKunjunganBalita';
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
          
          {/* Placeholders for other routes */}
          <Route path="peserta" element={<DataPeserta />} />
          <Route path="peserta/tambah" element={<FormPeserta />} />
          <Route path="balita" element={<PosyanduBalita />} />
          <Route path="balita/tambah" element={<FormKunjunganBalita />} />
          <Route path="imunisasi" element={<div className="p-4"><h1>Imunisasi</h1></div>} />
          <Route path="bumil" element={<div className="p-4"><h1>Ibu Hamil</h1></div>} />
          <Route path="laporan" element={<div className="p-4"><h1>Laporan</h1></div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
