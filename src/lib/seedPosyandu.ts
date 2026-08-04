import { supabase } from './supabase';

const POSYANDU_LIST = [
  { nama: 'Posyandu Bojong', alamat: 'Desa Sukasenang, Blok Bojong', desa_id: 'sukasenang', ketua: 'Ibu Ratna', aktif: true },
  { nama: 'Posyandu Leuwiceri', alamat: 'Desa Sukasenang, Blok Leuwiceri', desa_id: 'sukasenang', ketua: 'Ibu Tati', aktif: true },
  { nama: 'Posyandu Panonjer', alamat: 'Desa Sukasenang, Blok Panonjer', desa_id: 'sukasenang', ketua: 'Ibu Neneng', aktif: true },
  { nama: 'Posyandu Bebedahan', alamat: 'Desa Sukasenang, Blok Bebedahan', desa_id: 'sukasenang', ketua: 'Ibu Sari', aktif: true },
  { nama: 'Posyandu Cideeng', alamat: 'Desa Sukasenang, Blok Cideeng', desa_id: 'sukasenang', ketua: 'Ibu Mimin', aktif: true },
  { nama: 'Posyandu Citundun', alamat: 'Desa Sukasenang, Blok Citundun', desa_id: 'sukasenang', ketua: 'Ibu Yoyoh', aktif: true },
];

let _posyanduMap: Record<string, string> = {};

export async function ensurePosyanduExists(): Promise<Record<string, string>> {
  try {
    const { data: existing } = await supabase.from('posyandu').select('id, nama');
    
    if (existing && existing.length > 0) {
      _posyanduMap = {};
      for (const p of existing) {
        _posyanduMap[p.nama] = p.id;
      }

      return _posyanduMap;
    }

    // Try inserting default list if empty
    for (const pos of POSYANDU_LIST) {
      const { data: inserted } = await supabase
        .from('posyandu')
        .insert([pos])
        .select('id, nama');
      if (inserted && inserted.length > 0) {
        _posyanduMap[inserted[0].nama] = inserted[0].id;
      }
    }

    const { data: allPos } = await supabase.from('posyandu').select('id, nama');
    if (allPos && allPos.length > 0) {
      _posyanduMap = {};
      for (const p of allPos) {
        _posyanduMap[p.nama] = p.id;
      }
    }
    return _posyanduMap;
  } catch (err) {
    console.error('Error seeding posyandu:', err);
    return _posyanduMap;
  }
}

export async function getPosyanduIdByName(nama: string): Promise<string | null> {
  // Query DB directly first
  try {
    const { data: directMatch } = await supabase.from('posyandu').select('id, nama');
    if (directMatch && directMatch.length > 0) {
      const match = directMatch.find(p => p.nama.toLowerCase().trim() === nama.toLowerCase().trim());
      if (match) return match.id;
      // Return first available posyandu if exact match not found
      return directMatch[0].id;
    }
  } catch (e) {
    console.warn('Direct posyandu fetch failed:', e);
  }

  // Fallback to seed map
  const map = await ensurePosyanduExists();
  if (map[nama]) return map[nama];
  const keys = Object.keys(map);
  if (keys.length > 0) return map[keys[0]];

  return null;
}

