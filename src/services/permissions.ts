export type UserRole = 'admin' | 'accountant' | 'seller' | 'data_entry';

export interface UserPermissions {
  role: UserRole;
  canSell: boolean;
  canEditItems: boolean;
  canDeleteItems: boolean;
  canViewFinancials: boolean;
  canEditFinancials: boolean;
  canArchive: boolean;
  canReturns: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canEditPrices: boolean;
  canPrint: boolean;
  canSearch: boolean;
  canEnterData: boolean;
}

const ROLE_STORAGE_KEY = 'user_role';

const defaultPermissions: Record<UserRole, UserPermissions> = {
  admin: {
    role: 'admin',
    canSell: true,
    canEditItems: true,
    canDeleteItems: true,
    canViewFinancials: true,
    canEditFinancials: true,
    canArchive: true,
    canReturns: true,
    canManageUsers: true,
    canViewReports: true,
    canEditPrices: true,
    canPrint: true,
    canSearch: true,
    canEnterData: true,
  },
  accountant: {
    role: 'accountant',
    canSell: false,
    canEditItems: false,
    canDeleteItems: false,
    canViewFinancials: true,
    canEditFinancials: true,
    canArchive: true,
    canReturns: true,
    canManageUsers: false,
    canViewReports: true,
    canEditPrices: false,
    canPrint: true,
    canSearch: true,
    canEnterData: false,
  },
  seller: {
    role: 'seller',
    canSell: true,
    canEditItems: false,
    canDeleteItems: false,
    canViewFinancials: false,
    canEditFinancials: false,
    canArchive: false,
    canReturns: true,
    canManageUsers: false,
    canViewReports: false,
    canEditPrices: false,
    canPrint: true,
    canSearch: true,
    canEnterData: false,
  },
  data_entry: {
    role: 'data_entry',
    canSell: false,
    canEditItems: true,
    canDeleteItems: true,
    canViewFinancials: false,
    canEditFinancials: false,
    canArchive: false,
    canReturns: false,
    canManageUsers: false,
    canViewReports: false,
    canEditPrices: false,
    canPrint: true,
    canSearch: true,
    canEnterData: true,
  },
};

export const roleLabels: Record<UserRole, string> = {
  admin: 'مدير النظام',
  accountant: 'محاسب',
  seller: 'بائع',
  data_entry: 'مدخل بيانات',
};

export const getCurrentRole = (): UserRole => {
  const data = localStorage.getItem(ROLE_STORAGE_KEY);
  return (data as UserRole) || 'admin';
};

export const setCurrentRole = (role: UserRole): void => {
  localStorage.setItem(ROLE_STORAGE_KEY, role);
};

export const getPermissions = (): UserPermissions => {
  const role = getCurrentRole();
  return defaultPermissions[role] || defaultPermissions.seller;
};

export const hasPermission = (permission: keyof Omit<UserPermissions, 'role'>): boolean => {
  const perms = getPermissions();
  return perms[permission];
};
