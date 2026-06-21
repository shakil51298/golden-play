/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'user' | 'admin' | 'agent';

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  email: string;
  role: Role;
  avatarUrl: string;
  referralCode: string; // The code this user shares with others
  referredByCode?: string; // The code of the referrer who invited this user
  createdAt: string;
  password?: string;
}

export interface Wallet {
  userId: string;
  balance: number; // Current clean cash balance
  bonusBalance: number; // Promo/Bonus cash balance
  totalDeposit: number; // Total cash deposited
  totalWithdraw: number; // Total cash withdrawn
  totalWagered: number; // Simulated total sum of bets
}

export type TransactionType = 'deposit' | 'withdraw' | 'bet_win' | 'bet_loss' | 'commission' | 'bonus';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  paymentMethod?: string;
  paymentDetails?: {
    accountName?: string;
    accountNumber?: string;
    refNo?: string;
    usdtAddress?: string;
  };
  notes?: string;
  agentId?: string; // If this transaction is handled/referred by an agent
  createdAt: string;
}

export type GameCategory = 'sports' | 'slots' | 'live' | 'fishing' | 'cards' | 'popular';

export interface Game {
  id: string;
  title: string;
  category: GameCategory;
  provider: string;
  imageUrl: string;
  isPopular: boolean;
  playsCount: number;
  featured?: boolean;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  subtitle: string;
  promoCode?: string;
  isActive: boolean;
  templateType?: 'left-text-right-image' | 'left-image-right-text' | 'full-image';
  titleLine1?: string;
  titleLine2?: string;
  imageLink?: string;
  bgGradient?: string;
  titleFontSize?: string;
  offerMechanicsOneLine?: string;
  mechanicsFontSize?: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  promoCode: string;
  bonusAmount: number;
  minDepositRequired: number;
  isActive: boolean;
  type: 'welcome' | 'rebate' | 'vip' | 'daily';
}

export interface CommissionReport {
  agentId: string;
  totalReferrals: number;
  activePlayers: number;
  totalReferralDeposits: number;
  commissionEarned: number;
  paidCommission: number;
}

export interface PortalNotification {
  id: string;
  userId: string; // 'all' or specific userId
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface PortalAnnouncement {
  id: string;
  tabTitle: string;
  mainTitle: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  rewardLines?: { label: string; value: string }[];
  isActive: boolean;
  order: number;
  badge?: string; // Optional overlay badge e.g. "HOT", "NEW"
}

