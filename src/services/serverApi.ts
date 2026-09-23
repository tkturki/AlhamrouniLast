// Local Server API Client
// Everything runs on port 3001 (server serves both API + frontend)
// Data is saved on the server's hard disk

const SERVER_URL = '';  // Relative URLs - same origin as server

let wsConnection: WebSocket | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
const wsListeners: Map<string, Set<(data: any) => void>> = new Map();

// ============================================
// HTTP API Client
// ============================================
async function apiGet(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`);
    return await response.json();
  } catch (e) {
    console.error(`API GET error (${endpoint}):`, e);
    return { success: false, error: e.message };
  }
}

async function apiPost(endpoint: string, data: any): Promise<any> {
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (e) {
    console.error(`API POST error (${endpoint}):`, e);
    return { success: false, error: e.message };
  }
}

async function apiPut(endpoint: string, data: any): Promise<any> {
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (e) {
    console.error(`API PUT error (${endpoint}):`, e);
    return { success: false, error: e.message };
  }
}

async function apiDelete(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (e) {
    console.error(`API DELETE error (${endpoint}):`, e);
    return { success: false, error: e.message };
  }
}

// ============================================
// WebSocket - Real-time Updates
// ============================================
export function connectWebSocket() {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) return;

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}`;
  
  try {
    wsConnection = new WebSocket(wsUrl);

    wsConnection.onopen = () => {
      console.log('🔗 Connected to server (real-time sync active)');
    };

    wsConnection.onmessage = (event) => {
      try {
        const { event: eventType, data } = JSON.parse(event.data);
        const listeners = wsListeners.get(eventType);
        if (listeners) {
          listeners.forEach(cb => cb(data));
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    wsConnection.onclose = () => {
      console.log('🔌 Disconnected from server - reconnecting in 3s...');
      wsReconnectTimer = setTimeout(connectWebSocket, 3000);
    };

    wsConnection.onerror = () => {
      wsConnection?.close();
    };
  } catch (e) {
    console.error('WebSocket connection error:', e);
    wsReconnectTimer = setTimeout(connectWebSocket, 3000);
  }
}

export function onServerEvent(event: string, callback: (data: any) => void): () => void {
  if (!wsListeners.has(event)) {
    wsListeners.set(event, new Set());
  }
  wsListeners.get(event)!.add(callback);
  return () => {
    wsListeners.get(event)?.delete(callback);
  };
}

// ============================================
// Items API
// ============================================
export const serverItemsApi = {
  getAll: async () => {
    const result = await apiGet('/api/items');
    return result.success ? result.data : [];
  },

  getByCode: async (code: string) => {
    const result = await apiGet(`/api/items/${code}`);
    return result.success ? result.data : null;
  },

  search: async (query: string) => {
    const result = await apiGet(`/api/items/search/${encodeURIComponent(query)}`);
    return result.success ? result.data : [];
  },

  add: async (item: any) => {
    const result = await apiPost('/api/items', item);
    return result;
  },

  update: async (code: string, item: any) => {
    const result = await apiPut(`/api/items/${code}`, item);
    return result;
  },

  delete: async (code: string) => {
    const result = await apiDelete(`/api/items/${code}`);
    return result;
  },
};

// ============================================
// Invoices API
// ============================================
export const serverInvoicesApi = {
  getAll: async () => {
    const result = await apiGet('/api/invoices');
    return result.success ? result.data : [];
  },

  add: async (invoice: any) => {
    const result = await apiPost('/api/invoices', invoice);
    return result;
  },

  update: async (number: string, invoice: any) => {
    const result = await apiPut(`/api/invoices/${number}`, invoice);
    return result;
  },
};

// ============================================
// Users API
// ============================================
export const serverUsersApi = {
  getAll: async () => {
    const result = await apiGet('/api/users');
    return result.success ? result.data : [];
  },

  add: async (user: any) => {
    const result = await apiPost('/api/users', user);
    return result;
  },

  update: async (id: string, user: any) => {
    const result = await apiPut(`/api/users/${id}`, user);
    return result;
  },

  delete: async (id: string) => {
    const result = await apiDelete(`/api/users/${id}`);
    return result;
  },
};

// ============================================
// Settings API
// ============================================
export const serverSettingsApi = {
  get: async () => {
    const result = await apiGet('/api/settings');
    return result.success ? result.data : null;
  },

  save: async (settings: any) => {
    const result = await apiPut('/api/settings', settings);
    return result;
  },
};

// ============================================
// Advances API (العهد)
// ============================================
export const serverAdvancesApi = {
  getAll: async () => {
    const result = await apiGet('/api/advances');
    return result.success ? result.data : [];
  },

  add: async (advance: any) => {
    const result = await apiPost('/api/advances', advance);
    return result;
  },

  update: async (id: string, advance: any) => {
    const result = await apiPut(`/api/advances/${id}`, advance);
    return result;
  },

  settle: async (employeeName: string, amount: number, note: string) => {
    const result = await apiPost('/api/advances/settle', {
      employee_name: employeeName,
      settled_amount: amount,
      settlement_note: note,
    });
    return result;
  },

  delete: async (id: string) => {
    const result = await apiDelete(`/api/advances/${id}`);
    return result;
  },
};

// ============================================
// Inventory Counts API (الجرد)
// ============================================
export const serverInventoryApi = {
  getAll: async () => {
    const result = await apiGet('/api/inventory-counts');
    return result.success ? result.data : [];
  },

  add: async (count: any) => {
    const result = await apiPost('/api/inventory-counts', count);
    return result;
  },

  update: async (id: string, count: any) => {
    const result = await apiPut(`/api/inventory-counts/${id}`, count);
    return result;
  },
};

// ============================================
// Manufacturing API (التصنيع)
// ============================================
export const serverManufacturingApi = {
  getAll: async () => {
    const result = await apiGet('/api/manufacturing');
    return result.success ? result.data : [];
  },

  add: async (item: any) => {
    const result = await apiPost('/api/manufacturing', item);
    return result;
  },

  update: async (id: string, item: any) => {
    const result = await apiPut(`/api/manufacturing/${id}`, item);
    return result;
  },

  delete: async (id: string) => {
    const result = await apiDelete(`/api/manufacturing/${id}`);
    return result;
  },
};

// ============================================
// Server Status
// ============================================
export const serverStatus = {
  check: async () => {
    const result = await apiGet('/api/status');
    return result.success ? result : null;
  },
};
