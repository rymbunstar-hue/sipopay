import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Baby,
  Syringe,
  HeartPulse,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Activity,
  CalendarDays,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, profileName, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['kader', 'bidan', 'admin_desa', 'super_admin'] },
    { name: 'Jadwal Posyandu', path: '/jadwal', icon: CalendarDays, roles: ['kader', 'bidan', 'admin_desa', 'super_admin'] },
    { name: 'Data Kader', path: '/kader', icon: Users, roles: ['kader', 'bidan', 'admin_desa', 'super_admin'] },
    { name: 'Posyandu Balita', path: '/balita', icon: Baby, roles: ['kader', 'bidan', 'admin_desa', 'super_admin'] },
    { name: 'Imunisasi', path: '/imunisasi', icon: Syringe, roles: ['bidan'] },
    { name: 'Ibu Hamil', path: '/bumil', icon: HeartPulse, roles: ['kader', 'bidan', 'admin_desa', 'super_admin'] },
    { name: 'Posyandu Lansia', path: '/lansia', icon: Activity, roles: ['kader', 'bidan', 'admin_desa', 'super_admin'] },
    { name: 'Laporan', path: '/laporan', icon: FileText, roles: ['kader', 'bidan', 'admin_desa', 'super_admin'] },
    { name: 'Pengaturan Profil', path: '/pengaturan', icon: Settings, roles: ['kader', 'bidan', 'admin_desa', 'super_admin'] },
  ];

  const filteredNavItems = navItems.filter(item => !role || item.roles.includes(role));

  const getFormattedDisplayName = () => {
    let name = profileName || user?.user_metadata?.nama;
    if (name && name.trim() && !/^\d+$/.test(name.trim())) {
      return name;
    }
    const rawEmail = user?.email?.split('@')[0] || '';
    if (!rawEmail || /^\d+$/.test(rawEmail.trim())) {
      if (role === 'super_admin' || rawEmail === '11111') return 'Super Admin';
      if (role === 'bidan') return 'Bidan Desa';
      if (role === 'admin_desa') return 'Admin Desa';
      return 'Petugas Kader';
    }
    return rawEmail;
  };

  const displayName = getFormattedDisplayName();

  return (
    <div className="min-h-screen bg-gov-light flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gov-green text-white flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl">
              <HeartPulse className="h-6 w-6 text-gov-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide">SIPOPAY</h2>
              <p className="text-xs text-gov-green-light opacity-80">Desa Sukasenang</p>
            </div>
          </div>
          <button
            className="ml-auto lg:hidden text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info (Mobile only) */}
        <div className="p-6 lg:hidden border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium truncate w-40">{displayName}</p>
              <p className="text-xs text-gov-green-light">{role ? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Pengguna'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
          <p className="px-4 text-xs font-semibold text-gov-green-light/70 uppercase tracking-wider mb-4">
            Menu Utama
          </p>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-white text-gov-green font-semibold shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-white/80 hover:bg-red-500/20 hover:text-red-100 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search (Desktop) */}
            <div className="hidden md:flex relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari peserta posyandu..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 relative">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gov-green relative focus:outline-none transition-colors rounded-lg hover:bg-gray-100"
              >
                <Bell className="h-6 w-6" />
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifikasi Posyandu</h3>
                      <span className="text-xs bg-gov-green/10 text-gov-green px-2 py-0.5 rounded-full font-medium">Terbaru</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      <div className="p-3 hover:bg-gray-50 transition-colors">
                        <p className="text-xs font-semibold text-gray-800">Jadwal Posyandu Balita</p>
                        <p className="text-xs text-gray-500 mt-0.5">Posyandu Bojong akan dilaksanakan besok pukul 08.00 WIB.</p>
                        <p className="text-[10px] text-gray-400 mt-1">10 menit yang lalu</p>
                      </div>
                      <div className="p-3 hover:bg-gray-50 transition-colors">
                        <p className="text-xs font-semibold text-gray-800">Laporan Stunting</p>
                        <p className="text-xs text-gray-500 mt-0.5">1 balita terindikasi stunting membutuhkan perhatian khusus.</p>
                        <p className="text-[10px] text-gray-400 mt-1">1 jam yang lalu</p>
                      </div>
                    </div>
                    <div className="p-2 border-t border-gray-100 text-center">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-gov-green font-semibold hover:text-gov-green-dark transition-colors py-1 w-full"
                      >
                        Tandai semua telah dibaca
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link to="/pengaturan" className="hidden sm:flex items-center gap-3 pl-6 border-l border-gray-200 group hover:opacity-80 transition-opacity cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px] group-hover:text-gov-green transition-colors">
                  {displayName}
                </p>
                <p className="text-xs text-gov-green font-medium capitalize">
                  {role ? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Super Admin'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gov-green-light border border-gov-green/20 flex items-center justify-center font-bold text-gov-green uppercase group-hover:scale-105 transition-transform">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gov-light p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
