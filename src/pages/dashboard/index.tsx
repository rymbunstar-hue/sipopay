import { Users, Baby, Activity, AlertCircle, BookOpen } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

const attendanceData = [
  { name: 'Jan', kehadiran: 65 },
  { name: 'Feb', kehadiran: 70 },
  { name: 'Mar', kehadiran: 68 },
  { name: 'Apr', kehadiran: 75 },
  { name: 'Mei', kehadiran: 82 },
  { name: 'Jun', kehadiran: 85 },
  { name: 'Jul', kehadiran: 88 },
];

const giziData = [
  { name: 'Kp. Ciawi', normal: 30, kurang: 4, stunting: 1 },
  { name: 'Kp. Cikadu', normal: 25, kurang: 3, stunting: 2 },
  { name: 'Kp. Sukasenang', normal: 40, kurang: 5, stunting: 0 },
  { name: 'Kp. Cigentis', normal: 20, kurang: 2, stunting: 2 },
];

export default function Dashboard() {
  const stats = [
    { title: 'Total Balita', value: '124', icon: Baby, color: 'bg-blue-500', trend: '+12% bulan ini' },
    { title: 'Ibu Hamil', value: '38', icon: Users, color: 'bg-pink-500', trend: '+4% bulan ini' },
    { title: 'Tingkat Kehadiran', value: '88%', icon: Activity, color: 'bg-green-500', trend: '+3% bulan ini' },
    { title: 'Beresiko Stunting', value: '5', icon: AlertCircle, color: 'bg-red-500', trend: '-2% bulan ini' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Utama</h1>
          <p className="text-gray-500 mt-1">Ringkasan statistik kesehatan dan kehadiran warga desa.</p>
        </div>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Line Chart Kehadiran */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Tren Tingkat Kehadiran Posyandu</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}%`, 'Kehadiran']}
                />
                <Line 
                  type="monotone" 
                  dataKey="kehadiran" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bar Chart Status Gizi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribusi Status Gizi Balita per Wilayah</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={giziData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey="normal" name="Normal" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="kurang" name="Gizi Kurang" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="stunting" name="Stunting" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Info & Kegiatan */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gov-green" />
          Panduan Kader & Info Penting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <strong className="block text-gray-900 font-semibold mb-1">Pengukuran Balita:</strong>
            Pastikan timbangan telah dikalibrasi ke angka nol sebelum anak naik ke alat ukur.
          </div>
          <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
            <strong className="block text-gray-900 font-semibold mb-1">Status KEK Bumil:</strong>
            Ibu hamil dengan Lingkar Lengan Atas (LiLA) &lt; 23.5 cm memerlukan perhatian khusus dan PMT tambahan.
          </div>
          <div className="p-4 bg-green-50/50 rounded-xl border border-green-100/50">
            <strong className="block text-gray-900 font-semibold mb-1">Pemberian Imunisasi:</strong>
            Catat nomor batch vaksin dengan benar untuk pelaporan dinas kesehatan setempat.
          </div>
        </div>
      </div>
    </div>
  );
}
