import { PlanType, UserQuota } from '../types';

const QUOTA_KEY = 'lenscraft_quota';
const PLAN_KEY = 'lenscraft_plan';
const MAX_FREE_DAILY = 5;

// Helper to get today's date string YYYY-MM-DD
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getStoredPlan = (): PlanType => {
  const stored = localStorage.getItem(PLAN_KEY);
  return (stored as PlanType) || PlanType.FREE;
};

export const setStoredPlan = (plan: PlanType): void => {
  localStorage.setItem(PLAN_KEY, plan);
};

export const checkQuota = (): { allowed: boolean; remaining: number; reset: boolean } => {
  const plan = getStoredPlan();
  if (plan === PlanType.PAID) {
    return { allowed: true, remaining: Infinity, reset: false };
  }

  const today = getTodayString();
  const storedQuota = localStorage.getItem(QUOTA_KEY);
  
  let quota: UserQuota = { count: 0, lastResetDate: today };
  let reset = false;

  if (storedQuota) {
    const parsed = JSON.parse(storedQuota) as UserQuota;
    if (parsed.lastResetDate !== today) {
      // New day, reset quota
      quota = { count: 0, lastResetDate: today };
      reset = true;
      localStorage.setItem(QUOTA_KEY, JSON.stringify(quota));
    } else {
      quota = parsed;
    }
  } else {
    // First time
    localStorage.setItem(QUOTA_KEY, JSON.stringify(quota));
  }

  const allowed = quota.count < MAX_FREE_DAILY;
  const remaining = Math.max(0, MAX_FREE_DAILY - quota.count);

  return { allowed, remaining, reset };
};

export const incrementQuota = (): void => {
  const plan = getStoredPlan();
  if (plan === PlanType.PAID) return;

  const { reset } = checkQuota(); // Ensure date is correct
  
  // Re-read to be safe after potential reset in checkQuota logic
  // (In a real app, checkQuota and increment would be atomic/server-side)
  const storedQuota = localStorage.getItem(QUOTA_KEY);
  let quota: UserQuota = storedQuota ? JSON.parse(storedQuota) : { count: 0, lastResetDate: getTodayString() };
  
  // If we just reset in checkQuota, use that logic, otherwise use stored
  if (quota.lastResetDate !== getTodayString()) {
     quota = { count: 0, lastResetDate: getTodayString() };
  }

  quota.count += 1;
  localStorage.setItem(QUOTA_KEY, JSON.stringify(quota));
};