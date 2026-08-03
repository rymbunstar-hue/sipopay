import { supabase } from './supabase';

const POSYANDU_LIST = [
  { nama: 'Posyandu Bojong', alamat: 'Desa Sukasenang, Blok Bojong', desa_id: 'sukasenang', ketua: 'Ibu Ratna', aktif: true },
  { nama: 'Posyandu Leuwiceri', alamat: 'Desa Sukasenang, Blok Leuwiceri', desa_id: 'sukasenang', ketua: 'Ibu Tati', aktif: true },
  { nama: 'Posyandu Panonjer', alamat: 'Desa Sukasenang, Blok Panonjer', desa_id: 'sukasenang', ketua: 'Ibu Neneng', aktif: true },
  { nama: 'Posyandu Bebedahan', alamat: 'Desa Sukasenang, Blok Bebedahan', desa_id: 'sukasenang', ketua: 'Ibu Sari', aktif: true },
  { nama: 'Posyandu Cideeng', alamat: 'Desa Sukasenang, Blok Cideeng', desa_id: 'sukasenang', ketua: 'Ibu Mimin', aktif: true },
  { nama: 'Posyandu Citundun', alamat: 'Desa Sukasenang, Blok Citundun', desa_id: 'sukasenang', ketua: 'Ibu Yoyoh', aktif: true },
];

// Cache agar tidak query berulang kali
let _seeded = false;
let _posyanduMap: Record<string, string> = {}; // nama -> id

/**
 * Pastikan 6 posyandu ada di database.
 * Jika sudah ada, langsung return map nama->id.
 * Jika belum, coba insert satu per satu.
 */
export async function ensurePosyanduExists(): Promise<Record<string, string>> {
  if (_seeded && Object.keys(_posyanduMap).length > 0) {
    return _posyanduMap;
  }

  try {
    // 1. Cek dulu apa saja yang sudah ada
    const { data: existing } = await supabase.from('posyandu').select('id, nama');
    
    if (existing && existing.length >= 6) {
      // Sudah lengkap, langsung buat map
      _posyanduMap = {};
      for (const p of existing) {
        _posyanduMap[p.nama] = p.id;
      }
      _seeded = true;
      return _posyanduMap;
    }

    // 2. Cari yang belum ada berdasarkan nama, lalu insert satu per satu
    const existingNames = new Set(existing?.map(p => p.nama) || []);
    
    for (const pos of POSYANDU_LIST) {
      if (!existingNames.has(pos.nama)) {
        // Cek sekali lagi by nama sebelum insert (extra safety)
        const { data: check } = await supabase.from('posyandu').select('id').eq('nama', pos.nama).limit(1);
        if (check && check.length > 0) {
          existingNames.add(pos.nama);
          continue;
        }

        const { error } = await supabase
          .from('posyandu')
          .insert([pos])
          .select('id, nama');
        
        if (error) {
          console.warn(`Gagal insert ${pos.nama}:`, error.message);
        } else {
          existingNames.add(pos.nama);
        }
      }
    }

    // 3. Re-fetch semua posyandu untuk mendapatkan map lengkap
    const { data: allPos } = await supabase.from('posyandu').select('id, nama');
    _posyanduMap = {};
    if (allPos) {
      for (const p of allPos) {
        _posyanduMap[p.nama] = p.id;
      }
    }

    _seeded = true;
    return _posyanduMap;
  } catch (err) {
    console.error('Error seeding posyandu:', err);
    return _posyanduMap;
  }
}

/**
 * Dapatkan UUID posyandu berdasarkan nama.
 * Akan otomatis seed jika belum pernah dijalankan.
 */
export async function getPosyanduIdByName(nama: string): Promise<string | null> {
  const map = await ensurePosyanduExists();
  return map[nama] || null;
}
