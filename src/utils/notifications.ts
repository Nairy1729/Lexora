/**
 * Lexora - Notification Service & Daily Reminder Scheduler
 *
 * Implements conditional 4-hour local daytime reminders while today's Daily Mode is unfinished.
 *
 * Features:
 * - Daytime window in user local timezone: 9:00 AM, 1:00 PM, 5:00 PM, 9:00 PM. No overnight alerts.
 * - Idempotent scheduling: avoids duplicate alerts when app is reopened.
 * - Auto-cancels remaining alerts immediately upon Daily puzzle completion.
 * - Practice mode strictly excluded: does not cancel or affect daily reminders.
 * - Graceful permission handling: no nagging on denial, fully functional offline.
 * - Pluggable adapter architecture: zero crashes on Web or in Node test environments.
 */

let currentPlatform = 'web';
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  currentPlatform = RN.Platform?.OS || 'web';
} catch {
  currentPlatform = 'node';
}

export const NOTIFICATION_CHANNEL_ID = 'lexora-daily-reminders';
export const NOTIFICATION_TYPE_TAG = 'lexora_daily_reminder';
export const REMINDER_HOURS = [9, 13, 17, 21]; // 4 hours apart: 9 AM, 1 PM, 5 PM, 9 PM

export interface ScheduledNotificationItem {
  identifier: string;
  content: {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  };
}

export interface NotificationScheduleRequest {
  content: {
    title: string;
    body: string;
    color?: string;
    data: Record<string, unknown>;
  };
  trigger: {
    seconds?: number;
    channelId?: string;
    date?: Date | number;
  };
}

export interface NotificationsAdapter {
  getPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | 'undetermined' }>;
  requestPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | 'undetermined' }>;
  setNotificationChannelAsync(channelId: string, channel: Record<string, unknown>): Promise<void>;
  scheduleNotificationAsync(request: NotificationScheduleRequest): Promise<string>;
  getAllScheduledNotificationsAsync(): Promise<ScheduledNotificationItem[]>;
  cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  cancelAllScheduledNotificationsAsync(): Promise<void>;
}

// In-Memory test & web fallback adapter
export class MemoryNotificationsAdapter implements NotificationsAdapter {
  private notifications = new Map<string, ScheduledNotificationItem>();
  private permissionStatus: 'granted' | 'denied' | 'undetermined' = 'granted';
  private counter = 1;

  setPermissionStatus(status: 'granted' | 'denied' | 'undetermined'): void {
    this.permissionStatus = status;
  }

  async getPermissionsAsync() {
    return { status: this.permissionStatus };
  }

  async requestPermissionsAsync() {
    return { status: this.permissionStatus };
  }

  async setNotificationChannelAsync(): Promise<void> {
    // no-op
  }

  async scheduleNotificationAsync(request: NotificationScheduleRequest): Promise<string> {
    const id = `notif_${this.counter++}`;
    this.notifications.set(id, {
      identifier: id,
      content: request.content,
    });
    return id;
  }

  async getAllScheduledNotificationsAsync(): Promise<ScheduledNotificationItem[]> {
    return Array.from(this.notifications.values());
  }

  async cancelScheduledNotificationAsync(identifier: string): Promise<void> {
    this.notifications.delete(identifier);
  }

  async cancelAllScheduledNotificationsAsync(): Promise<void> {
    this.notifications.clear();
  }
}

let nativeNotificationsModule: any = null;
let isNativeSupported = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  if (RN.Platform?.OS === 'android' || RN.Platform?.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeNotificationsModule = require('expo-notifications');
    isNativeSupported = true;

    // Configure foreground presentation
    nativeNotificationsModule.setNotificationHandler?.({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
} catch {
  isNativeSupported = false;
  nativeNotificationsModule = null;
}

const defaultNativeAdapter: NotificationsAdapter = {
  async getPermissionsAsync() {
    if (!isNativeSupported || !nativeNotificationsModule) {
      return { status: 'denied' };
    }
    try {
      const res = await nativeNotificationsModule.getPermissionsAsync();
      return { status: res.status };
    } catch {
      return { status: 'denied' };
    }
  },

  async requestPermissionsAsync() {
    if (!isNativeSupported || !nativeNotificationsModule) {
      return { status: 'denied' };
    }
    try {
      const res = await nativeNotificationsModule.requestPermissionsAsync();
      return { status: res.status };
    } catch {
      return { status: 'denied' };
    }
  },

  async setNotificationChannelAsync(channelId, channel) {
    if (!isNativeSupported || !nativeNotificationsModule) return;
    try {
      if (currentPlatform === 'android') {
        await nativeNotificationsModule.setNotificationChannelAsync(channelId, {
          ...channel,
          importance: nativeNotificationsModule.AndroidImportance?.DEFAULT ?? 3,
        });
      }
    } catch {
      // Ignore
    }
  },

  async scheduleNotificationAsync(request) {
    if (!isNativeSupported || !nativeNotificationsModule) return '';
    try {
      return await nativeNotificationsModule.scheduleNotificationAsync(request);
    } catch {
      return '';
    }
  },

  async getAllScheduledNotificationsAsync() {
    if (!isNativeSupported || !nativeNotificationsModule) return [];
    try {
      return await nativeNotificationsModule.getAllScheduledNotificationsAsync();
    } catch {
      return [];
    }
  },

  async cancelScheduledNotificationAsync(identifier) {
    if (!isNativeSupported || !nativeNotificationsModule) return;
    try {
      await nativeNotificationsModule.cancelScheduledNotificationAsync(identifier);
    } catch {
      // Ignore
    }
  },

  async cancelAllScheduledNotificationsAsync() {
    if (!isNativeSupported || !nativeNotificationsModule) return;
    try {
      await nativeNotificationsModule.cancelAllScheduledNotificationsAsync();
    } catch {
      // Ignore
    }
  },
};

let activeAdapter: NotificationsAdapter = defaultNativeAdapter;

/**
 * Injects a custom notifications adapter (useful for automated testing or web).
 */
export function setNotificationsAdapter(adapter: NotificationsAdapter): void {
  activeAdapter = adapter;
}

export function resetNotificationsAdapter(): void {
  activeAdapter = defaultNativeAdapter;
}

/**
 * Initializes the Android Notification Channel.
 */
export async function setupDailyNotificationChannel(): Promise<void> {
  await activeAdapter.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Daily Reminders',
    description: "Gentle reminders to complete today's daily 5-letter word puzzle.",
    lightColor: '#FF7A00',
    sound: 'default',
  });
}

/**
 * Checks current notification permission without prompting the user.
 */
export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  const result = await activeAdapter.getPermissionsAsync();
  return result.status;
}

/**
 * Requests notification permission from user.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const result = await activeAdapter.requestPermissionsAsync();
  return result.status === 'granted';
}

/**
 * Cancels all scheduled Lexora daily reminder notifications, preserving unrelated notifications.
 */
export async function cancelDailyReminders(): Promise<void> {
  try {
    const scheduled = await activeAdapter.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content?.data?.type === NOTIFICATION_TYPE_TAG) {
        await activeAdapter.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {
    // Fail silently
  }
}

export interface ReconcileRemindersOptions {
  enabled: boolean;
  isDailyCompleted: boolean;
  todayDateKey: string;
  referenceDate?: Date; // For deterministic unit testing
}

/**
 * Reconciles scheduled 4-hour daytime reminders with current game completion state.
 *
 * Rules:
 * - If reminders are disabled or today's puzzle is already completed -> cancels all reminders.
 * - If permission is not granted -> cancels or does not schedule.
 * - Schedules only future daytime slots (9 AM, 1 PM, 5 PM, 9 PM) for today.
 * - Idempotent: avoids duplicating slots already scheduled.
 * - Purges stale alerts from previous calendar days.
 */
export async function reconcileDailyReminders(options: ReconcileRemindersOptions): Promise<number> {
  const { enabled, isDailyCompleted, todayDateKey, referenceDate = new Date() } = options;

  // 1. If disabled or puzzle is already solved/lost: cancel all reminders
  if (!enabled || isDailyCompleted) {
    await cancelDailyReminders();
    return 0;
  }

  // 2. Check permission
  const perm = await activeAdapter.getPermissionsAsync();
  if (perm.status !== 'granted') {
    return 0;
  }

  try {
    await setupDailyNotificationChannel();

    // 3. Inspect currently scheduled notifications
    const scheduled = await activeAdapter.getAllScheduledNotificationsAsync();
    const existingTodaySlots = new Set<number>();

    for (const notif of scheduled) {
      if (notif.content?.data?.type === NOTIFICATION_TYPE_TAG) {
        // If scheduled for a previous calendar day, cancel immediately
        if (notif.content.data.dateKey !== todayDateKey) {
          await activeAdapter.cancelScheduledNotificationAsync(notif.identifier);
        } else {
          const slot = Number(notif.content.data.slotHour);
          if (!isNaN(slot)) {
            existingTodaySlots.add(slot);
          }
        }
      }
    }

    // 4. Schedule remaining future slots for today
    let newlyScheduled = 0;
    const nowMs = referenceDate.getTime();

    for (const hour of REMINDER_HOURS) {
      // If already scheduled for this slot today, skip to avoid duplicate
      if (existingTodaySlots.has(hour)) {
        newlyScheduled++;
        continue;
      }

      const target = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate(),
        hour,
        0,
        0,
        0
      );

      // Only schedule if slot is at least 60 seconds in the future
      if (target.getTime() > nowMs + 60_000) {
        const secondsUntil = Math.max(1, Math.floor((target.getTime() - nowMs) / 1000));

        await activeAdapter.scheduleNotificationAsync({
          content: {
            title: 'Your Lexora puzzle awaits',
            body: "Take a few minutes for today's five-letter challenge.",
            color: '#FF7A00',
            data: {
              type: NOTIFICATION_TYPE_TAG,
              dateKey: todayDateKey,
              slotHour: hour,
            },
          },
          trigger: {
            seconds: secondsUntil,
            channelId: NOTIFICATION_CHANNEL_ID,
          },
        });
        newlyScheduled++;
      }
    }

    return newlyScheduled;
  } catch {
    return 0;
  }
}
