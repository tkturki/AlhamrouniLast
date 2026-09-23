import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve built frontend files
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`📂 Serving frontend from: ${distPath}`);
}

// ============================================
// DATA FILE HELPERS - Save to Hard Disk
// ============================================
function getDataFile(filename) {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveDataFile(filename, data) {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getDataFileObj(filename) {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}', 'utf8');
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveDataFileObj(filename, data) {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================
// API: GOLD ORDERS (receipts and manufacturing invoices)
// ============================================
app.get('/api/gold-orders', (req, res) => {
  try {
    res.json({ success: true, data: getDataFileObj('gold_orders') });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/gold-orders', (req, res) => {
  try {
    const data = req.body || {};
    saveDataFileObj('gold_orders', {
      receipts: Array.isArray(data.receipts) ? data.receipts : [],
      invoices: Array.isArray(data.invoices) ? data.invoices : [],
      regular_invoices: Array.isArray(data.regular_invoices) ? data.regular_invoices : [],
      archived: Array.isArray(data.archived) ? data.archived : [],
      updated_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// WEBSOCKET - Real-time sync between devices
// ============================================
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`✅ Device connected (${clients.size} devices online)`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`❌ Device disconnected (${clients.size} devices online)`);
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

function broadcast(event, data) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// ============================================
// API: JEWELRY ITEMS
// ============================================
app.get('/api/items', (req, res) => {
  try {
    const items = getDataFile('jewelry_items');
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/items/:code', (req, res) => {
  try {
    const items = getDataFile('jewelry_items');
    const item = items.find(i => i.item_code === req.params.code);
    if (item) {
      res.json({ success: true, data: item });
    } else {
      res.status(404).json({ success: false, error: 'Item not found' });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const items = getDataFile('jewelry_items');
    const newItem = {
      ...req.body,
      id: req.body.id || Date.now(),
      created_at: req.body.created_at || new Date().toISOString(),
    };
    items.unshift(newItem);
    saveDataFile('jewelry_items', items);
    broadcast('items_updated', items);
    res.json({ success: true, data: newItem });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/items/:code', (req, res) => {
  try {
    const items = getDataFile('jewelry_items');
    const index = items.findIndex(i => i.item_code === req.params.code);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    items[index] = { ...items[index], ...req.body, updated_at: new Date().toISOString() };
    saveDataFile('jewelry_items', items);
    broadcast('items_updated', items);
    res.json({ success: true, data: items[index] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/items/:code', (req, res) => {
  try {
    let items = getDataFile('jewelry_items');
    items = items.filter(i => i.item_code !== req.params.code);
    saveDataFile('jewelry_items', items);
    broadcast('items_updated', items);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/items/bulk-update', (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'items array required' });
    }
    saveDataFile('jewelry_items', items);
    broadcast('items_updated', items);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/items/search/:query', (req, res) => {
  try {
    const items = getDataFile('jewelry_items');
    const q = req.params.query.toLowerCase();
    const results = items.filter(i =>
      i.item_code?.toLowerCase().includes(q) ||
      i.model_name?.toLowerCase().includes(q) ||
      i.category?.toLowerCase().includes(q) ||
      i.gold_item?.toLowerCase().includes(q)
    );
    res.json({ success: true, data: results });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: INVOICES
// ============================================
app.get('/api/invoices', (req, res) => {
  try {
    const invoices = getDataFile('sale_invoices');
    res.json({ success: true, data: invoices });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/invoices', (req, res) => {
  try {
    const invoices = getDataFile('sale_invoices');
    const newInvoice = {
      ...req.body,
      id: req.body.id || Date.now(),
      created_at: req.body.created_at || new Date().toISOString(),
    };
    invoices.unshift(newInvoice);
    saveDataFile('sale_invoices', invoices);
    broadcast('invoices_updated', invoices);
    res.json({ success: true, data: newInvoice });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/invoices/:number', (req, res) => {
  try {
    const invoices = getDataFile('sale_invoices');
    const index = invoices.findIndex(i => i.invoice_number === req.params.number);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    invoices[index] = { ...invoices[index], ...req.body };
    saveDataFile('sale_invoices', invoices);
    broadcast('invoices_updated', invoices);
    res.json({ success: true, data: invoices[index] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/invoice-versions', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        original: getDataFile('original_invoices'),
        modified: getDataFile('modified_invoices'),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/invoice-versions', (req, res) => {
  try {
    saveDataFile('original_invoices', Array.isArray(req.body?.original) ? req.body.original : []);
    saveDataFile('modified_invoices', Array.isArray(req.body?.modified) ? req.body.modified : []);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: USERS
// ============================================
app.get('/api/users', (req, res) => {
  try {
    const users = getDataFile('users');
    // Strip sensitive fields before sending
    const safeUsers = users.map(({ password, password_hash, ...rest }) => rest);
    res.json({ success: true, data: safeUsers });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const users = getDataFile('users');
    const newUser = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      created_at: req.body.created_at || new Date().toISOString(),
    };
    users.push(newUser);
    saveDataFile('users', users);
    broadcast('users_updated', users);
    res.json({ success: true, data: newUser });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const users = getDataFile('users');
    const index = users.findIndex(u => u.id === req.params.id || u.email === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    users[index] = { ...users[index], ...req.body };
    saveDataFile('users', users);
    broadcast('users_updated', users);
    res.json({ success: true, data: users[index] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    let users = getDataFile('users');
    users = users.filter(u => u.id !== req.params.id && u.email !== req.params.id);
    saveDataFile('users', users);
    broadcast('users_updated', users);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: SETTINGS (Gold Prices, Store Info)
// ============================================
app.get('/api/settings', (req, res) => {
  try {
    const settings = getDataFileObj('system_settings');
    res.json({ success: true, data: settings });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    saveDataFileObj('system_settings', req.body);
    broadcast('settings_updated', req.body);
    res.json({ success: true, data: req.body });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: PERSISTENT BROWSER STORAGE
// ============================================
app.get('/api/local-storage', (req, res) => {
  try {
    res.json({ success: true, data: getDataFileObj('local_storage') });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/local-storage', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, error: 'storage object required' });
    }
    saveDataFileObj('local_storage', req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: ADVANCES (العهد المصروفة)
// ============================================
app.get('/api/advances', (req, res) => {
  try {
    const advances = getDataFile('advances');
    res.json({ success: true, data: advances });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/advances', (req, res) => {
  try {
    const advances = getDataFile('advances');
    const newAdvance = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      created_at: req.body.created_at || new Date().toISOString(),
    };
    advances.unshift(newAdvance);
    saveDataFile('advances', advances);
    broadcast('advances_updated', advances);
    res.json({ success: true, data: newAdvance });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/advances/:id', (req, res) => {
  try {
    const advances = getDataFile('advances');
    const index = advances.findIndex(a => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Advance not found' });
    }
    advances[index] = { ...advances[index], ...req.body };
    saveDataFile('advances', advances);
    broadcast('advances_updated', advances);
    res.json({ success: true, data: advances[index] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/advances/:id', (req, res) => {
  try {
    let advances = getDataFile('advances');
    advances = advances.filter(a => a.id !== req.params.id);
    saveDataFile('advances', advances);
    broadcast('advances_updated', advances);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Settle advances for a specific employee (تسوية العهد)
app.post('/api/advances/settle', (req, res) => {
  try {
    const { employee_name, settled_amount, settlement_note } = req.body;
    const advances = getDataFile('advances');
    
    // Find unsettled advances for this employee
    let remaining = settled_amount;
    const updated = advances.map(a => {
      if (a.employee_name === employee_name && a.status !== 'settled' && remaining > 0) {
        const unsettled = a.amount - (a.settled_amount || 0);
        const toSettle = Math.min(unsettled, remaining);
        remaining -= toSettle;
        return {
          ...a,
          settled_amount: (a.settled_amount || 0) + toSettle,
          status: (a.settled_amount || 0) + toSettle >= a.amount ? 'settled' : 'partial',
          settlement_date: new Date().toISOString(),
          settlement_note: settlement_note || '',
        };
      }
      return a;
    });
    
    saveDataFile('advances', updated);
    broadcast('advances_updated', updated);
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: INVENTORY COUNTS (الجرد)
// ============================================
app.get('/api/inventory-counts', (req, res) => {
  try {
    const counts = getDataFile('inventory_counts');
    res.json({ success: true, data: counts });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/inventory-counts', (req, res) => {
  try {
    const counts = getDataFile('inventory_counts');
    const newCount = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      created_at: req.body.created_at || new Date().toISOString(),
    };
    counts.unshift(newCount);
    saveDataFile('inventory_counts', counts);
    broadcast('inventory_counts_updated', counts);
    res.json({ success: true, data: newCount });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/inventory-counts/:id', (req, res) => {
  try {
    const counts = getDataFile('inventory_counts');
    const index = counts.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Inventory count not found' });
    }
    counts[index] = { ...counts[index], ...req.body };
    saveDataFile('inventory_counts', counts);
    broadcast('inventory_counts_updated', counts);
    res.json({ success: true, data: counts[index] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: ACTIVITY LOGS
// ============================================
app.get('/api/logs', (req, res) => {
  try {
    const logs = getDataFile('activity_logs');
    res.json({ success: true, data: logs.slice(0, parseInt(req.query.limit) || 100) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/logs', (req, res) => {
  try {
    const logs = getDataFile('activity_logs');
    const newLog = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      timestamp: req.body.timestamp || new Date().toISOString(),
    };
    logs.unshift(newLog);
    saveDataFile('activity_logs', logs.slice(0, 500));
    res.json({ success: true, data: newLog });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: CATEGORIES & OTHER DATA
// ============================================
app.get('/api/gold-categories', (req, res) => {
  try {
    const data = getDataFile('goldCategories');
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/gold-categories', (req, res) => {
  try {
    saveDataFile('goldCategories', req.body);
    broadcast('categories_updated', req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/invoice-books', (req, res) => {
  try {
    const data = getDataFile('invoice_books');
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/invoice-books', (req, res) => {
  try {
    saveDataFile('invoice_books', req.body);
    broadcast('invoice_books_updated', req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// SERVER STATUS
// ============================================
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    server: 'Alhamrouni Jewelry Server',
    version: '1.0.0',
    devices_online: clients.size,
    data_dir: DATA_DIR,
    uptime: process.uptime(),
  });
});

// ============================================
// API: IMAGE MANAGEMENT ON HARD DISK
// ============================================
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const TEMP_IMAGES_DIR = path.join(__dirname, '..', 'images', 'temp');

// Ensure image directories exist
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(TEMP_IMAGES_DIR)) fs.mkdirSync(TEMP_IMAGES_DIR, { recursive: true });

// Serve images statically
app.use('/images', express.static(IMAGES_DIR));

// Get configured images folder path
app.get('/api/images/folder-path', (req, res) => {
  try {
    const settings = getDataFileObj('system_settings');
    const folderPath = settings.imagesFolderPath || '';
    res.json({ success: true, data: { path: folderPath } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Save configured images folder path
app.put('/api/images/folder-path', (req, res) => {
  try {
    const { folderPath } = req.body;
    const settings = getDataFileObj('system_settings');
    settings.imagesFolderPath = folderPath;
    saveDataFileObj('system_settings', settings);
    broadcast('settings_updated', settings);
    res.json({ success: true, data: { path: folderPath } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// List all images from the configured folder
app.get('/api/images/gallery', (req, res) => {
  try {
    const settings = getDataFileObj('system_settings');
    const folderPath = settings.imagesFolderPath;

    if (!folderPath || !fs.existsSync(folderPath)) {
      return res.json({ success: true, data: [], message: 'مجلد الصور غير محدد أو غير موجود' });
    }

    const files = fs.readdirSync(folderPath)
      .filter(f => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f))
      .map(f => {
        const filePath = path.join(folderPath, f);
        const stat = fs.statSync(filePath);
        return {
          filename: f,
          url: `/api/images/gallery-file/${encodeURIComponent(f)}`,
          size: stat.size,
          created: stat.birthtime,
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ success: true, data: files });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Serve a single image from the configured folder
app.get('/api/images/gallery-file/:filename', (req, res) => {
  try {
    const settings = getDataFileObj('system_settings');
    const folderPath = settings.imagesFolderPath;

    if (!folderPath || !fs.existsSync(folderPath)) {
      return res.status(404).send('Folder not configured');
    }

    // Security: sanitize filename to prevent path traversal
    const decodedFilename = decodeURIComponent(req.params.filename);
    const safeFilename = path.basename(decodedFilename);
    const filePath = path.join(folderPath, safeFilename);

    // Verify the resolved path is still within the folder
    const resolvedPath = path.resolve(filePath);
    const resolvedFolder = path.resolve(folderPath);
    if (!resolvedPath.startsWith(resolvedFolder + path.sep) && resolvedPath !== resolvedFolder) {
      return res.status(403).send('Access denied');
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Image not found');
    }

    res.sendFile(filePath);
  } catch (e) {
    res.status(500).send('Error');
  }
});

// Serve image directly from gallery folder (no copy needed)
app.post('/api/images/copy-to-temp', (req, res) => {
  try {
    const { filename } = req.body;
    const settings = getDataFileObj('system_settings');
    const folderPath = settings.imagesFolderPath;

    if (!folderPath) {
      return res.status(400).json({ success: false, error: 'مجلد الصور غير محدد' });
    }

    // Security: sanitize filename
    const safeFilename = path.basename(filename);
    const srcPath = path.join(folderPath, safeFilename);

    // Verify path is within folder
    const resolvedPath = path.resolve(srcPath);
    const resolvedFolder = path.resolve(folderPath);
    if (!resolvedPath.startsWith(resolvedFolder + path.sep)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!fs.existsSync(srcPath)) {
      return res.status(404).json({ success: false, error: 'الصورة غير موجودة' });
    }

    const imageUrl = `/api/images/gallery-file/${encodeURIComponent(safeFilename)}`;
    res.json({ success: true, data: { filename: safeFilename, url: imageUrl } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Upload image to temp folder
app.post('/api/images/upload', (req, res) => {
  try {
    const { filename, data } = req.body; // data = base64 string
    if (!filename || !data) {
      return res.status(400).json({ success: false, error: 'Missing filename or data' });
    }

    // Extract base64 data
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate safe filename
    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(TEMP_IMAGES_DIR, safeFilename);

    fs.writeFileSync(filePath, buffer);

    const imageUrl = `/images/temp/${safeFilename}`;
    res.json({ success: true, data: { filename: safeFilename, url: imageUrl } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// List all images in temp folder
app.get('/api/images/temp', (req, res) => {
  try {
    const files = fs.readdirSync(TEMP_IMAGES_DIR)
      .filter(f => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f))
      .map(f => ({
        filename: f,
        url: `/images/temp/${f}`,
        size: fs.statSync(path.join(TEMP_IMAGES_DIR, f)).size,
        created: fs.statSync(path.join(TEMP_IMAGES_DIR, f)).birthtime,
      }))
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    res.json({ success: true, data: files });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Move image from temp to permanent folder (linked to item)
app.post('/api/images/move', (req, res) => {
  try {
    const { filename, itemCode } = req.body;
    const srcPath = path.join(TEMP_IMAGES_DIR, filename);
    
    if (!fs.existsSync(srcPath)) {
      return res.status(404).json({ success: false, error: 'Image not found in temp' });
    }

    const destFilename = itemCode ? `${itemCode}_${filename}` : filename;
    const destPath = path.join(IMAGES_DIR, destFilename);
    
    fs.copyFileSync(srcPath, destPath);
    fs.unlinkSync(srcPath); // Remove from temp

    const imageUrl = `/images/${destFilename}`;
    res.json({ success: true, data: { filename: destFilename, url: imageUrl } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete image
app.delete('/api/images/:folder/:filename', (req, res) => {
  try {
    const baseDir = req.params.folder === 'temp' ? TEMP_IMAGES_DIR : IMAGES_DIR;
    // Security: sanitize filename to prevent path traversal
    const safeFilename = path.basename(decodeURIComponent(req.params.filename));
    const filePath = path.join(baseDir, safeFilename);

    // Verify the resolved path is within the allowed directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(baseDir);
    if (!resolvedPath.startsWith(resolvedBase + path.sep)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Bulk upload multiple images
app.post('/api/images/bulk-upload', (req, res) => {
  try {
    const { images } = req.body; // array of { filename, data }
    const results = [];
    
    for (const img of images) {
      const base64Data = img.data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const safeFilename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${img.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(TEMP_IMAGES_DIR, safeFilename);
      fs.writeFileSync(filePath, buffer);
      results.push({ filename: safeFilename, url: `/images/temp/${safeFilename}` });
    }

    res.json({ success: true, data: results });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// API: MANUFACTURING (التصنيع)
// ============================================
app.get('/api/manufacturing', (req, res) => {
  try {
    const items = getDataFile('manufacturing');
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/manufacturing', (req, res) => {
  try {
    const items = getDataFile('manufacturing');
    const newItem = {
      ...req.body,
      id: req.body.id || `mfg_${Date.now()}`,
      created_at: req.body.created_at || new Date().toISOString(),
    };
    items.unshift(newItem);
    saveDataFile('manufacturing', items);
    broadcast('manufacturing_updated', items);
    res.json({ success: true, data: newItem });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/manufacturing/:id', (req, res) => {
  try {
    const items = getDataFile('manufacturing');
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    items[index] = { ...items[index], ...req.body, updated_at: new Date().toISOString() };
    saveDataFile('manufacturing', items);
    broadcast('manufacturing_updated', items);
    res.json({ success: true, data: items[index] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/manufacturing/:id', (req, res) => {
  try {
    const items = getDataFile('manufacturing');
    const filtered = items.filter(i => i.id !== req.params.id);
    saveDataFile('manufacturing', filtered);
    broadcast('manufacturing_updated', filtered);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// CATCH-ALL: Serve React App
// ============================================

// Catch-all: serve React app for client-side routing
const indexPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexPath)) {
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
}

// ============================================
// COMPETITOR PROXY - Fetch Facebook page data
// ============================================
app.get('/api/competitor/fetch-page', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'URL required' });
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    
    const html = await response.text();
    
    // Extract basic info from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                      html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    
    // Try to extract post count or follower count
    const followerMatch = html.match(/([\d,]+)\s*(?:أعجبني|liker|ollower|متاب)/i);
    
    // Extract recent post texts (simplified)
    const posts = [];
    const postMatches = html.matchAll(/class="[^"]*story[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
    let count = 0;
    for (const match of postMatches) {
      if (count >= 10) break;
      const text = match[1].replace(/<[^>]+>/g, '').trim().slice(0, 300);
      if (text.length > 10) {
        posts.push({ content: text, date: new Date().toISOString() });
        count++;
      }
    }
    
    res.json({
      success: true,
      data: {
        title: titleMatch?.[1] || '',
        description: descMatch?.[1] || '',
        image: imageMatch?.[1] || '',
        followers: followerMatch?.[1] || '',
        postsFound: posts.length,
        posts,
        url: response.url,
        fetchedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🏪 مجوهرات الحمروني - السيرفر المحلي');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✅ السيرفر يعمل على البورت: ${PORT}`);
  console.log(`  📁 ملفات البيانات: ${DATA_DIR}`);
  console.log(`  🌐 الشبكة: http://0.0.0.0:${PORT}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
});
