-- SCHEMA DATABASE SIPOPAY
-- Jalankan di SQL Editor Supabase Anda

-- 1. TABEL POSYANDU
create table public.posyandu (
    id uuid primary key default gen_random_uuid(),
    nama text not null,
    alamat text not null,
    desa_id text not null default 'sukasenang',
    ketua text,
    aktif boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS untuk posyandu
alter table public.posyandu enable row level security;

-- 2. TABEL PROFILES (Terkoneksi ke auth.users)
create table public.profiles (
    id uuid primary key references auth.users on delete cascade,
    nama text not null,
    username text unique not null,
    role text not null check (role in ('super_admin', 'admin_desa', 'bidan', 'kader', 'masyarakat')),
    posyandu_id uuid references public.posyandu(id) on delete set null,
    aktif boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS untuk profiles
alter table public.profiles enable row level security;

-- 3. TABEL PESERTA
create table public.peserta (
    id uuid primary key default gen_random_uuid(),
    nik text unique,
    nomor_kk text not null,
    nama text not null,
    tanggal_lahir date not null,
    jenis_kelamin char(1) not null check (jenis_kelamin in ('L', 'P')),
    kategori text not null check (kategori in ('balita', 'ibu_hamil', 'ibu_menyusui', 'lansia')),
    alamat text not null,
    rt text not null,
    rw text not null,
    no_hp_ortu text,
    posyandu_id uuid references public.posyandu(id) on delete cascade not null,
    nama_ibu text,
    nama_ayah text,
    aktif boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS untuk peserta
alter table public.peserta enable row level security;

-- 4. TABEL SESI POSYANDU (Jadwal operasional Posyandu)
create table public.sesi_posyandu (
    id uuid primary key default gen_random_uuid(),
    posyandu_id uuid references public.posyandu(id) on delete cascade not null,
    tanggal date not null,
    status text not null check (status in ('aktif', 'selesai')) default 'aktif',
    kader_id uuid references public.profiles(id) on delete set null,
    catatan text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS untuk sesi_posyandu
alter table public.sesi_posyandu enable row level security;

-- 5. TABEL KUNJUNGAN BALITA (Penimbangan & Status Gizi)
create table public.kunjungan_balita (
    id uuid primary key default gen_random_uuid(),
    peserta_id uuid references public.peserta(id) on delete cascade not null,
    sesi_id uuid references public.sesi_posyandu(id) on delete cascade not null,
    berat_badan numeric(5,2) not null, -- dalam kg, maks 999.99
    tinggi_badan numeric(5,2) not null, -- dalam cm, maks 999.99
    cara_ukur text not null check (cara_ukur in ('telentang', 'berdiri')),
    lingkar_kepala numeric(4,2), -- dalam cm, maks 99.99
    lingkar_lengan numeric(4,2), -- dalam cm, maks 99.99
    z_score_bbu numeric(4,2),
    z_score_tbu numeric(4,2),
    z_score_bbtb numeric(4,2),
    status_gizi_bbu text,
    status_gizi_tbu text,
    status_gizi_bbtb text,
    stunting_status text check (stunting_status in ('normal', 'severely_stunted', 'stunted', 'tall')),
    catatan text,
    kader_id uuid references public.profiles(id) on delete set null not null,
    tanggal date not null default current_date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS untuk kunjungan_balita
alter table public.kunjungan_balita enable row level security;

-- 6. TABEL IMUNISASI
create table public.imunisasi (
    id uuid primary key default gen_random_uuid(),
    peserta_id uuid references public.peserta(id) on delete cascade not null,
    jenis_vaksin text not null,
    tanggal date not null default current_date,
    no_batch text,
    pemberi_id uuid references public.profiles(id) on delete set null not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS untuk imunisasi
alter table public.imunisasi enable row level security;

-- 7. TABEL KUNJUNGAN IBU HAMIL (Pemeriksaan ANC/KIA)
create table public.kunjungan_ibu_hamil (
    id uuid primary key default gen_random_uuid(),
    peserta_id uuid references public.peserta(id) on delete cascade not null,
    sesi_id uuid references public.sesi_posyandu(id) on delete cascade not null,
    hpht date,
    hpl date,
    usia_kehamilan integer not null, -- dalam minggu
    berat_badan numeric(5,2) not null,
    tekanan_darah text not null,
    lila numeric(4,2) not null, -- lingkar lengan atas
    tfu numeric(4,2), -- tinggi fundus uteri
    detak_jantung_janin integer,
    tablet_tambah_darah integer not null default 0,
    status_kek boolean not null default false, -- Kekurangan Energi Kronik
    status_risiko text not null check (status_risiko in ('normal', 'tinggi', 'sangat_tinggi')) default 'normal',
    catatan text,
    bidan_id uuid references public.profiles(id) on delete set null not null,
    tanggal date not null default current_date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS untuk kunjungan_ibu_hamil
alter table public.kunjungan_ibu_hamil enable row level security;

-- 8. TABEL KUNJUNGAN LANSIA
create table public.kunjungan_lansia (
    id uuid primary key default gen_random_uuid(),
    peserta_id uuid references public.peserta(id) on delete cascade not null,
    sesi_id uuid references public.sesi_posyandu(id) on delete cascade not null,
    berat_badan numeric(5,2) not null,
    tekanan_darah text not null,
    gula_darah integer, -- mg/dL
    kolesterol integer, -- mg/dL
    asam_urat numeric(4,2), -- mg/dL
    keluhan text,
    tindak_lanjut text,
    petugas_id uuid references public.profiles(id) on delete set null not null,
    tanggal date not null default current_date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS untuk kunjungan_lansia
alter table public.kunjungan_lansia enable row level security;


-- =========================================================================
-- TRIGGER UNTUK OTOMATIS MEMBUAT PROFILE SETELAH USER SIGN UP DI AUTH
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nama, username, role, aktif)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', new.email),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'masyarakat'),
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger dijalankan setelah user baru dibuat di tabel auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- 1. Kebijakan untuk Tabel Profiles:
-- Semua pengguna yang terautentikasi dapat membaca profile
create policy "Allow read profiles to authenticated users" 
on public.profiles for select to authenticated using (true);

-- Pengguna hanya dapat memperbarui profil mereka sendiri
create policy "Allow update profile for self" 
on public.profiles for update to authenticated using (auth.uid() = id);

-- Admin Desa & Super Admin dapat membuat atau mengubah profil siapapun
create policy "Allow admin/superadmin to manage profiles" 
on public.profiles for all to authenticated 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role in ('admin_desa', 'super_admin')
    )
);

-- 2. Kebijakan untuk Tabel Posyandu:
-- Semua pengguna terautentikasi dapat membaca data Posyandu
create policy "Allow read posyandu to authenticated users" 
on public.posyandu for select to authenticated using (true);

-- Hanya Admin Desa & Super Admin yang bisa mengelola data Posyandu
create policy "Allow admin/superadmin to manage posyandu" 
on public.posyandu for all to authenticated 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role in ('admin_desa', 'super_admin')
    )
);

-- 3. Kebijakan untuk Tabel Peserta:
-- Semua pengguna terautentikasi dapat membaca data peserta
create policy "Allow read peserta to authenticated users" 
on public.peserta for select to authenticated using (true);

-- Hanya Admin Desa, Bidan, dan Kader yang dapat mengelola data peserta
create policy "Allow health workers to manage peserta" 
on public.peserta for all to authenticated 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role in ('kader', 'bidan', 'admin_desa', 'super_admin')
    )
);

-- 4. Kebijakan untuk Tabel Sesi Posyandu:
-- Semua pengguna terautentikasi dapat membaca sesi
create policy "Allow read sesi to authenticated users" 
on public.sesi_posyandu for select to authenticated using (true);

-- Hanya Admin, Bidan, dan Kader yang dapat mengelola sesi posyandu
create policy "Allow health workers to manage sesi" 
on public.sesi_posyandu for all to authenticated 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role in ('kader', 'bidan', 'admin_desa', 'super_admin')
    )
);

-- 5. Kebijakan untuk Tabel Kunjungan Balita:
-- Semua pengguna terautentikasi dapat membaca kunjungan
create policy "Allow read kunjungan_balita to authenticated users" 
on public.kunjungan_balita for select to authenticated using (true);

-- Hanya Admin, Bidan, dan Kader yang dapat mengelola data kunjungan balita
create policy "Allow health workers to manage kunjungan_balita" 
on public.kunjungan_balita for all to authenticated 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role in ('kader', 'bidan', 'admin_desa', 'super_admin')
    )
);

-- 6. Kebijakan untuk Tabel Imunisasi:
-- Semua pengguna terautentikasi dapat membaca imunisasi
create policy "Allow read imunisasi to authenticated users" 
on public.imunisasi for select to authenticated using (true);

-- Hanya Bidan, Admin, dan Super Admin yang dapat mengelola imunisasi (Kader hanya melihat/membantu)
create policy "Allow bidan/admin to manage imunisasi" 
on public.imunisasi for all to authenticated 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role in ('bidan', 'admin_desa', 'super_admin')
    )
);

-- 7. Kebijakan untuk Tabel Kunjungan Ibu Hamil:
-- Semua pengguna terautentikasi dapat membaca kunjungan ibu hamil
create policy "Allow read kunjungan_ibu_hamil to authenticated users" 
on public.kunjungan_ibu_hamil for select to authenticated using (true);

-- Hanya Bidan, Admin, dan Super Admin yang dapat mengelola kunjungan ibu hamil
create policy "Allow bidan/admin to manage kunjungan_ibu_hamil" 
on public.kunjungan_ibu_hamil for all to authenticated 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role in ('bidan', 'admin_desa', 'super_admin')
    )
);

-- 8. Kebijakan untuk Tabel Kunjungan Lansia:
-- Semua pengguna terautentikasi dapat membaca kunjungan lansia
create policy "Allow read kunjungan_lansia to authenticated users" 
on public.kunjungan_lansia for select to authenticated using (true);

-- Hanya Bidan, Kader, Admin, dan Super Admin yang dapat mengelola kunjungan lansia
create policy "Allow health workers to manage kunjungan_lansia" 
on public.kunjungan_lansia for all to authenticated 
using (
    exists (
        select 1 from public.profiles 
        where id = auth.uid() and role in ('kader', 'bidan', 'admin_desa', 'super_admin')
    )
);

-- 9. TABEL HASIL DETEKSI STUNTING
create table public.hasil_deteksi_stunting (
    id uuid primary key default gen_random_uuid(),
    balita_id uuid references public.peserta(id) on delete cascade not null,
    tanggal_pemeriksaan date not null default current_date,
    kategori text not null check (kategori in ('Normal', 'Risiko Sedang', 'Risiko Tinggi')),
    skor numeric(5,2) not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.hasil_deteksi_stunting enable row level security;

create policy "Allow authenticated to manage hasil_deteksi_stunting" 
on public.hasil_deteksi_stunting for all to authenticated 
using (true) with check (true);

