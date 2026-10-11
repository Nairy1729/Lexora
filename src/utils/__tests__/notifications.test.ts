import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  reconcileDailyReminders,
  cancelDailyReminders,
  setNotificationsAdapter,
  MemoryNotificationsAdapter,
  NOTIFICATION_TYPE_TAG,
  REMINDER_HOURS,
} from '../notifications';

describe('Daily Reminders Scheduler & Notification Service', () => {
  let mockAdapter: MemoryNotificationsAdapter;

  beforeEach(() => {
    mockAdapter = new MemoryNotificationsAdapter();
    setNotificationsAdapter(mockAdapter);
  });

  it('1. Schedules future daytime slots for unfinished daily puzzle when enabled and permitted', async () => {
    // Reference time: 8:00 AM on 2026-10-10
    const morningDate = new Date(2026, 9, 10, 8, 0, 0, 0);

    const count = await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: morningDate,
    });

    // All 4 daytime slots (9, 13, 17, 21) are in the future
    assert.equal(count, 4);

    const all = await mockAdapter.getAllScheduledNotificationsAsync();
    assert.equal(all.length, 4);

    for (const item of all) {
      assert.equal(item.content.data?.type, NOTIFICATION_TYPE_TAG);
      assert.equal(item.content.data?.dateKey, '2026-10-10');
      assert.ok(REMINDER_HOURS.includes(Number(item.content.data?.slotHour)));
    }
  });

  it('2. Daytime window only schedules remaining slots (e.g. at 2:00 PM, schedules 5 PM and 9 PM only)', async () => {
    // Reference time: 14:00 (2:00 PM) on 2026-10-10
    const afternoonDate = new Date(2026, 9, 10, 14, 0, 0, 0);

    const count = await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: afternoonDate,
    });

    // Only 17:00 (5 PM) and 21:00 (9 PM) remain
    assert.equal(count, 2);

    const all = await mockAdapter.getAllScheduledNotificationsAsync();
    assert.equal(all.length, 2);
    const slots = all.map((a) => Number(a.content.data?.slotHour)).sort();
    assert.deepEqual(slots, [17, 21]);
  });

  it('3. Cancels all scheduled reminders when today puzzle is completed', async () => {
    const morningDate = new Date(2026, 9, 10, 8, 0, 0, 0);

    // Initial schedule
    await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: morningDate,
    });

    assert.equal((await mockAdapter.getAllScheduledNotificationsAsync()).length, 4);

    // Now player solves daily game!
    await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: true,
      todayDateKey: '2026-10-10',
      referenceDate: morningDate,
    });

    const afterSolve = await mockAdapter.getAllScheduledNotificationsAsync();
    assert.equal(afterSolve.length, 0);
  });

  it('4. Cancels all scheduled reminders when user disables reminders in Settings', async () => {
    const morningDate = new Date(2026, 9, 10, 8, 0, 0, 0);

    await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: morningDate,
    });

    assert.equal((await mockAdapter.getAllScheduledNotificationsAsync()).length, 4);

    // User toggles off
    await reconcileDailyReminders({
      enabled: false,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: morningDate,
    });

    const afterDisable = await mockAdapter.getAllScheduledNotificationsAsync();
    assert.equal(afterDisable.length, 0);
  });

  it('5. Does not schedule reminders when notification permission is denied', async () => {
    mockAdapter.setPermissionStatus('denied');
    const morningDate = new Date(2026, 9, 10, 8, 0, 0, 0);

    const count = await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: morningDate,
    });

    assert.equal(count, 0);
    const all = await mockAdapter.getAllScheduledNotificationsAsync();
    assert.equal(all.length, 0);
  });

  it('6. Idempotence: repeated app launches do not create duplicate schedules', async () => {
    const morningDate = new Date(2026, 9, 10, 8, 0, 0, 0);

    await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: morningDate,
    });

    // Re-launch 5 minutes later
    await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: new Date(2026, 9, 10, 8, 5, 0, 0),
    });

    // Still exactly 4 notifications, no duplicates
    const all = await mockAdapter.getAllScheduledNotificationsAsync();
    assert.equal(all.length, 4);
  });

  it('7. Day rollover: automatically purges stale reminders from yesterday', async () => {
    // Schedule on day 1
    const day1 = new Date(2026, 9, 10, 8, 0, 0, 0);
    await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: day1,
    });

    // Day 2 launches at 8 AM
    const day2 = new Date(2026, 9, 11, 8, 0, 0, 0);
    await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-11',
      referenceDate: day2,
    });

    const all = await mockAdapter.getAllScheduledNotificationsAsync();
    assert.equal(all.length, 4);
    for (const item of all) {
      assert.equal(item.content.data?.dateKey, '2026-10-11');
    }
  });

  it('8. Cancel daily reminders does not delete unrelated third-party notifications', async () => {
    // Schedule an unrelated notification
    await mockAdapter.scheduleNotificationAsync({
      content: {
        title: 'System Alert',
        body: 'Unrelated message',
        data: { type: 'system_other' },
      },
      trigger: { seconds: 3600 },
    });

    // Schedule Lexora reminder
    await reconcileDailyReminders({
      enabled: true,
      isDailyCompleted: false,
      todayDateKey: '2026-10-10',
      referenceDate: new Date(2026, 9, 10, 8, 0, 0, 0),
    });

    assert.equal((await mockAdapter.getAllScheduledNotificationsAsync()).length, 5);

    // Cancel Lexora reminders
    await cancelDailyReminders();

    const remaining = await mockAdapter.getAllScheduledNotificationsAsync();
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].content.title, 'System Alert');
  });
});
