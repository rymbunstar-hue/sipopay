-- TABEL HASIL DETEKSI STUNTING
-- Jalankan skrip ini di SQL Editor Supabase jika tabel belum tersedia

CREATE TABLE IF NOT EXISTS public.hasil_deteksi_stunting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    balita_id uuid REFERENCES public.peserta(id) ON DELETE CASCADE NOT NULL,
    tanggal_pemeriksaan date NOT NULL DEFAULT current_date,
    kategori text NOT NULL CHECK (kategori IN ('Normal', 'Risiko Sedang', 'Risiko Tinggi')),
    skor numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index untuk mempercepat query DISTINCT ON (balita_id) ORDER BY balita_id, tanggal_pemeriksaan DESC
CREATE INDEX IF NOT EXISTS idx_hasil_deteksi_stunting_balita_tgl 
ON public.hasil_deteksi_stunting (balita_id, tanggal_pemeriksaan DESC);

-- Enable RLS
ALTER TABLE public.hasil_deteksi_stunting ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS agar pengguna terautentikasi dapat membaca dan mengelola data
DROP POLICY IF EXISTS "Allow authenticated to read hasil_deteksi_stunting" ON public.hasil_deteksi_stunting;
CREATE POLICY "Allow authenticated to read hasil_deteksi_stunting" 
ON public.hasil_deteksi_stunting FOR SELECT TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage hasil_deteksi_stunting" ON public.hasil_deteksi_stunting;
CREATE POLICY "Allow authenticated to manage hasil_deteksi_stunting" 
ON public.hasil_deteksi_stunting FOR ALL TO authenticated 
USING (true) WITH CHECK (true);
