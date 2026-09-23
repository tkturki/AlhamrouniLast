import React, { useState, useEffect } from 'react';
import { Users, UserPlus, DollarSign, AlertTriangle, Calendar, Phone, FileText, Trash2, Edit3, X, Check, Briefcase } from 'lucide-react';
import { formatNumber } from '../services/supabase';
import {
  Employee, Advance, SalaryPayment,
  addEmployee, updateEmployee, deleteEmployee, getAllEmployees,
  addAdvance, markAdvancePaidBack, getAdvancesByEmployee, getUnpaidAdvances,
  addSalaryPayment, getSalariesByEmployee, getSalariesByMonth,
  getExpiringAlerts, getHRStats,
} from '../services/hrStorage';
import { notificationSystem } from '../services/supabase';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const HRPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'advances' | 'salaries' | 'alerts'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [stats, setStats] = useState({ totalEmployees: 0, totalSalaries: 0, totalUnpaidAdvances: 0, expiringAlerts: 0 });
  const [alerts, setAlerts] = useState<{ type: string; employee: Employee; daysLeft: number }[]>([]);

  // Form states
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSalaryStr, setFormSalaryStr] = useState('');
  const [formHireDate, setFormHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPassportNumber, setFormPassportNumber] = useState('');
  const [formPassportExpiry, setFormPassportExpiry] = useState('');
  const [formHealthCertExpiry, setFormHealthCertExpiry] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Advance form
  const [advEmployeeId, setAdvEmployeeId] = useState('');
  const [advAmountStr, setAdvAmountStr] = useState('');
  const [advReason, setAdvReason] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  // Salary form
  const [salEmployeeId, setSalEmployeeId] = useState('');
  const [salAmountStr, setSalAmountStr] = useState('');
  const [salMonth, setSalMonth] = useState(MONTHS[new Date().getMonth()]);
  const [salYear, setSalYear] = useState(new Date().getFullYear());
  const [salPaymentDate, setSalPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  // View state
  const [viewingEmp, setViewingEmp] = useState<Employee | null>(null);
  const [empAdvances, setEmpAdvances] = useState<Advance[]>([]);
  const [empSalaries, setEmpSalaries] = useState<SalaryPayment[]>([]);

  const loadData = () => {
    setEmployees(getAllEmployees());
    setStats(getHRStats());
    setAlerts(getExpiringAlerts());
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setFormName('');
    setFormRole('');
    setFormPhone('');
    setFormSalaryStr('');
    setFormHireDate(new Date().toISOString().split('T')[0]);
    setFormPassportNumber('');
    setFormPassportExpiry('');
    setFormHealthCertExpiry('');
    setFormNotes('');
    setEditingEmp(null);
  };

  const handleSaveEmployee = () => {
    if (!formName.trim() || !formRole.trim()) {
      notificationSystem.error('خطأ', 'يرجى ملء الحقول المطلوبة');
      return;
    }
    const data = {
      name: formName.trim(),
      role: formRole.trim(),
      phone: formPhone.trim(),
      salary: parseFloat(formSalaryStr) || 0,
      hire_date: formHireDate,
      passport_number: formPassportNumber.trim(),
      passport_expiry: formPassportExpiry,
      health_cert_expiry: formHealthCertExpiry,
      notes: formNotes.trim(),
      photo_url: '',
      is_active: true,
    };
    if (editingEmp) {
      updateEmployee(editingEmp.id, data);
      notificationSystem.success('تم التحديث', 'تم تحديث بيانات الموظف');
    } else {
      addEmployee(data);
      notificationSystem.success('تمت الإضافة', 'تم إضافة الموظف بنجاح');
    }
    resetForm();
    setShowAddModal(false);
    loadData();
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmp(emp);
    setFormName(emp.name);
    setFormRole(emp.role);
    setFormPhone(emp.phone);
    setFormSalaryStr(emp.salary.toString());
    setFormHireDate(emp.hire_date);
    setFormPassportNumber(emp.passport_number);
    setFormPassportExpiry(emp.passport_expiry);
    setFormHealthCertExpiry(emp.health_cert_expiry);
    setFormNotes(emp.notes);
    setShowAddModal(true);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('هل تريد حذف هذا الموظف؟')) {
      deleteEmployee(id);
      notificationSystem.warning('تم الحذف', 'تم حذف الموظف');
      loadData();
    }
  };

  const handleViewEmployee = (emp: Employee) => {
    setViewingEmp(emp);
    setEmpAdvances(getAdvancesByEmployee(emp.id));
    setEmpSalaries(getSalariesByEmployee(emp.id));
  };

  const handleSaveAdvance = () => {
    const emp = employees.find(e => e.id === advEmployeeId);
    if (!emp || !advAmountStr) {
      notificationSystem.error('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    addAdvance({
      employee_id: advEmployeeId,
      employee_name: emp.name,
      amount: parseFloat(advAmountStr),
      date: advDate,
      reason: advReason.trim(),
      is_paid_back: false,
      paid_back_date: '',
      notes: '',
    });
    notificationSystem.success('تمت الإضافة', `تم تسجيل عهد بقيمة ${formatNumber(parseFloat(advAmountStr))} د.ل`);
    setShowAdvanceModal(false);
    setAdvAmountStr('');
    setAdvReason('');
    loadData();
  };

  const handleSaveSalary = () => {
    const emp = employees.find(e => e.id === salEmployeeId);
    if (!emp || !salAmountStr) {
      notificationSystem.error('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    addSalaryPayment({
      employee_id: salEmployeeId,
      employee_name: emp.name,
      amount: parseFloat(salAmountStr),
      month: salMonth,
      year: salYear,
      payment_date: salPaymentDate,
      notes: '',
    });
    notificationSystem.success('تم الدفع', `تم تسجيل راتب ${emp.name}`);
    setShowSalaryModal(false);
    setSalAmountStr('');
    loadData();
  };

  const handlePayBackAdvance = (id: string) => {
    if (confirm('هل تم سداد هذا الدين؟')) {
      markAdvancePaidBack(id);
      notificationSystem.success('تم السداد', 'تم تسجيل سداد الدين');
      loadData();
      if (viewingEmp) {
        setEmpAdvances(getAdvancesByEmployee(viewingEmp.id));
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
        <Users className="w-6 h-6" /> إدارة الموظفين والـ HR
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">الموظفون</div>
          <div className="text-2xl font-bold text-white">{stats.totalEmployees}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">إجمالي الرواتب</div>
          <div className="text-2xl font-bold text-green-400">{formatNumber(stats.totalSalaries)} د.ل</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">العهد غير المسددة</div>
          <div className="text-2xl font-bold text-red-400">{formatNumber(stats.totalUnpaidAdvances)} د.ل</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-sm">تنبيهات انتهاء</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.expiringAlerts}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button onClick={() => setActiveTab('employees')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'employees' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          <Users className="w-4 h-4 inline ml-1" /> الموظفون
        </button>
        <button onClick={() => setActiveTab('advances')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'advances' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          <DollarSign className="w-4 h-4 inline ml-1" /> العهد
        </button>
        <button onClick={() => setActiveTab('salaries')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'salaries' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          <Briefcase className="w-4 h-4 inline ml-1" /> الرواتب
        </button>
        <button onClick={() => setActiveTab('alerts')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'alerts' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          <AlertTriangle className="w-4 h-4 inline ml-1" /> التنبيهات
        </button>
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> إضافة موظف
          </button>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-center text-gray-400">الاسم</th>
                  <th className="px-4 py-3 text-center text-gray-400">الوظيفة</th>
                  <th className="px-4 py-3 text-center text-gray-400">الهاتف</th>
                  <th className="px-4 py-3 text-center text-gray-400">الراتب</th>
                  <th className="px-4 py-3 text-center text-gray-400">تاريخ التعيين</th>
                  <th className="px-4 py-3 text-center text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-white font-bold text-center">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-300 text-center">{emp.role}</td>
                    <td className="px-4 py-3 text-gray-300 text-center" dir="ltr">{emp.phone || '-'}</td>
                    <td className="px-4 py-3 text-green-400 text-center">{formatNumber(emp.salary)} د.ل</td>
                    <td className="px-4 py-3 text-gray-300 text-center">{emp.hire_date}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleViewEmployee(emp)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded" title="عرض">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditEmployee(emp)} className="p-1 text-yellow-400 hover:bg-yellow-500/20 rounded" title="تعديل">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">لا يوجد موظفون</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advances Tab */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <button onClick={() => setShowAdvanceModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> تسجيل عهد
          </button>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-center text-gray-400">الموظف</th>
                  <th className="px-4 py-3 text-center text-gray-400">المبلغ</th>
                  <th className="px-4 py-3 text-center text-gray-400">التاريخ</th>
                  <th className="px-4 py-3 text-center text-gray-400">السبب</th>
                  <th className="px-4 py-3 text-center text-gray-400">الحالة</th>
                  <th className="px-4 py-3 text-center text-gray-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {getUnpaidAdvances().map(adv => (
                  <tr key={adv.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-white text-center">{adv.employee_name}</td>
                    <td className="px-4 py-3 text-red-400 font-bold text-center">{formatNumber(adv.amount)} د.ل</td>
                    <td className="px-4 py-3 text-gray-300 text-center">{adv.date}</td>
                    <td className="px-4 py-3 text-gray-300 text-center">{adv.reason || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">غير مسددة</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handlePayBackAdvance(adv.id)} className="p-1 text-green-400 hover:bg-green-500/20 rounded" title="سداد">
                        <Check className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {getUnpaidAdvances().length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">لا توجد عهد غير مسددة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salaries Tab */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          <button onClick={() => setShowSalaryModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> تسجيل راتب
          </button>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-center text-gray-400">الموظف</th>
                  <th className="px-4 py-3 text-center text-gray-400">المبلغ</th>
                  <th className="px-4 py-3 text-center text-gray-400">الشهر</th>
                  <th className="px-4 py-3 text-center text-gray-400">السنة</th>
                  <th className="px-4 py-3 text-center text-gray-400">تاريخ الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {getSalariesByMonth(MONTHS[new Date().getMonth()], new Date().getFullYear()).map(sal => (
                  <tr key={sal.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-white text-center">{sal.employee_name}</td>
                    <td className="px-4 py-3 text-green-400 font-bold text-center">{formatNumber(sal.amount)} د.ل</td>
                    <td className="px-4 py-3 text-gray-300 text-center">{sal.month}</td>
                    <td className="px-4 py-3 text-gray-300 text-center">{sal.year}</td>
                    <td className="px-4 py-3 text-gray-300 text-center">{sal.payment_date}</td>
                  </tr>
                ))}
                {getSalariesByMonth(MONTHS[new Date().getMonth()], new Date().getFullYear()).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">لا توجد مدفوعات هذا الشهر</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length > 0 ? alerts.map((alert, i) => (
            <div key={i} className={`p-4 rounded-lg border ${alert.daysLeft <= 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${alert.daysLeft <= 0 ? 'text-red-400' : 'text-yellow-400'}`} />
                <div>
                  <span className="text-white font-bold">{alert.employee.name}</span>
                  <span className="text-gray-400 mx-2">-</span>
                  <span className={alert.daysLeft <= 0 ? 'text-red-400' : 'text-yellow-400'}>
                    {alert.type} {alert.daysLeft <= 0 ? 'منتهي' : `ينتهي خلال ${alert.daysLeft} يوم`}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-500 py-8">لا توجد تنبيهات حالياً</div>
          )}
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-yellow-400">{editingEmp ? 'تعديل موظف' : 'إضافة موظف'}</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">الاسم *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">الوظيفة *</label>
                <input type="text" value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="مثال: صائغ، فني، محاسب" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">الهاتف</label>
                <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">الراتب الشهري (د.ل)</label>
                <input type="text" inputMode="decimal" value={formSalaryStr} onChange={(e) => setFormSalaryStr(e.target.value)} step="0.01" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">تاريخ التعيين</label>
                <input type="date" value={formHireDate} onChange={(e) => setFormHireDate(e.target.value)} lang="en" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">رقم جواز السفر</label>
                <input type="text" value={formPassportNumber} onChange={(e) => setFormPassportNumber(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">انتهاء جواز السفر</label>
                <input type="date" value={formPassportExpiry} onChange={(e) => setFormPassportExpiry(e.target.value)} lang="en" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">انتهاء الشهادة الصحية</label>
                <input type="date" value={formHealthCertExpiry} onChange={(e) => setFormHealthCertExpiry(e.target.value)} lang="en" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
                <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSaveEmployee} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg">
                {editingEmp ? 'تحديث' : 'حفظ'}
              </button>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-yellow-400">تسجيل عهد</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">الموظف *</label>
                <select value={advEmployeeId} onChange={(e) => setAdvEmployeeId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                  <option value="">اختر موظف</option>
                  {employees.filter(e => e.is_active).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">المبلغ (د.ل) *</label>
                <input type="text" inputMode="decimal" value={advAmountStr} onChange={(e) => setAdvAmountStr(e.target.value)} step="0.01" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">التاريخ</label>
                <input type="date" value={advDate} onChange={(e) => setAdvDate(e.target.value)} lang="en" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">السبب</label>
                <input type="text" value={advReason} onChange={(e) => setAdvReason(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
            </div>
            <button onClick={handleSaveAdvance} className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg">تسجيل</button>
          </div>
        </div>
      )}

      {/* Add Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-yellow-400">تسجيل راتب</h3>
              <button onClick={() => setShowSalaryModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">الموظف *</label>
                <select value={salEmployeeId} onChange={(e) => { setSalEmployeeId(e.target.value); const emp = employees.find(em => em.id === e.target.value); if (emp) setSalAmountStr(emp.salary.toString()); }} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                  <option value="">اختر موظف</option>
                  {employees.filter(e => e.is_active).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">المبلغ (د.ل) *</label>
                <input type="text" inputMode="decimal" value={salAmountStr} onChange={(e) => setSalAmountStr(e.target.value)} step="0.01" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">الشهر</label>
                  <select value={salMonth} onChange={(e) => setSalMonth(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">السنة</label>
                  <input type="text" inputMode="decimal" value={salYear} onChange={(e) => setSalYear(parseInt(e.target.value) || new Date().getFullYear())} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">تاريخ الدفع</label>
                <input type="date" value={salPaymentDate} onChange={(e) => setSalPaymentDate(e.target.value)} lang="en" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
            </div>
            <button onClick={handleSaveSalary} className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg">تسجيل الدفع</button>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {viewingEmp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-yellow-400">بيانات الموظف - {viewingEmp.name}</h3>
              <button onClick={() => setViewingEmp(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">الوظيفة:</span> <span className="text-white">{viewingEmp.role}</span></div>
                <div><span className="text-gray-400">الهاتف:</span> <span className="text-white" dir="ltr">{viewingEmp.phone}</span></div>
                <div><span className="text-gray-400">الراتب:</span> <span className="text-green-400">{formatNumber(viewingEmp.salary)} د.ل</span></div>
                <div><span className="text-gray-400">تاريخ التعيين:</span> <span className="text-white">{viewingEmp.hire_date}</span></div>
                <div><span className="text-gray-400">جواز السفر:</span> <span className="text-white">{viewingEmp.passport_number || '-'}</span></div>
                <div><span className="text-gray-400">انتهاء الجواز:</span> <span className="text-white">{viewingEmp.passport_expiry || '-'}</span></div>
                <div><span className="text-gray-400">الشهادة الصحية:</span> <span className="text-white">{viewingEmp.health_cert_expiry || '-'}</span></div>
              </div>

              <div>
                <h4 className="text-yellow-400 font-bold mb-2">العهد</h4>
                {empAdvances.length > 0 ? empAdvances.map(adv => (
                  <div key={adv.id} className="flex justify-between items-center py-2 border-b border-gray-700">
                    <div>
                      <span className="text-white">{formatNumber(adv.amount)} د.ل</span>
                      <span className="text-gray-400 mx-2">-</span>
                      <span className="text-gray-400">{adv.date}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${adv.is_paid_back ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {adv.is_paid_back ? 'مسدد' : 'غير مسددة'}
                    </span>
                  </div>
                )) : <p className="text-gray-500 text-sm">لا توجد عهد</p>}
              </div>

              <div>
                <h4 className="text-yellow-400 font-bold mb-2">الرواتب</h4>
                {empSalaries.length > 0 ? empSalaries.slice(-5).map(sal => (
                  <div key={sal.id} className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-white">{sal.month} {sal.year}</span>
                    <span className="text-green-400">{formatNumber(sal.amount)} د.ل</span>
                  </div>
                )) : <p className="text-gray-500 text-sm">لا توجد مدفوعات</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPage;
