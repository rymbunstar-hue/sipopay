import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Calendar, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { getPosyanduIdByName } from '../../lib/seedPosyandu';

export default function FormPeserta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const defaultCategory = searchParams.get('kategori') || 'Balita';
  const redirectPath = searchParams.get('redirect') || '/kader';

  const [formData, setFormData] = useState({
    nik: '',
    no_kk: '',
    nama_lengkap: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    nama_ibu: '',
    nama_ayah: '',
    alamat_lengkap: '',
    rt: '',
    rw: '',
    kategori: defaultCategory,
    posyandu: 'Posyandu Bojong'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const categoryMapping: Record<string, string> = {
        'Balita': 'balita',
        'Ibu Hamil': 'ibu_hamil',
        'Lansia': 'lansia'
      };
      
      const posId = await getPosyanduIdByName(formData.posyandu);
      if (!posId) throw new Error("Posyandu tidak ditemukan di database. Pastikan data posyandu sudah diisi di Supabase.");

      const payload = {
        nik: formData.nik || null,
        nomor_kk: formData.no_kk,
        nama: formData.nama_lengkap,
        jenis_kelamin: formData.jenis_kelamin,
        tanggal_lahir: formData.tanggal_lahir,
        kategori: categoryMapping[formData.kategori] || 'balita',
        alamat: formData.alamat_lengkap,
        rt: formData.rt || '000',
        rw: formData.rw || '000',
        nama_ibu: formData.nama_ibu || null,
        nama_ayah: formData.nama_ayah || null,
        posyandu_id: posId
      };

      // Basic insert into Supabase
      const { error } = await supabase.from('peserta').insert([payload]);

      if (error) throw error;
      
      // Success, redirect back
      setSuccess(true);
      setTimeout(() => navigate(redirectPath), 1500);
    } catch (error: any) {
      console.error('Error saving data:', error);
      alert(`Gagal menyimpan data: ${error?.message || 'Error tidak diketahui'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {success && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-green-700/30 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-sm">Peserta berhasil ditambahkan! Mengalihkan halaman...</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pendaftaran Peserta Baru</h1>
          <p className="text-gray-500 mt-1">Digitalisasi form pendaftaran dari buku panduan KMS / KIA.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Section: Informasi Utama */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gov-green" />
              Informasi Pribadi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nomor Induk Kependudukan (NIK)</label>
                <input 
                  type="text" 
                  name="nik"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="16 Digit NIK"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nomor Kartu Keluarga (KK)</label>
                <input 
                  type="text" 
                  name="no_kk"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={16}
                  value={formData.no_kk}
                  onChange={(e) => setFormData({ ...formData, no_kk: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="16 Digit No. KK (Opsional)"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nama Lengkap Sesuai Akte / KTP</label>
                <input 
                  type="text" 
                  name="nama_lengkap"
                  required
                  value={formData.nama_lengkap}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="Cth: Anindita Larasati"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Jenis Kelamin</label>
                <select 
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Kategori Peserta</label>
                <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm">
                  {formData.kategori === 'Balita' ? '👶 Balita (0-5 Tahun)' : formData.kategori === 'Ibu Hamil' ? '🤰 Ibu Hamil' : '🧓 Lansia'}
                </div>
                <input type="hidden" name="kategori" value={formData.kategori} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Posyandu Tujuan</label>
                <select 
                  name="posyandu"
                  value={formData.posyandu}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                >
                  <option value="Posyandu Bojong">Posyandu Bojong</option>
                  <option value="Posyandu Leuwiceri">Posyandu Leuwiceri</option>
                  <option value="Posyandu Panonjer">Posyandu Panonjer</option>
                  <option value="Posyandu Bebedahan">Posyandu Bebedahan</option>
                  <option value="Posyandu Cideeng">Posyandu Cideeng</option>
                  <option value="Posyandu Citundun">Posyandu Citundun</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Kelahiran */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gov-green" />
              Data Kelahiran
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tempat Lahir</label>
                <input 
                  type="text" 
                  name="tempat_lahir"
                  required
                  value={formData.tempat_lahir}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="Cth: Tasikmalaya"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Lahir</label>
                <input 
                  type="date" 
                  name="tanggal_lahir"
                  required
                  value={formData.tanggal_lahir}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Section: Keluarga & Kontak */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gov-green" />
              Informasi Keluarga
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nama Ibu Kandung</label>
                <input 
                  type="text" 
                  name="nama_ibu"
                  required={formData.kategori === 'Balita'}
                  value={formData.nama_ibu}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="Cth: Siti Aminah"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nama Ayah (Opsional)</label>
                <input 
                  type="text" 
                  name="nama_ayah"
                  value={formData.nama_ayah}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="Cth: Budi Santoso"
                />
              </div>
            </div>
          </section>

          {/* Section: Alamat */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gov-green" />
              Alamat Domisili
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2 md:col-span-4">
                <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
                <textarea 
                  name="alamat_lengkap"
                  rows={2}
                  required
                  value={formData.alamat_lengkap}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors resize-none"
                  placeholder="Cth: Kp. Cikadu RT 01 RW 02, Desa Sukasenang"
                ></textarea>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">RT</label>
                <input 
                  type="text" 
                  name="rt"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  value={formData.rt}
                  onChange={(e) => setFormData({ ...formData, rt: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="001"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">RW</label>
                <input 
                  type="text" 
                  name="rw"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  value={formData.rw}
                  onChange={(e) => setFormData({ ...formData, rw: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-colors"
                  placeholder="002"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => navigate(redirectPath)}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors text-sm"
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-white bg-gov-green rounded-xl hover:bg-gov-green-dark font-medium transition-colors text-sm shadow-md shadow-gov-green/20 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Data
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
