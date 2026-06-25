const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// USB Dongle Protection - Generate device fingerprint
const crypto = require('crypto');

function getDeviceFingerprint() {
  const macAddress = getMacAddress();
  const cpuInfo = getCpuInfo();
  const diskSerial = getDiskSerial();

  const fingerprint = crypto
    .createHash('sha256')
    .update(macAddress + cpuInfo + diskSerial + 'ALHUMRONI-JEWELRY-2024')
    .digest('hex');

  return fingerprint;
}

function getMacAddress() {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
          addresses.push(iface.mac);
        }
      }
    }

    return addresses.sort().join(',') || 'NO-NETWORK';
  } catch {
    return 'UNKNOWN';
  }
}

function getCpuInfo() {
  try {
    const os = require('os');
    return os.cpus()[0].model + os.cpus().length;
  } catch {
    return 'UNKNOWN';
  }
}

function getDiskSerial() {
  try {
    // This is a simplified version - real implementation would need platform-specific code
    return process.env.COMPUTERNAME || 'NO-SERIAL';
  } catch {
    return 'NO-SERIAL';
  }
}

// License management
let licensedDevice = null;
const LICENSE_FILE = path.join(app.getPath('userData'), '.license');

function saveLicense(fingerprint) {
  try {
    fs.writeFileSync(LICENSE_FILE, fingerprint, 'utf8');
    licensedDevice = fingerprint;
  } catch (e) {
    console.error('Failed to save license:', e);
  }
}

function loadLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      licensedDevice = fs.readFileSync(LICENSE_FILE, 'utf8').trim();
      return licensedDevice;
    }
  } catch (e) {
    console.error('Failed to load license:', e);
  }
  return null;
}

function validateLicense() {
  const currentDevice = getDeviceFingerprint();
  const storedLicense = loadLicense();

  // First time running - save this device as licensed
  if (!storedLicense) {
    saveLicense(currentDevice);
    return { valid: true, firstRun: true };
  }

  // Check if current device matches licensed device
  if (currentDevice === storedLicense) {
    return { valid: true, firstRun: false };
  }

  return { valid: false, firstRun: false };
}

// Main window
let mainWindow = null;

function createWindow() {
  const licenseCheck = validateLicense();

  if (!licenseCheck.valid) {
    dialog.showErrorBox(
      'خطأ في الترخيص',
      'هذا البرنامج مرخص لجهاز واحد فقط.\n' +
      'لا يمكن تشغيله على هذا الجهاز.\n\n' +
      'يرجى التواصل مع المطور.'
    );
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'مجوهرات الحمروني - نظام إدارة المجوهرات',
    icon: path.join(__dirname, 'dist', 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: false,
  });

  // Load the app
  if (process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Create menu
  createMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Show license info on first run
  if (licenseCheck.firstRun) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'ترخيص البرنامج',
      message: 'تم تفعيل البرنامج بنجاح!\n' +
              'هذا البرنامج مرخص لجهازك فقط.\n' +
              'لا يمكن نقله أو تشغيله على أجهزة أخرى.',
      buttons: ['حسناً']
    });
  }
}

function createMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'طباعة',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: 'خروج',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'تعديل',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'عن البرنامج',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'عن البرنامج',
              message: 'مجوهرات الحمروني\n' +
                      'نظام إدارة المجوهرات\n' +
                      'الإصدار: 1.0.0\n' +
                      '© 2024 جميع الحقوق محفوظة',
              buttons: ['حسناً']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App events
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC for license check
ipcMain.handle('check-license', async () => {
  return validateLicense();
});

ipcMain.handle('get-device-id', async () => {
  return getDeviceFingerprint();
});