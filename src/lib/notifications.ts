import { supabase } from './supabase';
import type { Notification as AppNotification } from '../types';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../types';

// VAPID public key - in production this would come from env
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Convert URL-safe base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current notification permission
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

// Register service worker and subscribe to push
export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('Service Worker registered:', registration.scope);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription && VAPID_PUBLIC_KEY) {
      // Subscribe to push
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      
      console.log('Push subscription created:', subscription.endpoint);
      
      // Save subscription to database
      await savePushSubscription(userId, subscription);
    }
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

// Save push subscription to database
async function savePushSubscription(userId: string, subscription: PushSubscription): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      push_subscription: JSON.stringify(subscription),
      push_enabled: true,
    }, {
      onConflict: 'user_id',
    });
    
  if (error) {
    console.error('Error saving push subscription:', error);
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push');
      }
    }
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
  }
}

// Show local notification (fallback when push isn't available)
export function showLocalNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): void {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: options?.tag || 'checkin-notification',
      ...options,
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Create notification in database
export async function createNotification(notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      is_read: false,
    });
    
  if (error) {
    console.error('Error creating notification:', error);
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
    
  if (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
    
  if (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Get unread notification count
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
    
  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
  
  return count || 0;
}

// Get user settings
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error || !data) {
    return { ...DEFAULT_USER_SETTINGS, user_id: userId };
  }
  
  return data as UserSettings;
}

// Update user settings
export async function updateUserSettings(settings: Partial<UserSettings> & { user_id: string }): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(settings, {
      onConflict: 'user_id',
    });
    
  if (error) {
    console.error('Error updating user settings:', error);
  }
}

// Check if a venue is trending (many check-ins in short time)
export async function checkTrendingSpot(venueId: string, _venueName: string, timeWindowMinutes: number = 10): Promise<{ isTrending: boolean; count: number }> {
  const timeAgo = new Date();
  timeAgo.setMinutes(timeAgo.getMinutes() - timeWindowMinutes);
  
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .is('parent_message_id', null)
    .gte('created_at', timeAgo.toISOString());
    
  if (error) {
    console.error('Error checking trending spot:', error);
    return { isTrending: false, count: 0 };
  }
  
  // Consider "trending" if 5+ check-ins in time window
  const isTrending = (count || 0) >= 5;
  
  return { isTrending, count: count || 0 };
}

// Get trending spots
export async function getTrendingSpots(timeWindowMinutes: number = 30, limit: number = 10): Promise<Array<{
  venue_id: string;
  venue_name: string;
  venue_category: string;
  count: number;
}>> {
  const timeAgo = new Date();
  timeAgo.setMinutes(timeAgo.getMinutes() - timeWindowMinutes);
  
  // Get recent check-ins grouped by venue
  const { data, error } = await supabase
    .from('messages')
    .select('venue_id, venue_name, venue_category')
    .is('parent_message_id', null)
    .eq('is_deleted', false)
    .gte('created_at', timeAgo.toISOString());
    
  if (error || !data) {
    console.error('Error getting trending spots:', error);
    return [];
  }
  
  // Count by venue
  const venueCount = new Map<string, { venue_name: string; venue_category: string; count: number }>();
  
  data.forEach((msg) => {
    const existing = venueCount.get(msg.venue_id);
    if (existing) {
      existing.count++;
    } else {
      venueCount.set(msg.venue_id, {
        venue_name: msg.venue_name,
        venue_category: msg.venue_category || 'other',
        count: 1,
      });
    }
  });
  
  // Convert to array and sort by count
  const trending = Array.from(venueCount.entries())
    .map(([venue_id, data]) => ({ venue_id, ...data }))
    .filter((v) => v.count >= 3) // At least 3 check-ins
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
    
  return trending;
}

