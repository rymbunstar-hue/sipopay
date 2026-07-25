import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Users, Baby, Activity, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, role } = useAuthStore();

  const stats = [
    { title: 'Total Balita', value: '124', icon: Baby, color: 'bg-blue-500', trend: '+12% bulan ini' },
    { title: 'Ibu Hamil', value: '38', icon: Users, color: 'bg-pink-500', trend: '+4% bulan ini' },
    { title: 'Tingkat Kehadiran', value: '85%', icon: Activity, color: 'bg-green-500', trend: '+2% bulan ini' },
    { title: 'Beresiko Stunting', value: '5', icon: AlertCircle, color: 'bg-red-500', trend: '-2% bulan ini' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Utama</h1>
          <p className="text-gray-500 mt-1">Selamat datang kembali, mari pantau kesehatan warga desa hari ini.</p>
        </div>
        <button className="bg-gov-green hover:bg-gov-green-dark text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors text-sm">
          + Jadwal Posyandu Baru
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 text-opacity-100`}>
                <stat.icon className={`h-6 w-6 text-gray-700`} style={{ color: 'inherit' }} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <span className="text-xs font-medium text-gov-green">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity placeholder */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Grafik Kunjungan (Segera Hadir)</h3>
          <p className="text-sm text-gray-500 mt-1">Modul ini akan menampilkan grafik kunjungan posyandu.</p>
        </div>
      </div>
    </div>
  );
}
