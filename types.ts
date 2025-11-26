export enum PlanType {
  FREE = 'FREE',
  PAID = 'PAID'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface UserQuota {
  count: number;
  lastResetDate: string; // ISO Date string YYYY-MM-DD
}

export interface CaptionResult {
  caption: string;
  modelUsed: string;
  timestamp: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface HistoryItem extends CaptionResult {
  id: string;
  imageUrl: string; // Base64 or Object URL
}