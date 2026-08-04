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
  CalendarDays
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuthStore();

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
  ];

  const filteredNavItems = navItems.filter(item => !role || item.roles.includes(role));

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
              <p className="text-xs text-gov-green-light opacity-80">Desa Sukasenang X Desa Setiawangi</p>
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
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium truncate w-40">{user?.email}</p>
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
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-gov-green' : 'text-white/70'}`} />
                {item.name}
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
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green sm:text-sm transition-all"
                placeholder="Cari peserta posyandu..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 relative">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gov-green relative focus:outline-none transition-colors rounded-lg hover:bg-gray-100"
              >
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                <Bell className="h-6 w-6" />
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                      <span className="font-semibold text-sm text-gray-900">Notifikasi Baru</span>
                      <span className="text-xs font-semibold text-gov-green bg-gov-green/10 px-2 py-0.5 rounded-full">3 Baru</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      <div className="p-4 hover:bg-gray-50/70 transition-colors cursor-pointer">
                        <p className="text-xs text-gov-green font-semibold mb-1">Jadwal Operasional</p>
                        <p className="text-sm text-gray-700 font-medium">Jadwal Posyandu Sukasenang direncanakan besok pagi pukul 08.00 WIB.</p>
                        <p className="text-[10px] text-gray-400 mt-2">1 jam yang lalu</p>
                      </div>
                      <div className="p-4 hover:bg-gray-50/70 transition-colors cursor-pointer">
                        <p className="text-xs text-orange-600 font-semibold mb-1">Peringatan Imunisasi</p>
                        <p className="text-sm text-gray-700 font-medium">Imunisasi DPT-HB-Hib 1 untuk balita Anindita Larasati belum tercatat.</p>
                        <p className="text-[10px] text-gray-400 mt-2">3 jam yang lalu</p>
                      </div>
                      <div className="p-4 hover:bg-gray-50/70 transition-colors cursor-pointer">
                        <p className="text-xs text-red-600 font-semibold mb-1">Status KEK Bumil</p>
                        <p className="text-sm text-gray-700 font-medium">2 ibu hamil di wilayah Kp. Cikadu terdeteksi memiliki status KEK.</p>
                        <p className="text-[10px] text-gray-400 mt-2">1 hari yang lalu</p>
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

            <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                  {user?.user_metadata?.nama || user?.email?.split('@')[0] || 'Kader'}
                </p>
                <p className="text-xs text-gov-green font-medium capitalize">
                  {role ? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Kader'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gov-green-light border border-gov-green/20 flex items-center justify-center font-bold text-gov-green uppercase">
                {user?.user_metadata?.nama?.charAt(0) || user?.email?.charAt(0) || 'K'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gov-light p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
