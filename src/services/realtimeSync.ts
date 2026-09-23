// Real-time Sync Service - Supabase Realtime + localStorage cache
// All data lives on Supabase server, localStorage is only offline cache
import { supabase, isSupabaseAvailable, JewelryItem, SaleInvoice } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type SyncEvent = 'items_updated' | 'invoices_updated' | 'settings_updated' | 'users_updated' | 'gallery_updated';
type SyncCallback = (payload?: any) => void;

class RealtimeSyncService {
  private channel: RealtimeChannel | null = null;
  private listeners: Map<SyncEvent, Set<SyncCallback>> = new Map();
  private isConnected = false;

  // Subscribe to a sync event
  on(event: SyncEvent, callback: SyncCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Emit event to all listeners
  private emit(event: SyncEvent, payload?: any) {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(payload); } catch (e) { console.error('Sync callback error:', e); }
    });
  }

  // Start listening to Supabase Realtime
  start() {
    if (!isSupabaseAvailable() || !supabase) {
      console.log('⚠️ Supabase not available - realtime sync disabled');
      return;
    }

    if (this.channel) {
      this.stop();
    }

    console.log('🔄 Starting realtime sync...');

    this.channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jewelry_items' },
        (payload) => {
          console.log('📦 Items changed:', payload.eventType);
          this.fetchAndCacheItems();
          this.emit('items_updated', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sale_invoices' },
        (payload) => {
          console.log('🧾 Invoices changed:', payload.eventType);
          this.fetchAndCacheInvoices();
          this.emit('invoices_updated', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload) => {
          console.log('⚙️ Settings changed:', payload.eventType);
          this.fetchAndCacheSettings();
          this.emit('settings_updated', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('👥 Users changed:', payload.eventType);
          this.fetchAndCacheUsers();
          this.emit('users_updated', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery_images' },
        (payload) => {
          console.log('🖼️ Gallery changed:', payload.eventType);
          this.emit('gallery_updated', payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          console.log('✅ Realtime sync connected');
          // Initial fetch of all data
          this.fetchAll();
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          console.log('❌ Realtime sync error - using localStorage fallback');
        }
      });
  }

  // Stop realtime subscription
  stop() {
    if (this.channel) {
      supabase?.removeChannel(this.channel);
      this.channel = null;
      this.isConnected = false;
      console.log('🔌 Realtime sync stopped');
    }
  }

  // Check if connected
  isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  // Initial fetch of all data from Supabase to localStorage cache
  async fetchAll() {
    await Promise.all([
      this.fetchAndCacheItems(),
      this.fetchAndCacheInvoices(),
      this.fetchAndCacheSettings(),
      this.fetchAndCacheUsers(),
    ]);
  }

  // Fetch items from Supabase and cache in localStorage
  async fetchAndCacheItems(): Promise<JewelryItem[]> {
    if (!isSupabaseAvailable() || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('jewelry_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        localStorage.setItem('jewelry_items', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.log('Could not fetch items from Supabase:', e);
    }
    // Return cached data
    const cached = localStorage.getItem('jewelry_items');
    return cached ? JSON.parse(cached) : [];
  }

  // Fetch invoices from Supabase and cache in localStorage
  async fetchAndCacheInvoices(): Promise<SaleInvoice[]> {
    if (!isSupabaseAvailable() || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('sale_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        localStorage.setItem('saved_invoices', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.log('Could not fetch invoices from Supabase:', e);
    }
    const cached = localStorage.getItem('saved_invoices');
    return cached ? JSON.parse(cached) : [];
  }

  // Fetch settings from Supabase and cache in localStorage
  async fetchAndCacheSettings(): Promise<any> {
    if (!isSupabaseAvailable() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'system_settings')
        .single();

      if (error) throw error;
      if (data?.value) {
        const settings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        localStorage.setItem('system_settings', JSON.stringify(settings));
        return settings;
      }
    } catch (e) {
      console.log('Could not fetch settings from Supabase:', e);
    }
    return null;
  }

  // Fetch users from Supabase and cache in localStorage
  async fetchAndCacheUsers(): Promise<any[]> {
    if (!isSupabaseAvailable() || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        // Map snake_case to camelCase
        const mapped = data.map((u: any) => ({
          id: u.id,
          email: u.email,
          password: u.password || '',
          name: u.name,
          role: u.role,
          seller_code: u.seller_code || '',
          isActive: u.is_active,
          permissions: u.permissions || {},
          created_at: u.created_at,
          last_login: u.last_login,
        }));
        localStorage.setItem('users', JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.log('Could not fetch users from Supabase:', e);
    }
    const cached = localStorage.getItem('users');
    return cached ? JSON.parse(cached) : [];
  }
}

// Singleton instance
export const realtimeSync = new RealtimeSyncService();
