// Device Licensing System - USB Dongle Protection
// This system binds the application to a specific device via USB

const LICENSE_KEY = 'alhumroni_jewelry_license_v1';
const DEVICE_KEY = 'device_authorized';
const CHECK_INTERVAL = 5000; // Check every 5 seconds

interface LicenseInfo {
  deviceId: string;
  authorizedAt: string;
  expiresAt?: string;
  isPermanent: boolean;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  os: string;
  browser: string;
  canUseAsAdmin: boolean;
}

// Generate unique device ID based on available identifiers
export const generateDeviceId = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('AlHumroni Jewelry', 2, 15);
    ctx.fillStyle = 'rgba(200,0,0,0.5)';
    ctx.fillText('License Check', 2, 17);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `AHJ-${Math.abs(hash).toString(36).toUpperCase()}`;
};

// Detect device type
export const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua);
  const isDesktop = !isMobile && !isTablet;

  let os = 'Unknown';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  const browsers = ['chrome', 'firefox', 'safari', 'edge', 'opera'];
  let browser = 'Unknown';
  for (const b of browsers) {
    if (ua.includes(b)) {
      browser = b.charAt(0).toUpperCase() + b.slice(1);
      break;
    }
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    os,
    browser,
    // Mobile phones can be used as admin/read-only
    canUseAsAdmin: isMobile || isTablet,
  };
};

// Check if current device is authorized
export const isDeviceAuthorized = (): boolean => {
  const deviceId = generateDeviceId();
  const storedId = localStorage.getItem(DEVICE_KEY);
  return storedId === deviceId;
};

// Authorize current device
export const authorizeDevice = (isPermanent: boolean = true): boolean => {
  const deviceId = generateDeviceId();
  const licenseInfo: LicenseInfo = {
    deviceId,
    authorizedAt: new Date().toISOString(),
    isPermanent,
  };

  if (!isPermanent) {
    // Set expiration to 30 days from now
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    licenseInfo.expiresAt = expires.toISOString();
  }

  localStorage.setItem(LICENSE_KEY, JSON.stringify(licenseInfo));
  localStorage.setItem(DEVICE_KEY, deviceId);
  return true;
};

// Check license status
export const getLicenseStatus = (): { isValid: boolean; deviceInfo: DeviceInfo; message: string } => {
  const deviceInfo = getDeviceInfo();
  const isAuthorized = isDeviceAuthorized();

  if (!isAuthorized) {
    return {
      isValid: false,
      deviceInfo,
      message: 'هذا الجهاز غير مرخص. يرجى تفعيل الترخيص.',
    };
  }

  const licenseData = localStorage.getItem(LICENSE_KEY);
  if (!licenseData) {
    return {
      isValid: false,
      deviceInfo,
      message: 'لا يوجد ترخيص مسجل.',
    };
  }

  const license: LicenseInfo = JSON.parse(licenseData);

  if (!license.isPermanent && license.expiresAt) {
    const expiresAt = new Date(license.expiresAt);
    if (new Date() > expiresAt) {
      return {
        isValid: false,
        deviceInfo,
        message: 'انتهت صلاحية الترخيص. يرجى التجديد.',
      };
    }
  }

  return {
    isValid: true,
    deviceInfo,
    message: 'الترخيص صالح',
  };
};

// Get user role based on device
export const getUserRoleForDevice = (): 'admin' | 'seller' | 'read_only' => {
  const deviceInfo = getDeviceInfo();
  const isAuthorized = isDeviceAuthorized();

  if (!isAuthorized) {
    return 'read_only'; // Can only view, no modifications
  }

  // Desktop devices can be admin or seller based on login
  if (deviceInfo.isDesktop) {
    return 'admin'; // Will be determined by login credentials
  }

  // Mobile/tablet can view as admin but limited write access
  return 'read_only';
};

// Check if user can perform specific action on current device
export const canPerformAction = (action: 'edit' | 'delete' | 'create_invoice' | 'manage_users'): boolean => {
  const deviceInfo = getDeviceInfo();
  const isAuthorized = isDeviceAuthorized();

  if (!isAuthorized) {
    return false;
  }

  // Desktop users can do everything when authorized
  if (deviceInfo.isDesktop) {
    return true;
  }

  // Mobile/tablet users have limited permissions
  const mobilePermissions: Record<string, boolean> = {
    'edit': false,
    'delete': false,
    'create_invoice': false,
    'manage_users': false,
  };

  return mobilePermissions[action] || false;
};

// Continuous license checker
let licenseCheckInterval: number | null = null;

export const startLicenseChecker = (onInvalid: () => void) => {
  if (licenseCheckInterval) return;

  licenseCheckInterval = window.setInterval(() => {
    const status = getLicenseStatus();
    if (!status.isValid) {
      stopLicenseChecker();
      onInvalid();
    }
  }, CHECK_INTERVAL);
};

export const stopLicenseChecker = () => {
  if (licenseCheckInterval) {
    clearInterval(licenseCheckInterval);
    licenseCheckInterval = null;
  }
};

// Activate license with key (simulated - in real app, this would call a server)
export const activateLicense = (licenseKey: string): boolean => {
  // In a real application, this would validate with a server
  // For now, we'll accept any key that matches our format
  const isValidKey = licenseKey.startsWith('AHJ-') && licenseKey.length >= 20;

  if (isValidKey) {
    return authorizeDevice(true);
  }

  return false;
};

// Export all
export type { LicenseInfo, DeviceInfo };
