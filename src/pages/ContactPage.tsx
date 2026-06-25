import React, { useState } from 'react';
import { Send, MessageCircle, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';
import { jewelryApi } from '../services/supabase';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSending(true);
    try {
      // Save to localStorage for contact messages
      const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
      messages.unshift({
        ...formData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem('contact_messages', JSON.stringify(messages.slice(0, 100)));

      setSent(true);
      setFormData({ name: '', phone: '', message: '' });
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('حدث خطأ أثناء الإرسال');
    }
    setSending(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 p-6 rounded-2xl mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <MessageCircle className="w-8 h-8" />
          نموذج التواصل
        </h1>
        <p className="text-gray-800 mt-2">نحن هنا لمساعدتك - تواصل معنا في أي وقت</p>
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
          <Phone className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-white font-bold text-lg">+218 91 213 3218</p>
          <p className="text-gray-400 text-sm">واتساب</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
          <MapPin className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-white font-bold">ليبيا - طرابلس</p>
          <p className="text-gray-400 text-sm">الموقع</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-yellow-600/20">
          <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-white font-bold">9 صباحاً - 10 مساءً</p>
          <p className="text-gray-400 text-sm">ساعات العمل</p>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-yellow-600/20">
        {sent && (
          <div className="mb-6 bg-green-600/20 border border-green-600/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-400 font-bold">تم إرسال رسالتك بنجاح!</p>
              <p className="text-green-300 text-sm">سنتواصل معك قريباً بإذن الله</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-yellow-400 font-medium mb-2">الاسم الكامل *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسمك الكامل..."
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-yellow-400 font-medium mb-2">رقم الواتساب</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="09X XXX XXXX"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-yellow-400 font-medium mb-2">الرسالة *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="اكتب رسالتك هنا... استفسار، طلب، اقتراح..."
              rows={5}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-y"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <span className="animate-spin">...</span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                إرسال الرسالة
              </>
            )}
          </button>
        </form>
      </div>

      {/* WhatsApp Quick Contact */}
      <div className="mt-6 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-center">
        <p className="text-white text-lg font-bold mb-3">تواصل معنا مباشرة عبر واتساب</p>
        <a
          href="https://wa.me/218912133218"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-green-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-all"
        >
          <Phone className="w-5 h-5" />
          افتح واتساب
        </a>
      </div>
    </div>
  );
};

export default ContactPage;
