-- ================================================================
-- JALANKAN INI DI SQL EDITOR SUPABASE
-- File ini memperbarui RLS agar Kader, Bidan, dan Admin Desa
-- bisa mengisi data Kunjungan Ibu Hamil, Balita, Lansia, Imunisasi, & Peserta
-- ================================================================

-- 1. Posyandu
DROP POLICY IF EXISTS "Allow admin/superadmin to manage posyandu" ON public.posyandu;
DROP POLICY IF EXISTS "Allow authenticated to manage posyandu" ON public.posyandu;

CREATE POLICY "Allow authenticated to manage posyandu" 
ON public.posyandu FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 2. Sesi Posyandu
DROP POLICY IF EXISTS "Allow health workers to manage sesi" ON public.sesi_posyandu;
DROP POLICY IF EXISTS "Allow authenticated to manage sesi" ON public.sesi_posyandu;

CREATE POLICY "Allow authenticated to manage sesi" 
ON public.sesi_posyandu FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 3. Kunjungan Ibu Hamil (Biar Kader & Bidan bisa input)
DROP POLICY IF EXISTS "Allow bidan/admin to manage kunjungan_ibu_hamil" ON public.kunjungan_ibu_hamil;
DROP POLICY IF EXISTS "Allow authenticated to manage kunjungan_ibu_hamil" ON public.kunjungan_ibu_hamil;

CREATE POLICY "Allow authenticated to manage kunjungan_ibu_hamil" 
ON public.kunjungan_ibu_hamil FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 4. Kunjungan Balita
DROP POLICY IF EXISTS "Allow health workers to manage kunjungan_balita" ON public.kunjungan_balita;
DROP POLICY IF EXISTS "Allow authenticated to manage kunjungan_balita" ON public.kunjungan_balita;

CREATE POLICY "Allow authenticated to manage kunjungan_balita" 
ON public.kunjungan_balita FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 5. Kunjungan Lansia
DROP POLICY IF EXISTS "Allow health workers to manage kunjungan_lansia" ON public.kunjungan_lansia;
DROP POLICY IF EXISTS "Allow authenticated to manage kunjungan_lansia" ON public.kunjungan_lansia;

CREATE POLICY "Allow authenticated to manage kunjungan_lansia" 
ON public.kunjungan_lansia FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 6. Imunisasi
DROP POLICY IF EXISTS "Allow bidan/admin to manage imunisasi" ON public.imunisasi;
DROP POLICY IF EXISTS "Allow authenticated to manage imunisasi" ON public.imunisasi;

CREATE POLICY "Allow authenticated to manage imunisasi" 
ON public.imunisasi FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 7. Peserta
DROP POLICY IF EXISTS "Allow health workers to manage peserta" ON public.peserta;
DROP POLICY IF EXISTS "Allow authenticated to manage peserta" ON public.peserta;

CREATE POLICY "Allow authenticated to manage peserta" 
ON public.peserta FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 8. Tambahkan 6 posyandu utama desa jika belum ada
INSERT INTO public.posyandu (nama, alamat, desa_id, ketua, aktif)
VALUES 
  ('Posyandu Bojong', 'Desa Sukasenang, Blok Bojong', 'sukasenang', 'Ibu Ratna', true),
  ('Posyandu Leuwiceri', 'Desa Sukasenang, Blok Leuwiceri', 'sukasenang', 'Ibu Tati', true),
  ('Posyandu Panonjer', 'Desa Sukasenang, Blok Panonjer', 'sukasenang', 'Ibu Neneng', true),
  ('Posyandu Bebedahan', 'Desa Sukasenang, Blok Bebedahan', 'sukasenang', 'Ibu Sari', true),
  ('Posyandu Cideeng', 'Desa Sukasenang, Blok Cideeng', 'sukasenang', 'Ibu Mimin', true),
  ('Posyandu Citundun', 'Desa Sukasenang, Blok Citundun', 'sukasenang', 'Ibu Yoyoh', true)
ON CONFLICT DO NOTHING;


