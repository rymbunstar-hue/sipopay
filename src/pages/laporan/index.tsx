import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Baby, HeartPulse, Syringe, TrendingUp, Calendar, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
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
        onclone: (clonedDoc) => {
          // Override getComputedStyle di document clone untuk me-replace oklch secara real-time
          const win = clonedDoc.defaultView || window;
          if (win && win.getComputedStyle) {
            const origCS = win.getComputedStyle;
            win.getComputedStyle = function (el: Element, pseudo?: string | null) {
              const res = origCS.call(win, el, pseudo);
              return new Proxy(res, {
                get(target, prop) {
                  const val = (target as any)[prop];
                  if (typeof val === 'string' && val.includes('oklch')) {
                    return val.replace(/oklch\([^)]+\)/gi, 'rgb(22, 101, 52)');
                  }
                  if (prop === 'getPropertyValue') {
                    return (p: string) => {
                      const v = target.getPropertyValue(p);
                      return v && v.includes('oklch') ? v.replace(/oklch\([^)]+\)/gi, 'rgb(22, 101, 52)') : v;
                    };
                  }
                  return typeof val === 'function' ? val.bind(target) : val;
                }
              });
            };
          }

          // Replace oklch di semua tag <style>
          clonedDoc.querySelectorAll('style').forEach((s) => {
            if (s.textContent && s.textContent.includes('oklch')) {
              s.textContent = s.textContent.replace(/oklch\([^)]+\)/gi, 'rgb(22, 101, 52)');
            }
          });
        }
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
      pdf.setFontSize(12);
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

      const fileName = `SIPOPAY_Laporan_${activeTab.toUpperCase()}_${MONTHS[selectedMonth]}_${selectedYear}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.warn('html2canvas canvas rendering warn, fallback to native window.print():', err);
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    const { start, end } = getDateRange(selectedYear, selectedMonth);
    const periodTitle = `${MONTHS[selectedMonth]} ${selectedYear}`;

    try {
      let headersHtml = '';
      let rowsHtml = '';
      let docTitle = '';

      if (activeTab === 'balita') {
        docTitle = `REKAPITULASI POSYANDU BALITA - PERIODE ${periodTitle.toUpperCase()}`;
        headersHtml = `
          <tr>
            <th>No</th>
            <th>Tanggal Periksa</th>
            <th>Nama Balita</th>
            <th>NIK Balita</th>
            <th>Jenis Kelamin</th>
            <th>Tanggal Lahir</th>
            <th>Nama Ibu</th>
            <th>BB (kg)</th>
            <th>TB (cm)</th>
            <th>Lingkar Kepala</th>
            <th>Lingkar Lengan</th>
            <th>Status Gizi (BBU)</th>
            <th>Status Stunting</th>
            <th>Catatan Kader</th>
          </tr>
        `;

        const { data: rawKunjungan } = await supabase
          .from('kunjungan_balita')
          .select(`*, peserta (nama, nik, jenis_kelamin, tanggal_lahir, nama_ibu)`)
          .gte('tanggal', start)
          .lte('tanggal', end)
          .order('tanggal', { ascending: false });

        if (rawKunjungan && rawKunjungan.length > 0) {
          rawKunjungan.forEach((row: any, idx: number) => {
            const p = row.peserta || {};
            const isStunted = ['stunted', 'severely_stunted'].includes(row.stunting_status);
            rowsHtml += `
              <tr class="${idx % 2 === 1 ? 'even' : ''}">
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center;">${row.tanggal || '-'}</td>
                <td style="font-weight: bold; color: #111827;">${p.nama || '-'}</td>
                <td style="mso-number-format:'\\@'; text-align: center;">${p.nik || '-'}</td>
                <td style="text-align: center;">${p.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
                <td style="text-align: center;">${p.tanggal_lahir || '-'}</td>
                <td>${p.nama_ibu || '-'}</td>
                <td style="text-align: right; font-weight: bold;">${row.berat_badan || 0}</td>
                <td style="text-align: right; font-weight: bold;">${row.tinggi_badan || 0}</td>
                <td style="text-align: right;">${row.lingkar_kepala ? row.lingkar_kepala : '-'}</td>
                <td style="text-align: right;">${row.lingkar_lengan ? row.lingkar_lengan : '-'}</td>
                <td style="text-align: center;"><span class="${row.status_gizi_bbu === 'underweight' ? 'badge-danger' : 'badge-success'}">${row.status_gizi_bbu || 'Normal'}</span></td>
                <td style="text-align: center;"><span class="${isStunted ? 'badge-danger' : 'badge-success'}">${row.stunting_status || 'normal'}</span></td>
                <td>${row.catatan || '-'}</td>
              </tr>
            `;
          });
        } else {
          const { data: rawPeserta } = await supabase
            .from('peserta')
            .select('*')
            .eq('kategori', 'balita')
            .order('nama', { ascending: true });

          (rawPeserta || []).forEach((p: any, idx: number) => {
            rowsHtml += `
              <tr class="${idx % 2 === 1 ? 'even' : ''}">
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center;">${start}</td>
                <td style="font-weight: bold; color: #111827;">${p.nama || '-'}</td>
                <td style="mso-number-format:'\\@'; text-align: center;">${p.nik || '-'}</td>
                <td style="text-align: center;">${p.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
                <td style="text-align: center;">${p.tanggal_lahir || '-'}</td>
                <td>${p.nama_ibu || '-'}</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;"><span class="badge-neutral">Belum Diukur</span></td>
                <td style="text-align: center;"><span class="badge-neutral">Belum Diukur</span></td>
                <td>Terdaftar di database</td>
              </tr>
            `;
          });
        }
      } else if (activeTab === 'bumil') {
        docTitle = `REKAPITULASI PEMANTAUAN IBU HAMIL - PERIODE ${periodTitle.toUpperCase()}`;
        headersHtml = `
          <tr>
            <th>No</th>
            <th>Tanggal Periksa</th>
            <th>Nama Ibu Hamil</th>
            <th>NIK</th>
            <th>Usia Kehamilan</th>
            <th>Berat Badan</th>
            <th>Tekanan Darah</th>
            <th>LiLA (cm)</th>
            <th>Status KEK</th>
            <th>Status Risiko</th>
            <th>Catatan Bidan</th>
          </tr>
        `;

        const { data: rawBumil } = await supabase
          .from('kunjungan_ibu_hamil')
          .select(`*, peserta (nama, nik)`)
          .gte('tanggal', start)
          .lte('tanggal', end)
          .order('tanggal', { ascending: false });

        (rawBumil || []).forEach((row: any, idx: number) => {
          const p = row.peserta || {};
          const isHighRisk = ['tinggi', 'sangat_tinggi'].includes(row.status_risiko);
          rowsHtml += `
            <tr class="${idx % 2 === 1 ? 'even' : ''}">
              <td style="text-align: center;">${idx + 1}</td>
              <td style="text-align: center;">${row.tanggal || '-'}</td>
              <td style="font-weight: bold; color: #111827;">${p.nama || '-'}</td>
              <td style="mso-number-format:'\\@'; text-align: center;">${p.nik || '-'}</td>
              <td style="text-align: center;">${row.usia_kehamilan || 0} Minggu</td>
              <td style="text-align: right; font-weight: bold;">${row.berat_badan || 0} kg</td>
              <td style="text-align: center; font-weight: bold;">${row.tekanan_darah || '-'}</td>
              <td style="text-align: right;">${row.lila || 0} cm</td>
              <td style="text-align: center;"><span class="${row.status_kek ? 'badge-danger' : 'badge-success'}">${row.status_kek ? 'Ya (KEK)' : 'Tidak'}</span></td>
              <td style="text-align: center;"><span class="${isHighRisk ? 'badge-danger' : 'badge-success'}">${row.status_risiko || 'normal'}</span></td>
              <td>${row.catatan || '-'}</td>
            </tr>
          `;
        });
      } else if (activeTab === 'imunisasi') {
        docTitle = `REKAPITULASI PEMBERIAN IMUNISASI BALITA - PERIODE ${periodTitle.toUpperCase()}`;
        headersHtml = `
          <tr>
            <th>No</th>
            <th>Tanggal Pemberian</th>
            <th>Nama Balita</th>
            <th>NIK Balita</th>
            <th>Jenis Vaksin</th>
            <th>Nomor Batch</th>
            <th>Petugas Bidan / Pelaksana</th>
          </tr>
        `;

        const { data: rawImunisasi } = await supabase
          .from('imunisasi')
          .select(`*, peserta (nama, nik), profiles (nama)`)
          .gte('tanggal', start)
          .lte('tanggal', end)
          .order('tanggal', { ascending: false });

        (rawImunisasi || []).forEach((row: any, idx: number) => {
          const p = row.peserta || {};
          const b = row.profiles || {};
          rowsHtml += `
            <tr class="${idx % 2 === 1 ? 'even' : ''}">
              <td style="text-align: center;">${idx + 1}</td>
              <td style="text-align: center;">${row.tanggal || '-'}</td>
              <td style="font-weight: bold; color: #111827;">${p.nama || '-'}</td>
              <td style="mso-number-format:'\\@'; text-align: center;">${p.nik || '-'}</td>
              <td style="font-weight: bold; color: #166534;">${row.jenis_vaksin || '-'}</td>
              <td style="text-align: center;">${row.no_batch || '-'}</td>
              <td>${b.nama || 'Petugas Posyandu'}</td>
            </tr>
          `;
        });
      }

      const totalCols = activeTab === 'balita' ? 14 : activeTab === 'bumil' ? 11 : 7;

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>${activeTab.toUpperCase()}</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .main-header { background-color: #166534; color: #ffffff; font-size: 15px; font-weight: bold; text-align: center; padding: 12px; }
          .sub-header { background-color: #14532d; color: #dcfce7; font-size: 11px; text-align: center; padding: 6px; }
          th { background-color: #166534; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f3923; padding: 8px 12px; font-size: 11px; }
          td { border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 11px; vertical-align: middle; }
          .even { background-color: #f8fafc; }
          .badge-success { background-color: #dcfce7; color: #15803d; font-weight: bold; padding: 2px 8px; border-radius: 12px; }
          .badge-danger { background-color: #fee2e2; color: #b91c1c; font-weight: bold; padding: 2px 8px; border-radius: 12px; }
          .badge-neutral { background-color: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 12px; }
        </style>
        </head>
        <body>
          <table>
            <tr><th colspan="${totalCols}" class="main-header">SIPOPAY — ${docTitle}</th></tr>
            <tr><th colspan="${totalCols}" class="sub-header">Pemerintah Desa Sukasenang | Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</th></tr>
            <tr><td colspan="${totalCols}" style="height: 10px; border: none;"></td></tr>
            ${headersHtml}
            ${rowsHtml}
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `SIPOPAY_Rekap_${activeTab.toUpperCase()}_${periodTitle.replace(/\s+/g, '_')}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export Excel gagal:', err);
      alert('Gagal mengekspor data ke Excel.');
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Export Excel (.csv)
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="flex items-center gap-2 bg-gov-green hover:bg-gov-green-dark disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gov-green/20 transition-all text-sm cursor-pointer"
          >
            {exporting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Mengekspor...</>
            ) : (
              <><Download className="h-4 w-4" /> Export PDF</>
            )}
          </button>
        </div>
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
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
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
