export type StuntingKategori = 'Normal' | 'Risiko Sedang' | 'Risiko Tinggi';

export interface StuntingRiskResult {
  skor: number;
  kategori: StuntingKategori;
  usiaBulan: number;
  zScore: number;
}

/**
 * Menghitung usia balita dalam hitungan bulan
 */
export function calculateAgeInMonths(tanggalLahirStr: string, tanggalPemeriksaanStr?: string): number {
  if (!tanggalLahirStr) return 0;

  const birthDate = new Date(tanggalLahirStr);
  const examDate = tanggalPemeriksaanStr ? new Date(tanggalPemeriksaanStr) : new Date();

  if (isNaN(birthDate.getTime()) || isNaN(examDate.getTime())) return 0;

  let months = (examDate.getFullYear() - birthDate.getFullYear()) * 12 + (examDate.getMonth() - birthDate.getMonth());
  if (examDate.getDate() < birthDate.getDate()) {
    months--;
  }

  return Math.max(0, months);
}

/**
 * Menghitung teks label umur manusiawi (contoh: "2 tahun 3 bulan" atau "14 bulan")
 */
export function formatAgeText(tanggalLahirStr: string, tanggalPemeriksaanStr?: string): string {
  const totalMonths = calculateAgeInMonths(tanggalLahirStr, tanggalPemeriksaanStr);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years > 0) {
    return months > 0 ? `${years} thn ${months} bln` : `${years} tahun`;
  }
  return `${totalMonths} bulan`;
}

/**
 * Memperkirakan tinggi median standar WHO (cm) berdasarkan usia (bulan) dan jenis kelamin
 */
function getWHOMedianHeight(usiaBulan: number, jenisKelamin: string = 'L'): number {
  const isMale = jenisKelamin.toUpperCase() === 'L';

  // Median TB/PB standar WHO (cm)
  if (usiaBulan <= 0) return isMale ? 49.9 : 49.1;
  if (usiaBulan <= 6) return isMale ? 49.9 + ( usiaBulan * 2.9 ) : 49.1 + ( usiaBulan * 2.8 );
  if (usiaBulan <= 12) return isMale ? 67.6 + ( (usiaBulan - 6) * 1.35 ) : 65.7 + ( (usiaBulan - 6) * 1.38 );
  if (usiaBulan <= 24) return isMale ? 75.7 + ( (usiaBulan - 12) * 0.95 ) : 74.0 + ( (usiaBulan - 12) * 0.98 );
  if (usiaBulan <= 36) return isMale ? 87.1 + ( (usiaBulan - 24) * 0.75 ) : 85.7 + ( (usiaBulan - 24) * 0.77 );
  if (usiaBulan <= 48) return isMale ? 96.1 + ( (usiaBulan - 36) * 0.60 ) : 95.1 + ( (usiaBulan - 36) * 0.62 );
  return isMale ? 103.3 + ( Math.min(12, usiaBulan - 48) * 0.55 ) : 102.5 + ( Math.min(12, usiaBulan - 48) * 0.57 );
}

/**
 * Menghitung skor & kategori risiko stunting balita
 */
export function calculateStuntingRisk(params: {
  tinggiBadan: number;
  beratBadan?: number;
  tanggalLahir?: string;
  tanggalPemeriksaan?: string;
  jenisKelamin?: string;
}): StuntingRiskResult {
  const { tinggiBadan, tanggalLahir, tanggalPemeriksaan, jenisKelamin = 'L' } = params;

  const usiaBulan = tanggalLahir ? calculateAgeInMonths(tanggalLahir, tanggalPemeriksaan) : 12;
  const medianHeight = getWHOMedianHeight(usiaBulan, jenisKelamin);

  // Perkiraan Standar Deviasi (SD) ~ 3.5 - 4.5 cm
  const sd = 3.6 + (usiaBulan * 0.02);
  const zScore = parseFloat(((tinggiBadan - medianHeight) / sd).toFixed(2));

  let kategori: StuntingKategori = 'Normal';
  let skor = 0;

  if (zScore < -3.0) {
    // Sangat Pendek (Severely Stunted) -> Risiko Tinggi
    kategori = 'Risiko Tinggi';
    skor = Math.min(100, parseFloat((80 + Math.abs(zScore + 3) * 6.5).toFixed(1)));
  } else if (zScore < -2.0) {
    // Pendek (Stunted) -> Risiko Sedang
    kategori = 'Risiko Sedang';
    skor = parseFloat((45 + (Math.abs(zScore) - 2) * 25).toFixed(1));
  } else {
    // Normal -> Risiko Rendah / Normal
    kategori = 'Normal';
    if (zScore < -1.0) {
      skor = parseFloat((20 + (Math.abs(zScore) - 1) * 20).toFixed(1));
    } else {
      skor = Math.max(5, parseFloat((15 - zScore * 5).toFixed(1)));
    }
  }

  return {
    skor,
    kategori,
    usiaBulan,
    zScore
  };
}
