const EMPLOYEES_KEY = 'jewelry_employees';
const ADVANCES_KEY = 'jewelry_advances';
const SALARIES_KEY = 'jewelry_salaries';

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  hire_date: string;
  passport_number: string;
  passport_expiry: string;
  health_cert_expiry: string;
  notes: string;
  photo_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Advance {
  id: string;
  employee_id: string;
  employee_name: string;
  amount: number;
  date: string;
  reason: string;
  is_paid_back: boolean;
  paid_back_date: string;
  notes: string;
  created_at: string;
}

export interface SalaryPayment {
  id: string;
  employee_id: string;
  employee_name: string;
  amount: number;
  month: string;
  year: number;
  payment_date: string;
  notes: string;
  created_at: string;
}

const getEmployees = (): Employee[] => {
  try {
    const data = localStorage.getItem(EMPLOYEES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveEmployees = (employees: Employee[]): void => {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
};

const getAdvances = (): Advance[] => {
  try {
    const data = localStorage.getItem(ADVANCES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveAdvances = (advances: Advance[]): void => {
  localStorage.setItem(ADVANCES_KEY, JSON.stringify(advances));
};

const getSalaries = (): SalaryPayment[] => {
  try {
    const data = localStorage.getItem(SALARIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveSalaries = (salaries: SalaryPayment[]): void => {
  localStorage.setItem(SALARIES_KEY, JSON.stringify(salaries));
};

// Employee CRUD
export const addEmployee = (emp: Omit<Employee, 'id' | 'created_at'>): Employee => {
  const employees = getEmployees();
  const newEmp: Employee = {
    ...emp,
    id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  employees.push(newEmp);
  saveEmployees(employees);
  return newEmp;
};

export const updateEmployee = (id: string, updates: Partial<Employee>): Employee | null => {
  const employees = getEmployees();
  const index = employees.findIndex(e => e.id === id);
  if (index === -1) return null;
  employees[index] = { ...employees[index], ...updates };
  saveEmployees(employees);
  return employees[index];
};

export const deleteEmployee = (id: string): boolean => {
  const employees = getEmployees().filter(e => e.id !== id);
  saveEmployees(employees);
  return true;
};

export const getAllEmployees = (): Employee[] => getEmployees();

export const getActiveEmployees = (): Employee[] => getEmployees().filter(e => e.is_active);

// Advance CRUD
export const addAdvance = (advance: Omit<Advance, 'id' | 'created_at'>): Advance => {
  const advances = getAdvances();
  const newAdvance: Advance = {
    ...advance,
    id: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  advances.push(newAdvance);
  saveAdvances(advances);
  return newAdvance;
};

export const markAdvancePaidBack = (id: string): boolean => {
  const advances = getAdvances();
  const index = advances.findIndex(a => a.id === id);
  if (index === -1) return false;
  advances[index].is_paid_back = true;
  advances[index].paid_back_date = new Date().toISOString();
  saveAdvances(advances);
  return true;
};

export const getAdvancesByEmployee = (employeeId: string): Advance[] => {
  return getAdvances().filter(a => a.employee_id === employeeId);
};

export const getUnpaidAdvances = (): Advance[] => {
  return getAdvances().filter(a => !a.is_paid_back);
};

// Salary CRUD
export const addSalaryPayment = (payment: Omit<SalaryPayment, 'id' | 'created_at'>): SalaryPayment => {
  const salaries = getSalaries();
  const newPayment: SalaryPayment = {
    ...payment,
    id: `sal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  salaries.push(newPayment);
  saveSalaries(salaries);
  return newPayment;
};

export const getSalariesByEmployee = (employeeId: string): SalaryPayment[] => {
  return getSalaries().filter(s => s.employee_id === employeeId);
};

export const getSalariesByMonth = (month: string, year: number): SalaryPayment[] => {
  return getSalaries().filter(s => s.month === month && s.year === year);
};

// Alerts
export const getExpiringAlerts = (): { type: string; employee: Employee; daysLeft: number }[] => {
  const alerts: { type: string; employee: Employee; daysLeft: number }[] = [];
  const employees = getActiveEmployees();
  const now = new Date();

  employees.forEach(emp => {
    if (emp.passport_expiry) {
      const expiry = new Date(emp.passport_expiry);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 90 && daysLeft > 0) {
        alerts.push({ type: 'جواز سفر', employee: emp, daysLeft });
      } else if (daysLeft <= 0) {
        alerts.push({ type: 'جواز سفر منتهي', employee: emp, daysLeft });
      }
    }
    if (emp.health_cert_expiry) {
      const expiry = new Date(emp.health_cert_expiry);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 90 && daysLeft > 0) {
        alerts.push({ type: 'شهادة صحية', employee: emp, daysLeft });
      } else if (daysLeft <= 0) {
        alerts.push({ type: 'شهادة صحية منتهية', employee: emp, daysLeft });
      }
    }
  });

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
};

// Stats
export const getHRStats = () => {
  const employees = getActiveEmployees();
  const advances = getUnpaidAdvances();
  const totalSalaries = employees.reduce((sum, e) => sum + e.salary, 0);
  const totalUnpaidAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

  return {
    totalEmployees: employees.length,
    totalSalaries,
    totalUnpaidAdvances,
    expiringAlerts: getExpiringAlerts().length,
  };
};
