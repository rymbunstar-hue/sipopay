import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UnderConstructionProps {
  title: string;
  phase?: string;
  description?: string;
}

export default function UnderConstruction({ title, phase = 'Fase 2: Perluasan', description }: UnderConstructionProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center max-w-2xl mx-auto space-y-6">
      <div className="mx-auto h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200">
        <ShieldAlert className="h-9 w-9 text-amber-600 animate-pulse" />
      </div>

      <div className="space-y-2">
        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
          {phase}
        </span>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Modul {title}</h2>
        <p className="text-sm text-gray-500 font-semibold max-w-md mx-auto leading-relaxed">
          {description || 'Fitur ini dijadwalkan untuk dirilis pada fase pengembangan selanjutnya untuk melengkapi administrasi Posyandu Desa Sukasenang.'}
        </p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4 text-gray-500" />
          Kembali Halaman Sebelumnya
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center px-5 py-2.5 bg-gov-green hover:bg-gov-green-dark text-white rounded-xl text-xs font-bold transition-all w-full sm:w-auto shadow-md shadow-gov-green/10"
        >
          Dashboard Utama
        </button>
      </div>
    </div>
  );
}
