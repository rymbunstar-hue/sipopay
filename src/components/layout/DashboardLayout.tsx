import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Link, useLocation } from 'react-router-dom';
import { 
  Heart, Users, Calendar, Activity, 
  BookOpen, FileBarChart, LogOut, 
  Menu, X, User, Home, Award
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/', icon: Home, roles: ['super_admin', 'admin_desa', 'bidan', 'kader', 'masyarakat'] },
    
    // Kader & Bidan & Admin
    { name: 'Sesi Posyandu', path: '/sesi', icon: Calendar, roles: ['super_admin', 'admin_desa', 'kader'] },
    { name: 'Data Peserta', path: '/peserta', icon: Users, roles: ['super_admin', 'admin_desa', 'bidan', 'kader'] },
    
    // Medis (Bidan & Kader)
    { name: 'KMS & Tumbuh Kembang', path: '/gizi', icon: Activity, roles: ['super_admin', 'admin_desa', 'bidan', 'kader'] },
    { name: 'Riwayat Imunisasi', path: '/imunisasi', icon: Award, roles: ['super_admin', 'admin_desa', 'bidan', 'kader'] },
    { name: 'Kesehatan Ibu (ANC)', path: '/ibu-hamil', icon: Heart, roles: ['super_admin', 'admin_desa', 'bidan'] },
    { name: 'Kesehatan Lansia', path: '/lansia', icon: Users, roles: ['super_admin', 'admin_desa', 'bidan', 'kader'] },
    
    // Laporan & Admin
    { name: 'Laporan Bulanan', path: '/laporan', icon: FileBarChart, roles: ['super_admin', 'admin_desa', 'bidan', 'kader'] },
    { name: 'Manajemen Akun', path: '/pengguna', icon: BookOpen, roles: ['super_admin', 'admin_desa'] },
  ];

  // Filter menu items based on user role
  const userRole = profile?.role || 'masyarakat';
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin_desa': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'bidan': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'kader': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Developer';
      case 'admin_desa': return 'Pemerintah Desa';
      case 'bidan': return 'Bidan Desa';
      case 'kader': return 'Kader Posyandu';
      case 'masyarakat': return 'Orang Tua / Wali';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 1. SIDEBAR DESKTOP */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gov-green-dark text-white shadow-xl z-20">
        {/* Brand Logo Header */}
        <div className="flex items-center space-x-3 px-6 py-5 border-b border-gov-green/30 bg-gov-green">
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-wider">SIPOPAY</h1>
            <span className="text-[10px] text-primary-200 font-semibold tracking-wider uppercase">Posyandu Digital</span>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="px-6 py-5 border-b border-gov-green/20">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gov-green rounded-full flex items-center justify-center border-2 border-white/20">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{profile?.nama || 'User SIPOPAY'}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold border rounded-full capitalize ${getRoleBadgeColor(userRole)}`}>
                {getRoleDisplayName(userRole)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gov-green text-white shadow-md shadow-gov-green/10' 
                    : 'text-primary-100 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-primary-200'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar / Logout */}
        <div className="p-4 border-t border-gov-green/20">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center px-4 py-3 text-sm font-semibold text-red-200 hover:text-white hover:bg-red-900/20 rounded-xl transition-all"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-300" />
            Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TOP NAV & SIDEBAR MOBILE */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gov-green-dark text-white flex items-center justify-between px-4 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-extrabold text-md tracking-wider">SIPOPAY</h1>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-1 rounded-lg bg-gov-green focus:outline-none"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Sidebar Drawer Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gov-green-dark text-white shadow-xl">
            {/* Close button inside drawer */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg bg-gov-green focus:outline-none"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Brand Logo Header Mobile */}
            <div className="flex items-center space-x-3 px-6 py-5 border-b border-gov-green/30 bg-gov-green">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-tight tracking-wider">SIPOPAY</h1>
                <span className="text-[10px] text-primary-200 font-semibold tracking-wider uppercase">Desa Sukasenang</span>
              </div>
            </div>

            {/* User Quick Info Mobile */}
            <div className="px-6 py-5 border-b border-gov-green/20">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gov-green rounded-full flex items-center justify-center border-2 border-white/20">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">{profile?.nama || 'User SIPOPAY'}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold border rounded-full capitalize ${getRoleBadgeColor(userRole)}`}>
                    {getRoleDisplayName(userRole)}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Menu Mobile */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                      isActive 
                        ? 'bg-gov-green text-white shadow-md' 
                        : 'text-primary-100 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 text-primary-200" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Mobile */}
            <div className="p-4 border-t border-gov-green/20">
              <button
                onClick={() => { setSidebarOpen(false); signOut(); }}
                className="flex w-full items-center px-4 py-3 text-sm font-semibold text-red-200 hover:text-white hover:bg-red-900/20 rounded-xl transition-all"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-300" />
                Keluar Aplikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col md:pl-64 pt-16 md:pt-0">
        
        {/* Top Header desktop-only */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 z-10">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h2 className="text-sm font-bold text-gray-800">
              Selamat datang di Dashboard SIPOPAY Desa Sukasenang
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-extrabold text-gray-800 leading-tight">{profile?.nama}</p>
              <p className="text-[10px] text-gray-500 font-semibold">{getRoleDisplayName(userRole)}</p>
            </div>
            <div className="h-10 w-10 bg-gov-green-light text-gov-green rounded-full flex items-center justify-center font-bold text-sm border border-gov-green/20 shadow-inner">
              {profile?.nama?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 px-8 border-t border-gray-200 bg-white text-center text-xs text-gray-400 font-semibold">
          <p>© 2026 SIPOPAY — Sistem Informasi Posyandu Terintegrasi Desa Sukasenang</p>
        </footer>
      </div>
    </div>
  );
}
