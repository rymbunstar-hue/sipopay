import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Baby, HeartPulse, Syringe, TrendingUp, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ReportType = 'balita' | 'bumil' | 'imunisasi';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

interface BalitaStat {
  hadir: number;
  totalTerdaftar: number;
  stunting: number;
  giziKurang: number;
  pct: number;
}

interface BumilStat {
  total: number;
  risikoTinggi: number;
  statusKek: number;
  kunjunganBulanIni: number;
}

interface ImunisasiStat {
  totalDosis: number;
  perJenis: { vaksin: string; jumlah: number }[];
}

interface TrendRow {
  bulan: string;
  hadir: number;
  target: number;
  stunting: number;
}

export default function Laporan() {
  const [activeTab, setActiveTab] = useState<ReportType>('balita');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [balitaStat, setBalitaStat] = useState<BalitaStat | null>(null);
  const [bumilStat, setBumilStat] = useState<BumilStat | null>(null);
  const [imunisasiStat, setImunisasiStat] = useState<ImunisasiStat | null>(null);
  const [trendData, setTrendData] = useState<TrendRow[]>([]);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, activeTab]);

  const getDateRange = (year: number, month: number) => {
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    return { start, end };
  };

  const fetchData = async () => {
    setLoading(true);
    const { start, end } = getDateRange(selectedYear, selectedMonth);

    try {
      if (activeTab === 'balita') {
        // Total balita terdaftar
        const { count: totalBalita } = await supabase
          .from('peserta')
          .select('*', { count: 'exact', head: true })
          .eq('kategori', 'balita')
          .eq('aktif', true);

        // Kunjungan bulan ini (unique peserta = hadir)
        const { data: kunjungan } = await supabase
          .from('kunjungan_balita')
          .select('peserta_id, stunting_status, status_gizi_bbu')
          .gte('tanggal', start)
          .lte('tanggal', end);

        const uniquePeserta = new Set((kunjungan || []).map((k: any) => k.peserta_id));
        const stunting = (kunjungan || []).filter((k: any) => ['stunted', 'severely_stunted'].includes(k.stunting_status)).length;
        const giziKurang = (kunjungan || []).filter((k: any) => k.status_gizi_bbu === 'underweight').length;
        const hadir = uniquePeserta.size;
        const total = totalBalita || 0;

        setBalitaStat({
          hadir,
          totalTerdaftar: total,
          stunting,
          giziKurang,
          pct: total > 0 ? Math.round((hadir / total) * 100) : 0,
        });

        // Tren 4 bulan terakhir
        const trend: TrendRow[] = [];
        for (let i = 3; i >= 0; i--) {
          const d = new Date(selectedYear, selectedMonth - i, 1);
          const { start: s, end: e } = getDateRange(d.getFullYear(), d.getMonth());
          const { data: kj } = await supabase
            .from('kunjungan_balita')
            .select('peserta_id, stunting_status')
            .gte('tanggal', s).lte('tanggal', e);

          const uniqHadir = new Set((kj || []).map((k: any) => k.peserta_id)).size;
          const stuntBulan = (kj || []).filter((k: any) => ['stunted', 'severely_stunted'].includes(k.stunting_status)).length;
          trend.push({
            bulan: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
            hadir: uniqHadir,
            target: total,
            stunting: stuntBulan,
          });
        }
        setTrendData(trend);
      }

      if (activeTab === 'bumil') {
        const { count: totalBumil } = await supabase
          .from('peserta')
          .select('*', { count: 'exact', head: true })
          .eq('kategori', 'ibu_hamil')
          .eq('aktif', true);

        const { data: kunjunganBumil } = await supabase
          .from('kunjungan_ibu_hamil')
          .select('status_kek, status_risiko')
          .gte('tanggal', start)
          .lte('tanggal', end);

        const risikoTinggi = (kunjunganBumil || []).filter((k: any) => ['tinggi', 'sangat_tinggi'].includes(k.status_risiko)).length;
        const statusKek = (kunjunganBumil || []).filter((k: any) => k.status_kek === true).length;

        setBumilStat({
          total: totalBumil || 0,
          risikoTinggi,
          statusKek,
          kunjunganBulanIni: (kunjunganBumil || []).length,
        });
      }

      if (activeTab === 'imunisasi') {
        const { data: imunisasi } = await supabase
          .from('imunisasi')
          .select('jenis_vaksin')
          .gte('tanggal', start)
          .lte('tanggal', end);

        const perJenis: Record<string, number> = {};
        (imunisasi || []).forEach((item: any) => {
          perJenis[item.jenis_vaksin] = (perJenis[item.jenis_vaksin] || 0) + 1;
        });

        setImunisasiStat({
          totalDosis: (imunisasi || []).length,
          perJenis: Object.entries(perJenis).map(([vaksin, jumlah]) => ({ vaksin, jumlah })),
        });
      }
    } catch (err) {
      console.error('Error fetching laporan data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      // Header PDF
      pdf.setFillColor(22, 101, 52); // gov-green
      pdf.rect(0, 0, pdfWidth, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SIPOPAY — Laporan Posyandu Desa Sukasenang', pdfWidth / 2, 8, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Periode: ${MONTHS[selectedMonth]} ${selectedYear} | Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, pdfWidth / 2, 14, { align: 'center' });

      // Konten laporan
      pdf.addImage(imgData, 'PNG', imgX, 20, imgWidth * ratio, imgHeight * ratio);

      // Footer
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(7);
      pdf.text('Dokumen ini dibuat secara otomatis oleh Sistem Informasi Posyandu (SIPOPAY)', pdfWidth / 2, pdfHeight - 5, { align: 'center' });

      const fileName = `Laporan_${activeTab}_${MONTHS[selectedMonth]}_${selectedYear}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Export PDF gagal:', err);
      alert('Gagal mengekspor PDF. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  };

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
          <p className="text-gray-500 mt-1">Rekapitulasi bulanan kegiatan posyandu secara real-time.</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting || loading}
          className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm"
        >
          {exporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Mengekspor...</>
          ) : (
            <><Download className="h-4 w-4" /> Export PDF</>
          )}
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
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gov-green" />}
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

        {/* Report Content — bagian ini yang akan di-capture jadi PDF */}
        <div ref={reportRef} className="p-6 bg-white">
          {/* PDF Header (hanya tampil di print mode) */}
          <div className="hidden print:block mb-4 pb-4 border-b-2 border-gov-green">
            <h2 className="text-xl font-bold">Laporan Posyandu Desa Sukasenang</h2>
            <p className="text-sm text-gray-600">Periode: {MONTHS[selectedMonth]} {selectedYear}</p>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-gov-green" />
              <p className="text-sm">Memuat data dari database...</p>
            </div>
          ) : (
            <>
              {/* ======== TAB BALITA ======== */}
              {activeTab === 'balita' && balitaStat && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                      <p className="text-sm font-medium text-blue-700 mb-1">Kehadiran Bulan Ini</p>
                      <p className="text-3xl font-bold text-blue-800">{balitaStat.hadir}</p>
                      <p className="text-xs text-blue-600 mt-1">dari {balitaStat.totalTerdaftar} target balita</p>
                      <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${balitaStat.pct}%` }}></div>
                      </div>
                      <p className="text-xs text-blue-700 font-semibold mt-1">{balitaStat.pct}% capaian</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                      <p className="text-sm font-medium text-red-700 mb-1">Terindikasi Stunting</p>
                      <p className="text-3xl font-bold text-red-800">{balitaStat.stunting}</p>
                      <p className="text-xs text-red-600 mt-1">{balitaStat.stunting > 0 ? 'perlu tindak lanjut segera' : 'tidak ada kasus bulan ini'}</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                      <p className="text-sm font-medium text-green-700 mb-1">Capaian Gizi Baik</p>
                      <p className="text-3xl font-bold text-green-800">
                        {balitaStat.hadir > 0 ? Math.round(((balitaStat.hadir - balitaStat.giziKurang - balitaStat.stunting) / balitaStat.hadir) * 100) : 0}%
                      </p>
                      <p className="text-xs text-green-600 mt-1">dari total balita hadir</p>
                    </div>
                  </div>

                  {/* Tren Kehadiran */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gov-green" />
                      Tren Kehadiran 4 Bulan Terakhir
                    </h3>
                    {trendData.length === 0 ? (
                      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
                        <AlertCircle className="h-4 w-4" />
                        Belum ada data kunjungan yang tercatat.
                      </div>
                    ) : (
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
                            {trendData.map((row) => {
                              const pct = row.target > 0 ? Math.round((row.hadir / row.target) * 100) : 0;
                              return (
                                <tr key={row.bulan} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.bulan}</td>
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
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.stunting > 2 ? 'bg-red-100 text-red-700' : row.stunting > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                      {row.stunting} kasus
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======== TAB BUMIL ======== */}
              {activeTab === 'bumil' && bumilStat && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100">
                      <p className="text-sm font-medium text-pink-700 mb-1">Total Ibu Hamil Aktif</p>
                      <p className="text-3xl font-bold text-pink-800">{bumilStat.total}</p>
                      <p className="text-xs text-pink-600 mt-1">terdaftar di posyandu</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                      <p className="text-sm font-medium text-blue-700 mb-1">Kunjungan Bulan Ini</p>
                      <p className="text-3xl font-bold text-blue-800">{bumilStat.kunjunganBulanIni}</p>
                      <p className="text-xs text-blue-600 mt-1">pemeriksaan tercatat</p>
                    </div>
                    <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                      <p className="text-sm font-medium text-orange-700 mb-1">Risiko Tinggi</p>
                      <p className="text-3xl font-bold text-orange-800">{bumilStat.risikoTinggi}</p>
                      <p className="text-xs text-orange-600 mt-1">memerlukan perhatian khusus</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                      <p className="text-sm font-medium text-red-700 mb-1">Status KEK</p>
                      <p className="text-3xl font-bold text-red-800">{bumilStat.statusKek}</p>
                      <p className="text-xs text-red-600 mt-1">LiLA di bawah 23,5 cm</p>
                    </div>
                  </div>
                  {bumilStat.kunjunganBulanIni === 0 && (
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      Belum ada kunjungan ibu hamil yang tercatat pada bulan {MONTHS[selectedMonth]} {selectedYear}.
                    </div>
                  )}
                </div>
              )}

              {/* ======== TAB IMUNISASI ======== */}
              {activeTab === 'imunisasi' && imunisasiStat && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                      <p className="text-sm font-medium text-green-700 mb-1">Total Vaksin Bulan Ini</p>
                      <p className="text-3xl font-bold text-green-800">{imunisasiStat.totalDosis}</p>
                      <p className="text-xs text-green-600 mt-1">dosis diberikan kepada balita</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                      <p className="text-sm font-medium text-blue-700 mb-1">Jenis Vaksin Berbeda</p>
                      <p className="text-3xl font-bold text-blue-800">{imunisasiStat.perJenis.length}</p>
                      <p className="text-xs text-blue-600 mt-1">jenis diberikan bulan ini</p>
                    </div>
                  </div>

                  {imunisasiStat.perJenis.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      Belum ada data imunisasi untuk periode {MONTHS[selectedMonth]} {selectedYear}.
                    </div>
                  ) : (
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
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Proporsi</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {imunisasiStat.perJenis.map((row) => {
                              const pct = imunisasiStat.totalDosis > 0 ? Math.round((row.jumlah / imunisasiStat.totalDosis) * 100) : 0;
                              return (
                                <tr key={row.vaksin} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.vaksin}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{row.jumlah} dosis</td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                        <div className="h-2 rounded-full bg-gov-green" style={{ width: `${pct}%` }}></div>
                                      </div>
                                      <span className="font-semibold text-gov-green">{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
