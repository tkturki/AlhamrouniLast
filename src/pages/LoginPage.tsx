import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/supabase';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authApi.login(email, password);
      // توجيه حسب نوع المستخدم
      if (user.role === 'admin') {
        navigate('/');
      } else {
        navigate('/');
      }
      window.location.reload(); // إعادة تحميل الصفحة لتحديث الحالة
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="مجوهرات الحمروني" className="w-24 h-24 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-bold text-yellow-400">مجوهرات الحمروني</h1>
          <p className="text-gray-400 mt-2">نظام إدارة المجوهرات</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-yellow-600/20">
          <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 p-4">
            <h2 className="text-xl font-bold text-gray-900 text-center">تسجيل الدخول</h2>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل البريد الإلكتروني"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="px-6 pb-6">
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <p className="text-yellow-400 text-sm font-bold mb-2">🔑 بيانات الدخول التجريبية:</p>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>مدير:</span>
                  <span className="font-mono">admin@alhumroni.com / admin123</span>
                </div>
                <div className="flex justify-between">
                  <span>بائع:</span>
                  <span className="font-mono">seller@alhumroni.com / seller123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;