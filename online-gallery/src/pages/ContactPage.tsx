import React, { useState } from 'react';
import { Send, Phone, MapPin, Clock, CheckCircle, MessageCircle, Gem } from 'lucide-react';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) { alert('يرجى ملء جميع الحقول المطلوبة'); return; }

    const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
    messages.unshift({ ...formData, id: Date.now(), created_at: new Date().toISOString(), read: false });
    localStorage.setItem('contact_messages', JSON.stringify(messages.slice(0, 100)));

    setSent(true);
    setFormData({ name: '', phone: '', message: '' });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 p-6 shadow-2xl">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">تواصل معنا</h1>
              <p className="text-gray-800">نحن هنا لمساعدتك</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
            <Phone className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">+218 91 213 3218</p>
            <p className="text-gray-400 text-sm">هاتف / واتساب</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
            <MapPin className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-bold">ليبيا - طرابلس</p>
            <p className="text-gray-400 text-sm">شارع جرابة</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-bold">9 صباحاً - 10 مساءً</p>
            <p className="text-gray-400 text-sm">ساعات العمل</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-yellow-600/20">
          {sent && (
            <div className="mb-6 bg-green-600/20 border border-green-600/30 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-bold">تم إرسال رسالتك بنجاح!</p>
                <p className="text-green-300 text-sm">سنتواصل معك قريباً</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-yellow-400 font-medium mb-2">الاسم الكامل *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="أدخل اسمك الكامل..."
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500" required />
            </div>
            <div>
              <label className="block text-yellow-400 font-medium mb-2">رقم الواتساب</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="09X XXX XXXX"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <label className="block text-yellow-400 font-medium mb-2">الرسالة *</label>
              <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="اكتب رسالتك هنا..."
                rows={5} className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-y" required />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
              <Send className="w-5 h-5" /> إرسال الرسالة
            </button>
          </form>
        </div>

        {/* WhatsApp */}
        <div className="mt-6 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-center">
          <p className="text-white text-lg font-bold mb-3">تواصل معنا مباشرة عبر واتساب</p>
          <a href="https://wa.me/218912133218" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-green-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-all">
            <Phone className="w-5 h-5" /> افتح واتساب
          </a>
        </div>

        {/* Back to gallery */}
        <div className="mt-6 text-center">
          <a href="/shop" className="text-yellow-400 hover:text-yellow-300 font-medium">← العودة للمعرض</a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gem className="w-8 h-8 text-yellow-500" />
            <span className="text-xl font-bold text-yellow-500">مجوهرات الحمروني</span>
          </div>
          <p className="text-gray-600 text-sm">جميع الحقوق محفوظة © {new Date().getFullYear()} مجوهرات الحمروني</p>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
