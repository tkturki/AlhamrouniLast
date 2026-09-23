import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashPage: React.FC = () => {
  const [phase, setPhase] = useState<'zoom' | 'name' | 'ready'>('zoom');
  const navigate = useNavigate();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('name'), 800);
    const t2 = setTimeout(() => setPhase('ready'), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {Array.from({length:15}).map((_,i) => (
          <div key={i} className="absolute border border-yellow-500/10 rounded-full animate-pulse" style={{
            width: `${(i+1)*60}px`, height: `${(i+1)*60}px`,
            animationDelay: `${i*0.1}s`,
          }} />
        ))}
      </div>

      {/* Logo with 3D rotation */}
      <div className={`transition-all duration-700 ease-out transform ${
        phase === 'zoom' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
      }`} style={{perspective:'800px'}}>
        <div className="animate-logo-spin">
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-2xl shadow-yellow-500/30 border-4 border-yellow-300">
            <img src="/logo1.png" alt="شعار الحمروني" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-contain" />
          </div>
        </div>
      </div>

      {/* Store Name */}
      <div className={`mt-8 text-center transition-all duration-700 ease-out ${
        phase === 'zoom' ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
      }`}>
        <h1 className="text-3xl md:text-5xl font-black text-yellow-400 tracking-wider" style={{textShadow:'0 0 40px rgba(234,179,8,0.4)'}}>
          مجوهرات الحمروني
        </h1>
        <p className="text-gray-400 text-sm md:text-base mt-3 tracking-wide">
          نظام إدارة المبيعات والمخزون
        </p>
      </div>

      {/* Enter Button */}
      <div className={`mt-14 transition-all duration-500 ease-out ${
        phase === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <button
          onClick={() => navigate('/login')}
          className="group relative px-12 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold text-lg rounded-2xl shadow-xl shadow-yellow-500/30 transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/50"
        >
          الدخول للنظام
        </button>
      </div>

      {/* Version */}
      <div className={`absolute bottom-8 text-gray-600 text-xs transition-all duration-500 ${
        phase === 'ready' ? 'opacity-100' : 'opacity-0'
      }`}>
        v1.0.0
      </div>
    </div>
  );
};

export default SplashPage;
