import React, { useState } from 'react';
import { FileText, Download, BarChart3, Baby, HeartPulse, Syringe, TrendingUp, Calendar } from 'lucide-react';

type ReportType = 'balita' | 'bumil' | 'imunisasi';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

// Dummy summary data for presentation
const summaryStats = {
  balita: [
    { bulan: 'April', hadir: 38, target: 50, stunting: 2 },
    { bulan: 'Mei', hadir: 42, target: 50, stunting: 3 },
    { bulan: 'Juni', hadir: 45, target: 50, stunting: 2 },
    { bulan: 'Juli', hadir: 40, target: 50, stunting: 3 },
  ],
  imunisasi: [
    { vaksin: 'DPT-HB-Hib 1', jumlah: 12, target: 15 },
    { vaksin: 'DPT-HB-Hib 2', jumlah: 10, target: 15 },
    { vaksin: 'Campak Rubella (MR)', jumlah: 14, target: 15 },
    { vaksin: 'BCG + Polio 1', jumlah: 11, target: 15 },
  ]
};

export default function Laporan() {
  const [activeTab, setActiveTab] = useState<ReportType>('balita');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const tabs: { id: ReportType; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'balita', label: 'Posyandu Balita', icon: Baby },
    { id: 'bumil', label: 'Ibu Hamil', icon: HeartPulse },
    { id: 'imunisasi', label: 'Imunisasi', icon: Syringe },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-gov-green" />
            Laporan & Rekap Data
          </h1>
          <p className="text-gray-500 mt-1">Rekapitulasi bulanan dan tahunan kegiatan posyandu.</p>
        </div>
        <button
          className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm"
          onClick={() => alert('Fitur export PDF akan tersedia segera.')}
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Filter Period */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4 text-gov-green" />
            Periode Laporan:
          </div>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-gov-green text-gov-green bg-gov-green/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'balita' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-1">Kehadiran Bulan Ini</p>
                  <p className="text-3xl font-bold text-blue-800">40</p>
                  <p className="text-xs text-blue-600 mt-1">dari 50 target balita</p>
                  <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                  <p className="text-sm font-medium text-red-700 mb-1">Terindikasi Stunting</p>
                  <p className="text-3xl font-bold text-red-800">3</p>
                  <p className="text-xs text-red-600 mt-1">perlu tindak lanjut segera</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                  <p className="text-sm font-medium text-green-700 mb-1">Capaian Gizi Baik</p>
                  <p className="text-3xl font-bold text-green-800">92%</p>
                  <p className="text-xs text-green-600 mt-1">dari total balita hadir</p>
                </div>
              </div>

              {/* Tren Kehadiran */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gov-green" />
                  Tren Kehadiran 4 Bulan Terakhir
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bulan</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hadir</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Target</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Capaian</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stunting</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summaryStats.balita.map((row) => {
                        const pct = Math.round((row.hadir / row.target) * 100);
                        return (
                          <tr key={row.bulan} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.bulan} {selectedYear}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.hadir} balita</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.target} balita</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                                  <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className={`font-semibold ${pct >= 80 ? 'text-green-700' : 'text-orange-600'}`}>{pct}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.stunting > 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {row.stunting} kasus
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bumil' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100">
                  <p className="text-sm font-medium text-pink-700 mb-1">Total Ibu Hamil Aktif</p>
                  <p className="text-3xl font-bold text-pink-800">38</p>
                  <p className="text-xs text-pink-600 mt-1">terdaftar di posyandu</p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                  <p className="text-sm font-medium text-orange-700 mb-1">Risiko Tinggi</p>
                  <p className="text-3xl font-bold text-orange-800">4</p>
                  <p className="text-xs text-orange-600 mt-1">memerlukan perhatian khusus</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                  <p className="text-sm font-medium text-red-700 mb-1">Status KEK</p>
                  <p className="text-3xl font-bold text-red-800">2</p>
                  <p className="text-xs text-red-600 mt-1">LiLA di bawah 23,5 cm</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 text-center">
                <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Grafik tren pemeriksaan ibu hamil akan ditampilkan di sini.</p>
              </div>
            </div>
          )}

          {activeTab === 'imunisasi' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                  <p className="text-sm font-medium text-green-700 mb-1">Total Vaksin Bulan Ini</p>
                  <p className="text-3xl font-bold text-green-800">47</p>
                  <p className="text-xs text-green-600 mt-1">dosis diberikan kepada balita</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-1">Cakupan IDL</p>
                  <p className="text-3xl font-bold text-blue-800">88%</p>
                  <p className="text-xs text-blue-600 mt-1">Imunisasi Dasar Lengkap</p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-gov-green" />
                  Rekapitulasi Per Jenis Vaksin
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Jenis Vaksin</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Diberikan</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Target</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Capaian</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summaryStats.imunisasi.map((row) => {
                        const pct = Math.round((row.jumlah / row.target) * 100);
                        return (
                          <tr key={row.vaksin} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.vaksin}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.jumlah} dosis</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.target} dosis</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                                  <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className={`font-semibold ${pct >= 80 ? 'text-green-700' : 'text-orange-600'}`}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
