-- ================================================================
-- JALANKAN INI DI SQL EDITOR SUPABASE
-- File ini memperbaiki RLS agar kader bisa insert posyandu
-- dan menambahkan 6 posyandu ke database
-- ================================================================

-- 1. Hapus policy lama jika ada
DROP POLICY IF EXISTS "Allow admin/superadmin to manage posyandu" ON public.posyandu;
DROP POLICY IF EXISTS "Allow authenticated to manage posyandu" ON public.posyandu;

-- 2. Buat policy baru: semua user yang terautentikasi bisa mengelola posyandu
CREATE POLICY "Allow authenticated to manage posyandu" 
ON public.posyandu FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Tambahkan 6 posyandu langsung ke database
INSERT INTO public.posyandu (nama, alamat, desa_id, ketua, aktif)
VALUES 
  ('Posyandu Bojong', 'Desa Sukasenang, Blok Bojong', 'sukasenang', 'Ibu Ratna', true),
  ('Posyandu Leuwiceri', 'Desa Sukasenang, Blok Leuwiceri', 'sukasenang', 'Ibu Tati', true),
  ('Posyandu Panonjer', 'Desa Sukasenang, Blok Panonjer', 'sukasenang', 'Ibu Neneng', true),
  ('Posyandu Bebedahan', 'Desa Sukasenang, Blok Bebedahan', 'sukasenang', 'Ibu Sari', true),
  ('Posyandu Cideeng', 'Desa Sukasenang, Blok Cideeng', 'sukasenang', 'Ibu Mimin', true),
  ('Posyandu Citundun', 'Desa Sukasenang, Blok Citundun', 'sukasenang', 'Ibu Yoyoh', true)
ON CONFLICT DO NOTHING;

-- 4. Perbaiki juga policy sesi_posyandu biar kader bisa insert
DROP POLICY IF EXISTS "Allow health workers to manage sesi" ON public.sesi_posyandu;
DROP POLICY IF EXISTS "Allow authenticated to manage sesi" ON public.sesi_posyandu;

CREATE POLICY "Allow authenticated to manage sesi" 
ON public.sesi_posyandu FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

