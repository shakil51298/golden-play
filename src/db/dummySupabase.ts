/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, Wallet, Transaction, Game, Banner, Promotion, PortalNotification, Role, PortalAnnouncement } from '../types';
import { syncService } from './supabaseSync';

// Storage keys
const KEYS = {
  PROFILES: 'playportal_profiles_v1',
  WALLETS: 'playportal_wallets_v1',
  TRANSACTIONS: 'playportal_transactions_v1',
  GAMES: 'playportal_games_v1',
  BANNERS: 'playportal_banners_v1',
  PROMOTIONS: 'playportal_promotions_v1',
  NOTIFICATIONS: 'playportal_notifications_v1',
  FAVORITES: 'playportal_favorites_v1',
  RECENTLY_PLAYED: 'playportal_recent_v1',
  CURRENT_USER_ID: 'playportal_current_user_id_v1',
  ANNOUNCEMENTS: 'playportal_announcements_v1',
  GAME_CONTROL_MODELS: 'playportal_game_control_models_v1',
  GAME_MODEL_MAPPING: 'playportal_game_model_mapping_v1',
  PORTAL_POPUP_ANNOUNCEMENTS: 'playportal_popup_announcements_v1',
};

export interface GameControlModel {
  id: string;
  name: string;
  description: string;
  type: 'rng' | 'winner_cap' | 'force_loss' | 'force_win';
  maxWinnersPerDay: number;
  currentWinnersToday: number;
  lastResetDate: string; // YYYY-MM-DD
}

// Initial setup helper functions
const getInitialPopupAnnouncements = (): PortalAnnouncement[] => [
  {
    id: 'popup-1',
    tabTitle: '📢 m71.COM-এ স্বাগত',
    mainTitle: 'm71.COM-এ আপনাকে স্বাগতম!',
    subtitle: 'এজেন্ট ৪ সুপার কমিটি অফার এবং অতিরিক্ত পুরস্কারের বিবরণ',
    content: 'আমাদের জনপ্রিয় গেমস খেলুন এবং এজেন্ট কভারেজে বন্ধুদের আমন্ত্রণ জানিয়ে প্রতিদিন বিশাল কমিশন এবং নগদ টাকা জিতে নিন।',
    isActive: true,
    order: 1,
    badge: 'HOT',
    rewardLines: [
      { label: 'প্রতিটি আমন্ত্রণ (Invite Bonus)', value: '৳২৯৯ - ৳১৮৮৮ BDT' },
      { label: '৩স্তরের বাজি কমিশন (3-Tier Commission)', value: '০.৪৪% - ০.৬৮%' },
      { label: 'আমানত কমিশন (Deposit Rebate)', value: '০.৯% Flat' },
      { label: 'সর্বোচ্চ আমন্ত্রণ বোনাস (Max Cap)', value: '৳১৬,০০০,০০০ BDT' }
    ]
  },
  {
    id: 'popup-2',
    tabTitle: '🎁 প্রথম ডিপোজিট ক্যাশব্যাক ১০০%',
    mainTitle: '১০০% ডাবল বোনাস ক্যাশব্যাক অফার!',
    subtitle: 'নতুন সদস্যদের জন্য ১০০০ টাকা পর্যন্ত প্রথম ডিপোজিট ডাবল অফার',
    content: 'সহজ বিকাশ (bKash) ও রকেট পেমেন্টের মাধ্যমে প্রথম দিন ডিপোজিট করলেই সমপরিমাণ ১০০% ফ্রি বোনাস ব্যালেন্স নিন। ২০x প্লে-থ্রু করে সরাসরি উত্তোলনযোগ্য।',
    isActive: true,
    order: 2,
    badge: 'NEW',
    rewardLines: [
      { label: 'ন্যূনতম ডিপোজিট (Min Deposit)', value: '৳২০০ BDT' },
      { label: 'সর্বোচ্চ বোনাস (Max Cash Bonus)', value: '৳১,০০০ BDT' },
      { label: 'ভ্যালিডিটি পিরিয়ড (Validity)', value: '৭ দিন' },
      { label: 'রোলওভার রিকোয়ারমেন্ট (Wagering Requirement)', value: '২০x ওয়াগার' }
    ]
  },
  {
    id: 'popup-3',
    tabTitle: '👑 ভিআইপি মেম্বারশিপ সুবিধাদি',
    mainTitle: 'ভিআইপি ডবল বোনাস ও বিশেষ গিফ!',
    subtitle: 'লয়াল প্লেয়ারদের জন্য প্রিমিয়াম ডেক্স এবং আনলিমিটেড বাজি ক্যাশব্যাক',
    content: 'টানা ১ সপ্তাহ গেম খেললেই স্বয়ংক্রিয়ভাবে আপনার অ্যাকাউন্টটি গোল্ডেন ভিআইপি ক্লাবে উন্নীত করা হবে।',
    isActive: true,
    order: 3,
    rewardLines: [
      { label: 'সাপ্তাহিক রিয়েল-টাইম ক্যাশব্যাক', value: '১.৮% আনলিমিটেড' },
      { label: 'জন্মদিন ভিআইপি সারপ্রাইজ উপহার', value: '৳৫,০০০ BDT' },
      { label: 'উত্তোলনের সর্বোচ্চ দৈনিক সীমা', value: '৳৫,০০,০০০ BDT' },
      { label: 'উত্সর্গীকৃত ২৪/৭ হোয়াটসঅ্যাপ ম্যানেজার', value: 'গ্রাহক সেবা ডেস্ক' }
    ]
  }
];

const getInitialAnnouncements = (): string[] => [
  "🔥 ৳100 Welcome Bonus instantly credited to new registrants! Spin and win real BDT payouts now!",
  "⚡ Golden Play Broker System active: Recruit friends and earn 10% cash commission on every deposit!",
  "🎰 Jackpot Pool currently exceeding ৳150,000.00! Triple Crown matches pay mega jackpots!",
  "💳 Safe Deposit channels fully operational over GCash, Bank Transfer & USDT ERC-20 instantly!"
];
const getInitialBanners = (): Banner[] => [
  {
    id: 'b-1',
    title: '150% WELCOME BONUS',
    subtitle: 'Kickstart your gaming journey with 150% additional credits!',
    imageUrl: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #eff6ff 100%)',
    promoCode: 'WELCOME150',
    isActive: true,
  },
  {
    id: 'b-2',
    title: 'DAILY REBATE UNLIMITED 1.2%',
    subtitle: 'Play any slot or live game and get a 1.2% rebate daily.',
    imageUrl: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fef3c7 100%)',
    promoCode: 'REBATE12',
    isActive: true,
  },
  {
    id: 'b-3',
    title: 'VIP REFERRAL AGENT TEAM',
    subtitle: 'Share your link and earn up to 45% lifetime rev-share!',
    imageUrl: 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #dcfce7 100%)',
    promoCode: 'AGENTLIFETIME',
    isActive: true,
  }
];

const getInitialPromotions = (): Promotion[] => [
  {
    id: 'promo-1',
    title: '100% Welcome Slot Offer',
    description: 'Double your slot wallet immediately upon your first deposit. Min deposit: ৳100. Wager limit: 15x.',
    imageUrl: 'bg-gradient-to-r from-blue-900 to-indigo-900 border-l-4 border-yellow-400',
    promoCode: 'WELCOME100',
    bonusAmount: 100,
    minDepositRequired: 100,
    type: 'welcome',
    isActive: true,
  },
  {
    id: 'promo-2',
    title: 'Slot & Live Rebate 1.8%',
    description: 'Play high volume slots and live dealer events to secure an automated 1.8% cash credit directly into your balance daily.',
    imageUrl: 'bg-gradient-to-r from-teal-900 to-emerald-950 border-l-4 border-yellow-400',
    promoCode: 'REBATE18',
    bonusAmount: 0,
    minDepositRequired: 0,
    type: 'rebate',
    isActive: true,
  },
  {
    id: 'promo-3',
    title: 'Agent Comm Upgrade',
    description: 'Refer 5 active users this week and boost your tier to 5% flat deposit commissions!',
    imageUrl: 'bg-gradient-to-r from-amber-950 to-yellow-950 border-l-4 border-yellow-400',
    promoCode: 'AGENTCOMM',
    bonusAmount: 50,
    minDepositRequired: 200,
    type: 'vip',
    isActive: true,
  },
];

const getInitialGames = (): Game[] => [
  // SLOTS
  {
    id: 'g-mines-1',
    title: 'Lucky Mines VIP',
    category: 'slots',
    provider: 'Golden Play In-House',
    imageUrl: '💎 5x5 Grid Mines & Gems game',
    isPopular: true,
    playsCount: 99420,
    featured: true,
  },
  {
    id: 'g-slots-1',
    title: 'Gates of Olympus',
    category: 'slots',
    provider: 'Pragmatic Play',
    imageUrl: '🪐 Golden Zeus lightning rings',
    isPopular: true,
    playsCount: 24502,
    featured: true,
  },
  {
    id: 'g-slots-2',
    title: 'Sweet Bonanza',
    category: 'slots',
    provider: 'Pragmatic Play',
    imageUrl: '🍬 Colorful candy bombs',
    isPopular: true,
    playsCount: 15403,
  },
  {
    id: 'g-slots-3',
    title: 'Mahjong Ways 2',
    category: 'slots',
    provider: 'PG Soft',
    imageUrl: '🀄 Golden Chinese tiles and wild loops',
    isPopular: true,
    playsCount: 184510,
    featured: true,
  },
  {
    id: 'g-slots-4',
    title: 'Super Ace',
    category: 'slots',
    provider: 'JILI Games',
    imageUrl: '🃏 Golden Joker multiplier cards',
    isPopular: false,
    playsCount: 8520,
  },
  // LIVE
  {
    id: 'g-live-1',
    title: 'Lightning Roulette',
    category: 'live',
    provider: 'Evolution Gaming',
    imageUrl: '🎡 Black & gold roulette wheel energy',
    isPopular: true,
    playsCount: 45000,
    featured: true,
  },
  {
    id: 'g-live-2',
    title: 'Crazy Time Live',
    category: 'live',
    provider: 'Evolution Gaming',
    imageUrl: '🍭 High stakes multi-color bonus wheel',
    isPopular: true,
    playsCount: 39510,
    featured: true,
  },
  {
    id: 'g-live-3',
    title: 'Vip Dealer Blackjack',
    category: 'live',
    provider: 'Evolution Gaming',
    imageUrl: '🃏 Elegant dark timber dealer table',
    isPopular: false,
    playsCount: 7410,
  },
  // SPORTS
  {
    id: 'g-sports-1',
    title: 'SABA Sportsbook',
    category: 'sports',
    provider: 'SABA Sports',
    imageUrl: '⚽ Classic Premier League stadium',
    isPopular: true,
    playsCount: 51200,
    featured: true,
  },
  {
    id: 'g-sports-2',
    title: 'CMD368 Sports',
    category: 'sports',
    provider: 'CMD368',
    imageUrl: '🏀 Live NBA odds court screen',
    isPopular: false,
    playsCount: 12400,
  },
  // FISHING
  {
    id: 'g-fish-1',
    title: 'Fishing God',
    category: 'fishing',
    provider: 'SpadeGaming',
    imageUrl: '🦈 Golden shark and sea monsters',
    isPopular: true,
    playsCount: 19600,
  },
  {
    id: 'g-fish-2',
    title: 'Mega Happy Fishing',
    category: 'fishing',
    provider: 'JILI Games',
    imageUrl: '🐙 Deep sea gold chest cannons',
    isPopular: false,
    playsCount: 4900,
  },
  // CARDS
  {
    id: 'g-cards-1',
    title: 'Texas Hold\'em Ultimate',
    category: 'cards',
    provider: 'Evolution Gaming',
    imageUrl: '♠️ High resolution ace and king face cards',
    isPopular: true,
    playsCount: 8820,
  },
  {
    id: 'g-cards-2',
    title: 'Bull Bull Gold',
    category: 'cards',
    provider: 'JILI Games',
    imageUrl: '🐂 Dragon-styled traditional cards',
    isPopular: false,
    playsCount: 2310,
  },
  {
    id: 'g-cards-3',
    title: 'Andar Bahar',
    category: 'cards',
    provider: 'Evolution Gaming',
    imageUrl: '🃏 Traditional Andar Bahar classic card matching',
    isPopular: true,
    playsCount: 54120,
    featured: true,
  },
  {
    id: 'g-cards-4',
    title: '7 Up 7 Down',
    category: 'cards',
    provider: 'King Maker',
    imageUrl: '🎲 7 Up 7 Down rapid dice rolling arcade',
    isPopular: true,
    playsCount: 32900,
    featured: true,
  },
  {
    id: 'g-fish-3',
    title: 'Ocean King',
    category: 'fishing',
    provider: 'SpadeGaming',
    imageUrl: '🔱 Poseidon legend sea king trident battle',
    isPopular: true,
    playsCount: 129030,
    featured: true,
  },
  {
    id: 'g-slots-5',
    title: 'Fortune King',
    category: 'slots',
    provider: 'JILI Games',
    imageUrl: '🏮 Fortune golden coins temple spin and chinese drums',
    isPopular: true,
    playsCount: 88470,
    featured: true,
  },
];

const getInitialUsersAndProfiles = (): { profiles: UserProfile[]; wallets: Wallet[] } => {
  const profiles: UserProfile[] = [
    {
      id: 'usr-admin',
      username: 'admin',
      phone: '+18885551212',
      email: 'sfautomobile.25@gmail.com',
      role: 'admin',
      avatarUrl: '⚡',
      referralCode: 'PORTAL_VIP',
      password: 'admin123',
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'usr-agent1',
      username: 'agent77',
      phone: '+63912345678',
      email: 'agent77@portal.com',
      role: 'agent',
      avatarUrl: '💎',
      referralCode: 'GOLD77',
      referredByCode: 'PORTAL_VIP',
      password: 'agent123',
      createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'usr-player1',
      username: 'player1',
      phone: '+63911122233',
      email: 'player1@portal.com',
      role: 'user',
      avatarUrl: '🦊',
      referralCode: 'PLAYX9',
      referredByCode: 'GOLD77',
      password: 'player123',
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  const wallets: Wallet[] = [
    {
      userId: 'usr-admin',
      balance: 1000000,
      bonusBalance: 0,
      totalDeposit: 0,
      totalWithdraw: 0,
      totalWagered: 0,
    },
    {
      userId: 'usr-agent1',
      balance: 1540, // Cash commission balance
      bonusBalance: 0,
      totalDeposit: 0,
      totalWithdraw: 500,
      totalWagered: 0,
    },
    {
      userId: 'usr-player1',
      balance: 550, // Cash playing balance
      bonusBalance: 150, // Promo active balance
      totalDeposit: 1200,
      totalWithdraw: 800,
      totalWagered: 4500,
    },
  ];

  return { profiles, wallets };
};

const getInitialTransactions = (): Transaction[] => [
  {
    id: 'tx-1',
    userId: 'usr-player1',
    username: 'player1',
    type: 'deposit',
    amount: 1000,
    status: 'approved',
    paymentMethod: 'GCash Manual Pay',
    paymentDetails: { accountName: 'Jose Santos', accountNumber: '0911***2233', refNo: 'RE-992384-MX' },
    notes: 'Auto validated first bonus lock',
    agentId: 'usr-agent1',
    createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-2',
    userId: 'usr-player1',
    username: 'player1',
    type: 'withdraw',
    amount: 800,
    status: 'approved',
    paymentMethod: 'GCash Manual Pay',
    paymentDetails: { accountName: 'Jose Santos', accountNumber: '0911***2233', refNo: 'WD-817263-L' },
    notes: 'Paid by admin manually',
    agentId: 'usr-agent1',
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-3',
    userId: 'usr-player1',
    username: 'player1',
    type: 'deposit',
    amount: 200,
    status: 'approved',
    paymentMethod: 'Bank Transfer Manual',
    paymentDetails: { accountName: 'Jose Santos', accountNumber: '1283**9922', refNo: 'TX-BNK-81721b' },
    agentId: 'usr-agent1',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-4',
    userId: 'usr-player1',
    username: 'player1',
    type: 'deposit',
    amount: 500,
    status: 'pending',
    paymentMethod: 'USDT (TRC20) Pay',
    paymentDetails: { usdtAddress: 'TKh2U8J8...f9pQ', refNo: 'HASH-ff9812736bdfa0' },
    agentId: 'usr-agent1',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'tx-5',
    userId: 'usr-player1',
    username: 'player1',
    type: 'withdraw',
    amount: 150,
    status: 'pending',
    paymentMethod: 'GCash Manual Pay',
    paymentDetails: { accountName: 'Jose Santos', accountNumber: '0911***2233' },
    agentId: 'usr-agent1',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
  },
  // Commission logs for agent
  {
    id: 'tx-comm-1',
    userId: 'usr-agent1',
    username: 'agent77',
    type: 'commission',
    amount: 120, // 10% commission on players deposit
    status: 'approved',
    notes: 'Referred deposit bonus share (player1)',
    createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-comm-2',
    userId: 'usr-agent1',
    username: 'agent77',
    type: 'commission',
    amount: 24, // 12% commission
    status: 'approved',
    notes: 'Referred deposit bonus share (player1)',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  }
];

const getInitialNotifications = (): PortalNotification[] => [
  {
    id: 'notif-1',
    userId: 'all',
    title: '🚀 Platform Upgrade Completed',
    message: 'Welcome to the most premium gaming dashboard under manual payment triggers! Enjoy lightning transactions with instant customer service routing.',
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif-2',
    userId: 'usr-player1',
    title: '⚠️ Wallet Deposit Audited',
    message: 'Your custom GCash deposit of ৳1,000 has been reviewed, approved, and fully matched. Slot machines are unlocked.',
    createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
    isRead: true,
  }
];

const getInitialGameControlModels = (): GameControlModel[] => {
  const todayStr = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'model-rng',
      name: 'Standard Fair (RNG)',
      description: 'Standard mathematical logic runs normal multipliers randomly.',
      type: 'rng',
      maxWinnersPerDay: 99999,
      currentWinnersToday: 0,
      lastResetDate: todayStr,
    },
    {
      id: 'model-cap-200',
      name: 'Daily Winner Cap (Limit: 200)',
      description: 'Only 200 winners total across all players in a single day. All other plays are forced losses to maximize house commission margins.',
      type: 'winner_cap',
      maxWinnersPerDay: 200,
      currentWinnersToday: 0,
      lastResetDate: todayStr,
    },
    {
      id: 'model-cap-5',
      name: 'Daily Winner Cap (Limit: 5 - Sandbox Testing)',
      description: 'Capped to strictly 5 winners per day globally. High capacity for immediate verification of limit triggers.',
      type: 'winner_cap',
      maxWinnersPerDay: 5,
      currentWinnersToday: 0,
      lastResetDate: todayStr,
    },
    {
      id: 'model-house-win',
      name: 'Strict Loss (House Profit Mode)',
      description: 'Rigged payout: 0% RTP. Absolute state force loss for everyone to reclaim lost platform balances.',
      type: 'force_loss',
      maxWinnersPerDay: 0,
      currentWinnersToday: 0,
      lastResetDate: todayStr,
    },
    {
      id: 'model-house-lose',
      name: 'Promo Rain (Strict Win Mode)',
      description: 'Extravagant payout mode for massive initial user retention. Almost guaranteed visual triple wins.',
      type: 'force_win',
      maxWinnersPerDay: 99999,
      currentWinnersToday: 0,
      lastResetDate: todayStr,
    }
  ];
};

// DB Class wrapper
class DummySupabaseClient {
  constructor() {
    this.seedIfNeeded();
  }

  private seedIfNeeded() {
    if (!localStorage.getItem(KEYS.PROFILES)) {
      const { profiles, wallets } = getInitialUsersAndProfiles();
      localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
      localStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets));
      localStorage.setItem(KEYS.GAMES, JSON.stringify(getInitialGames()));
      localStorage.setItem(KEYS.BANNERS, JSON.stringify(getInitialBanners()));
      localStorage.setItem(KEYS.PROMOTIONS, JSON.stringify(getInitialPromotions()));
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(getInitialTransactions()));
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(getInitialNotifications()));
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify([]));
      localStorage.setItem(KEYS.RECENTLY_PLAYED, JSON.stringify([]));
      localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(getInitialAnnouncements()));
      localStorage.setItem(KEYS.PORTAL_POPUP_ANNOUNCEMENTS, JSON.stringify(getInitialPopupAnnouncements()));
      // Default to "player1" for instant sandbox usage
      localStorage.setItem(KEYS.CURRENT_USER_ID, 'usr-player1');
    } else {
      // Migrate admin email if it's still admin@portal.com in existing users
      try {
        const key = KEYS.PROFILES;
        const profilesStr = localStorage.getItem(key);
        if (profilesStr) {
          const profiles = JSON.parse(profilesStr);
          const adminProfile = profiles.find((p: any) => p.username === 'admin');
          if (adminProfile && adminProfile.email === 'admin@portal.com') {
            adminProfile.email = 'sfautomobile.25@gmail.com';
            localStorage.setItem(key, JSON.stringify(profiles));
          }
        }
      } catch (e) {
        console.error('Migration error:', e);
      }
    }

    // Always seed retrograde game control data if missing (so returning browser state doesn't crash)
    if (!localStorage.getItem(KEYS.GAME_CONTROL_MODELS)) {
      localStorage.setItem(KEYS.GAME_CONTROL_MODELS, JSON.stringify(getInitialGameControlModels()));
    }
    if (!localStorage.getItem(KEYS.GAME_MODEL_MAPPING)) {
      const initialGames = getInitialGames();
      const mapping: { [gameId: string]: string } = {};
      initialGames.forEach(g => {
        mapping[g.id] = 'model-rng';
      });
      localStorage.setItem(KEYS.GAME_MODEL_MAPPING, JSON.stringify(mapping));
    }
    if (!localStorage.getItem(KEYS.PORTAL_POPUP_ANNOUNCEMENTS)) {
      localStorage.setItem(KEYS.PORTAL_POPUP_ANNOUNCEMENTS, JSON.stringify(getInitialPopupAnnouncements()));
    }
  }

  // Pure state getters
  getData<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (key === KEYS.GAMES) {
      const initial = getInitialGames();
      // Ensure all initial games by ID exist in the loaded storage
      const missing = initial.filter(ig => !parsed.some((pg: any) => pg.id === ig.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(key, JSON.stringify(merged));
        return merged as unknown as T[];
      }
    }
    if (key === KEYS.BANNERS) {
      let changed = false;
      const normalized = parsed.map((banner: any, index: number) => {
        let nextBanner = banner;
        if (banner && !banner.displayOrder) {
          changed = true;
          nextBanner = {
            ...nextBanner,
            displayOrder: index + 1,
            createdAt: nextBanner.createdAt || new Date(Date.now() + index * 1000).toISOString(),
          };
        }
        if (nextBanner?.templateType === 'full-image') {
          const fullImage = nextBanner.imageLink || nextBanner.imageUrl;
          if (fullImage && (nextBanner.imageLink !== fullImage || nextBanner.imageUrl !== fullImage)) {
            changed = true;
            return {
              ...nextBanner,
              imageUrl: fullImage,
              imageLink: fullImage,
              bgGradient: nextBanner.bgGradient || 'transparent',
            };
          }
        }
        return nextBanner;
      });
      if (changed) {
        localStorage.setItem(key, JSON.stringify(normalized));
        setTimeout(() => {
          syncService.pushToSupabase().catch((e) => {
            console.warn('Background Supabase Auto-Sync failed while normalizing banners:', e);
          });
        }, 300);
      }
      return normalized as unknown as T[];
    }
    return parsed;
  }

  setData<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
    if (
      key === KEYS.PROFILES ||
      key === KEYS.WALLETS ||
      key === KEYS.TRANSACTIONS ||
      key === KEYS.NOTIFICATIONS ||
      key === KEYS.BANNERS ||
      key === KEYS.PROMOTIONS
    ) {
      setTimeout(() => {
        syncService.pushToSupabase().catch((e) => {
          console.warn('Background Supabase Auto-Sync failed, this is safe and expected before SQL migration:', e);
        });
      }, 300);
    }
  }

  // --- AUTH SERVICES ---
  getCurrentUserId(): string | null {
    return localStorage.getItem(KEYS.CURRENT_USER_ID);
  }

  getCurrentUser(): { profile: UserProfile; wallet: Wallet } | null {
    const uid = this.getCurrentUserId();
    if (!uid) return null;
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);
    const wallets = this.getData<Wallet>(KEYS.WALLETS);

    const profile = profiles.find(p => p.id === uid);
    const wallet = wallets.find(w => w.userId === uid);

    if (profile && wallet) {
      return { profile, wallet };
    }
    return null;
  }

  switchUser(userId: string) {
    localStorage.setItem(KEYS.CURRENT_USER_ID, userId);
  }

  login(phoneOrEmail: string, passwordEntered?: string, roleRequested?: Role): { success: boolean; error?: string; profile?: UserProfile } {
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);
    const norm = phoneOrEmail.trim().toLowerCase();

    // Support role shortcuts so the client evaluator can switch roles in one click!
    if (roleRequested) {
      const matched = profiles.find(p => p.role === roleRequested);
      if (matched) {
        localStorage.setItem(KEYS.CURRENT_USER_ID, matched.id);
        return { success: true, profile: matched };
      }
    }

    const found = profiles.find(p => p.email.toLowerCase() === norm || p.phone === norm || p.username.toLowerCase() === norm);
    if (found) {
      const hasStoredPassword = typeof found.password === 'string' && found.password.length > 0;
      const fallbackDemoPassword = found.username === 'admin'
        ? 'admin123'
        : found.username === 'agent77'
          ? 'agent123'
          : found.username === 'player1'
            ? 'player123'
            : undefined;
      const expectedPassword = hasStoredPassword ? found.password : fallbackDemoPassword;

      if (expectedPassword && passwordEntered !== expectedPassword) {
        return { success: false, error: 'Incorrect password for this player account.' };
      }

      localStorage.setItem(KEYS.CURRENT_USER_ID, found.id);
      return { success: true, profile: found };
    }
    return { success: false, error: "Credentials match not found. Try 'player1', 'agent77', or 'admin'" };
  }

  register(data: { username: string; email: string; phone: string; password?: string; referredByCode?: string; role?: Role }): { success: boolean; error?: string; profile?: UserProfile } {
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);
    const wallets = this.getData<Wallet>(KEYS.WALLETS);

    const normUsername = data.username.trim();
    if (profiles.some(p => p.username.toLowerCase() === normUsername.toLowerCase())) {
      return { success: false, error: 'Username already taken' };
    }

    const newId = `usr-${Math.random().toString(36).substr(2, 9)}`;
    const newProfile: UserProfile = {
      id: newId,
      username: normUsername,
      email: data.email || `${normUsername}@gmail.com`,
      phone: data.phone,
      role: 'user', // normal user cannot select role, always registered as 'user'
      password: data.password || 'player123',
      avatarUrl: ['🦊', '🐱', '🐼', '🐯', '🐸', '🐨'][Math.floor(Math.random() * 6)],
      referralCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      referredByCode: data.referredByCode || undefined,
      createdAt: new Date().toISOString(),
    };

    const newWallet: Wallet = {
      userId: newId,
      balance: 100, // Give them ৳100 registration bonus credit to try the games!
      bonusBalance: 15,
      totalDeposit: 0,
      totalWithdraw: 0,
      totalWagered: 0,
    };

    profiles.push(newProfile);
    wallets.push(newWallet);

    this.setData(KEYS.PROFILES, profiles);
    this.setData(KEYS.WALLETS, wallets);

    // Auto send custom notification
    this.addNotification(newId, '🎉 Welcome Bonus Claimed!', 'Your registration bonus of ৳100.00 is active. Play Slots, Live casino & spin wheels to withdraw.');

    // If referred by an agent, trigger standard commission record or alert the agent's user count
    localStorage.setItem(KEYS.CURRENT_USER_ID, newId);

    return { success: true, profile: newProfile };
  }

  logout() {
    localStorage.removeItem(KEYS.CURRENT_USER_ID);
  }

  // --- WALLET SERVICES ---
  addNotification(userId: string, title: string, message: string) {
    const notifs = this.getData<PortalNotification>(KEYS.NOTIFICATIONS);
    notifs.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    this.setData(KEYS.NOTIFICATIONS, notifs);
  }

  submitDepositRequest(userId: string, data: { amount: number; paymentMethod: string; accountName?: string; accountNumber?: string; refNo?: string; usdtAddress?: string }): { success: boolean; transaction: Transaction } {
    const transactions = this.getData<Transaction>(KEYS.TRANSACTIONS);
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);
    const user = profiles.find(p => p.id === userId);

    // Find if user has recruiter agent
    let referralAgentId: string | undefined;
    if (user?.referredByCode) {
      const agentProfile = profiles.find(p => p.referralCode === user.referredByCode && p.role === 'agent');
      if (agentProfile) {
        referralAgentId = agentProfile.id;
      }
    }

    const tx: Transaction = {
      id: `tx-dep-${Date.now()}`,
      userId,
      username: user?.username || 'unknown',
      type: 'deposit',
      amount: Number(data.amount),
      status: 'pending',
      paymentMethod: data.paymentMethod,
      paymentDetails: {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        refNo: data.refNo,
        usdtAddress: data.usdtAddress,
      },
      agentId: referralAgentId,
      createdAt: new Date().toISOString(),
    };

    transactions.unshift(tx);
    this.setData(KEYS.TRANSACTIONS, transactions);

    this.addNotification(userId, '⏳ Deposit Request Received', `Your deposit of ৳${data.amount} via ${data.paymentMethod} has been submitted for manual agent/admin review.`);

    return { success: true, transaction: tx };
  }

  submitWithdrawRequest(userId: string, data: { amount: number; paymentMethod: string; accountName?: string; accountNumber?: string; usdtAddress?: string }): { success: boolean; error?: string; transaction?: Transaction } {
    const wallets = this.getData<Wallet>(KEYS.WALLETS);
    const wallet = wallets.find(w => w.userId === userId);

    if (!wallet || wallet.balance < data.amount) {
      return { success: false, error: 'Insufficient cash balance remaining' };
    }

    const transactions = this.getData<Transaction>(KEYS.TRANSACTIONS);
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);
    const user = profiles.find(p => p.id === userId);

    let referralAgentId: string | undefined;
    if (user?.referredByCode) {
      const recruiter = profiles.find(p => p.referralCode === user.referredByCode && p.role === 'agent');
      if (recruiter) {
        referralAgentId = recruiter.id;
      }
    }

    // Deduct standard balance immediately as pending
    wallet.balance -= data.amount;
    this.setData(KEYS.WALLETS, wallets);

    const tx: Transaction = {
      id: `tx-wd-${Date.now()}`,
      userId,
      username: user?.username || 'unknown',
      type: 'withdraw',
      amount: Number(data.amount),
      status: 'pending',
      paymentMethod: data.paymentMethod,
      paymentDetails: {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        usdtAddress: data.usdtAddress,
      },
      agentId: referralAgentId,
      createdAt: new Date().toISOString(),
    };

    transactions.unshift(tx);
    this.setData(KEYS.TRANSACTIONS, transactions);

    this.addNotification(userId, '⏳ Withdrawal Under Process', `An amount of ৳${data.amount} has been secured. Waiting on bank processing approval.`);

    return { success: true, transaction: tx };
  }

  // --- RE-PLAY GAME BALANCES (Bets & Wins!) ---
  playGameWager(userId: string, betAmount: number, winFactor: number, gameId?: string): { netResult: number; isWin: boolean; newBalance: number } {
    const wallets = this.getData<Wallet>(KEYS.WALLETS);
    const wallet = wallets.find(w => w.userId === userId);

    if (!wallet) return { netResult: 0, isWin: false, newBalance: 0 };

    // Deduct bet from total balance
    const totalResource = wallet.balance + wallet.bonusBalance;
    if (totalResource < betAmount) {
      return { netResult: 0, isWin: false, newBalance: totalResource };
    }

    // Spend logic
    let usedBonus = 0;
    let usedCash = 0;
    if (wallet.bonusBalance >= betAmount) {
      wallet.bonusBalance -= betAmount;
      usedBonus = betAmount;
    } else {
      usedBonus = wallet.bonusBalance;
      wallet.bonusBalance = 0;
      usedCash = betAmount - usedBonus;
      wallet.balance -= usedCash;
    }

    wallet.totalWagered += betAmount;

    // Calculate outcomes
    const payout = Math.round(betAmount * winFactor);
    const isWin = payout > betAmount;
    const netResult = payout - betAmount;

    // Credit profits to active Cash balance
    wallet.balance += payout;

    const transactions = this.getData<Transaction>(KEYS.TRANSACTIONS);
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);
    const user = profiles.find(p => p.id === userId);

    const tx: Transaction = {
      id: `tx-play-${Date.now()}`,
      userId,
      username: user?.username || 'unknown',
      type: payout > 0 ? 'bet_win' : 'bet_loss',
      amount: payout > 0 ? payout : betAmount,
      status: 'approved',
      notes: `Interactive Slot spin outcome: ${isWin ? 'WIN' : 'LOSS'}`,
      createdAt: new Date().toISOString(),
    };

    transactions.unshift(tx);
    this.setData(KEYS.TRANSACTIONS, transactions);
    this.setData(KEYS.WALLETS, wallets);

    // Track active game win count limits if specified
    if (isWin && gameId) {
      this.trackGameWin(gameId);
    }

    return { netResult, isWin, newBalance: wallet.balance };
  }

  // --- ADMIN PORTAL ACTIONS ---
  adminMutateTransaction(txId: string, action: 'approve' | 'reject'): { success: boolean; error?: string } {
    const transactions = this.getData<Transaction>(KEYS.TRANSACTIONS);
    const wallets = this.getData<Wallet>(KEYS.WALLETS);
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);

    const txIdx = transactions.findIndex(t => t.id === txId);
    if (txIdx === -1) return { success: false, error: 'Transaction id not found' };

    const tx = transactions[txIdx];
    if (tx.status !== 'pending') return { success: false, error: 'Transaction was already audited' };

    const userWallet = wallets.find(w => w.userId === tx.userId);
    if (!userWallet) return { success: false, error: 'Target user wallet missing' };

    if (tx.type === 'deposit') {
      if (action === 'approve') {
        tx.status = 'approved';
        userWallet.balance += tx.amount;
        userWallet.totalDeposit += tx.amount;

        // Auto reward 10% welcome bonus to user bonus wallet if the description matches!
        const bonusCredited = Math.round(tx.amount * 0.1);
        userWallet.bonusBalance += bonusCredited;

        this.addNotification(tx.userId, '✅ Deposit Approved + Bonus!', `Your manual deposit request of ৳${tx.amount} has been verified! A 10% cash bonus of ৳${bonusCredited} has also been credited to your bonus balance.`);

        // Agent Rev-Share payout logic: If referred by an Agent, Agent earns a 10% commission instantly!
        if (tx.agentId) {
          const commEarned = Math.round(tx.amount * 0.1);
          const agentWallet = wallets.find(w => w.userId === tx.agentId);
          if (agentWallet) {
            agentWallet.balance += commEarned;
            const agentProfile = profiles.find(p => p.id === tx.agentId);

            // Record transaction for commission
            transactions.unshift({
              id: `tx-comm-${Date.now()}`,
              userId: tx.agentId,
              username: agentProfile?.username || 'agent',
              type: 'commission',
              amount: commEarned,
              status: 'approved',
              notes: `Commission matching player ${tx.username}'s manual deposit of ৳${tx.amount}`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else {
        tx.status = 'rejected';
        this.addNotification(tx.userId, '❌ Deposit Request Denied', `Your manual deposit of ৳${tx.amount} failed review. Please touch customer service.`);
      }
    } else if (tx.type === 'withdraw') {
      if (action === 'approve') {
        tx.status = 'approved';
        userWallet.totalWithdraw += tx.amount;
        this.addNotification(tx.userId, '✅ Withdrawal Complete', `Your bank payout of ৳${tx.amount} has been manually authorized.`);
      } else {
        tx.status = 'rejected';
        // Refund the pending balance
        userWallet.balance += tx.amount;
        this.addNotification(tx.userId, '❌ Withdrawal Audited Out', `Rejected withdrawal of ৳${tx.amount}. Balance has been fully refunded.`);
      }
    }

    this.setData(KEYS.TRANSACTIONS, transactions);
    this.setData(KEYS.WALLETS, wallets);

    return { success: true };
  }

  // Agent system trigger: Add commission manually
  agentRequestWithdrawal(agentId: string, amount: number, paymentDetails: any): { success: boolean; error?: string } {
    const wallets = this.getData<Wallet>(KEYS.WALLETS);
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);
    const agentWallet = wallets.find(w => w.userId === agentId);
    const agentProfile = profiles.find(p => p.id === agentId);

    if (!agentWallet || agentWallet.balance < amount) {
      return { success: false, error: 'Insufficient pending commissions.' };
    }

    agentWallet.balance -= amount;
    agentWallet.totalWithdraw += amount;

    const transactions = this.getData<Transaction>(KEYS.TRANSACTIONS);
    const tx: Transaction = {
      id: `tx-agent-wd-${Date.now()}`,
      userId: agentId,
      username: agentProfile?.username || 'agent',
      type: 'withdraw',
      amount,
      status: 'pending',
      paymentMethod: 'Agent Bank Transfer',
      paymentDetails,
      createdAt: new Date().toISOString(),
    };

    transactions.unshift(tx);
    this.setData(KEYS.WALLETS, wallets);
    this.setData(KEYS.TRANSACTIONS, transactions);

    this.addNotification(agentId, '⏳ Broker Withdrawal Processed', `Broker payout requested for ৳${amount}. Manual pay is compiling.`);

    return { success: true };
  }

  // --- LOBBY STATICS & CONTENT MUTATORS (Admins) ---
  addBanner(banner: Partial<Banner>) {
    const banners = this.getData<Banner>(KEYS.BANNERS);
    banners.push({
      id: `banner-${Date.now()}`,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      promoCode: banner.promoCode || '',
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      templateType: banner.templateType,
      titleLine1: banner.titleLine1,
      titleLine2: banner.titleLine2,
      imageLink: banner.imageLink,
      bgGradient: banner.bgGradient,
      titleFontSize: banner.titleFontSize,
      offerMechanicsOneLine: banner.offerMechanicsOneLine,
      mechanicsFontSize: banner.mechanicsFontSize,
      displayOrder: banner.displayOrder || banners.length + 1,
      createdAt: new Date().toISOString(),
    });
    this.setData(KEYS.BANNERS, banners);
  }

  toggleBanner(id: string) {
    const banners = this.getData<Banner>(KEYS.BANNERS);
    const item = banners.find(b => b.id === id);
    if (item) {
      item.isActive = !item.isActive;
      this.setData(KEYS.BANNERS, banners);
    }
  }

  deleteBanner(id: string) {
    const banners = this.getData<Banner>(KEYS.BANNERS);
    const filtered = banners.filter(b => b.id !== id);
    this.setData(KEYS.BANNERS, filtered);
  }

  updateBanner(id: string, updated: Partial<Banner>) {
    const banners = this.getData<Banner>(KEYS.BANNERS);
    const idx = banners.findIndex(b => b.id === id);
    if (idx !== -1) {
      banners[idx] = {
        ...banners[idx],
        ...updated,
        title: updated.title !== undefined ? updated.title : (`${updated.titleLine1 || banners[idx].titleLine1 || ''} ${updated.titleLine2 || banners[idx].titleLine2 || ''}`.trim() || banners[idx].title)
      };
      this.setData(KEYS.BANNERS, banners);
    }
  }

  addPromotion(promo: Omit<Promotion, 'id' | 'isActive'>) {
    const promos = this.getData<Promotion>(KEYS.PROMOTIONS);
    promos.push({
      ...promo,
      id: `promo-${Date.now()}`,
      isActive: true,
    });
    this.setData(KEYS.PROMOTIONS, promos);
  }

  togglePromotion(id: string) {
    const promos = this.getData<Promotion>(KEYS.PROMOTIONS);
    const item = promos.find(p => p.id === id);
    if (item) {
      item.isActive = !item.isActive;
      this.setData(KEYS.PROMOTIONS, promos);
    }
  }

  getAnnouncements(): string[] {
    const raw = localStorage.getItem(KEYS.ANNOUNCEMENTS);
    return raw ? JSON.parse(raw) : getInitialAnnouncements();
  }

  setAnnouncements(announcements: string[]) {
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }

  getPopupAnnouncements(): PortalAnnouncement[] {
    const raw = localStorage.getItem(KEYS.PORTAL_POPUP_ANNOUNCEMENTS);
    return raw ? JSON.parse(raw) : getInitialPopupAnnouncements();
  }

  savePopupAnnouncements(announcements: PortalAnnouncement[]) {
    localStorage.setItem(KEYS.PORTAL_POPUP_ANNOUNCEMENTS, JSON.stringify(announcements));
    // Emit notification event to hot-update UI instantly across layers
    window.dispatchEvent(new Event('playportal_popup_announcements_updated'));
  }

  addPopupAnnouncement(announcement: Omit<PortalAnnouncement, 'id'>) {
    const list = this.getPopupAnnouncements();
    const newId = `popup-ann-${Date.now()}`;
    const newItem: PortalAnnouncement = {
      ...announcement,
      id: newId,
    };
    list.push(newItem);
    this.savePopupAnnouncements(list);
    return newId;
  }

  updatePopupAnnouncement(id: string, updated: Partial<PortalAnnouncement>) {
    const list = this.getPopupAnnouncements();
    const idx = list.findIndex(item => item.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...updated,
      };
      this.savePopupAnnouncements(list);
    }
  }

  deletePopupAnnouncement(id: string) {
    const list = this.getPopupAnnouncements();
    const filtered = list.filter(item => item.id !== id);
    this.savePopupAnnouncements(filtered);
  }

  // Favorite toggle helper
  toggleFavorite(userId: string, gameId: string): string[] {
    const key = `${KEYS.FAVORITES}_${userId}`;
    const favs = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = favs.indexOf(gameId);
    if (idx !== -1) {
      favs.splice(idx, 1);
    } else {
      favs.push(gameId);
    }
    localStorage.setItem(key, JSON.stringify(favs));
    return favs;
  }

  getFavorites(userId: string): string[] {
    const key = `${KEYS.FAVORITES}_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  // Recently played helper
  addRecentlyPlayed(userId: string, gameId: string) {
    const key = `${KEYS.RECENTLY_PLAYED}_${userId}`;
    let recents = JSON.parse(localStorage.getItem(key) || '[]');
    recents = recents.filter((id: string) => id !== gameId); // remove existing
    recents.unshift(gameId); // prepand
    if (recents.length > 6) recents.pop();
    localStorage.setItem(key, JSON.stringify(recents));
  }

  getRecentlyPlayed(userId: string): string[] {
    const key = `${KEYS.RECENTLY_PLAYED}_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  // Add bonus balance helper
  addBonusBalance(userId: string, amount: number, notes: string): Wallet | null {
    const wallets = this.getData<Wallet>(KEYS.WALLETS);
    const wallet = wallets.find(w => w.userId === userId);
    if (!wallet) return null;
    
    wallet.bonusBalance += amount;
    this.setData(KEYS.WALLETS, wallets);
    
    // Add transaction history
    const transactions = this.getData<Transaction>(KEYS.TRANSACTIONS);
    const profiles = this.getData<UserProfile>(KEYS.PROFILES);
    const user = profiles.find(p => p.id === userId);
    
    const tx: Transaction = {
      id: `tx-bonus-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId,
      username: user?.username || 'unknown',
      type: 'bonus',
      amount: amount,
      status: 'approved',
      notes: notes,
      createdAt: new Date().toISOString()
    };
    transactions.unshift(tx);
    this.setData(KEYS.TRANSACTIONS, transactions);

    this.addNotification(userId, '🎁 Bonus Balance Unlocked', `৳${amount} bonus cash credited! Reason: ${notes}`);
    return wallet;
  }

  // Claim VIP check-in helper
  claimDailyVipCheckIn(userId: string, vipLevel: number): { success: boolean; bonusAmount: number; error?: string } {
    const lastClaimKey = `playportal_last_vip_claim_${userId}`;
    const lastClaim = localStorage.getItem(lastClaimKey);
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (lastClaim === todayStr) {
      return { success: false, bonusAmount: 0, error: 'You have already claimed your daily VIP Check-In reward today! Please come back tomorrow.' };
    }
    
    // Reward depends on level
    const rewardAmounts = [15, 50, 200, 1000, 3500, 8000]; // levels 0 to 5
    const amount = rewardAmounts[vipLevel] || 15;
    
    const wallet = this.addBonusBalance(userId, amount, `Daily VIP Check-In (Level ${vipLevel})`);
    if (wallet) {
      localStorage.setItem(lastClaimKey, todayStr);
      return { success: true, bonusAmount: amount };
    }
    
    return { success: false, bonusAmount: 0, error: 'Could not access wallet' };
  }

  // --- OUTCOME CONTROL CENTER & GAME RIGGING MODELS (Admins) ---
  getGameControlModels(): GameControlModel[] {
    const raw = localStorage.getItem(KEYS.GAME_CONTROL_MODELS);
    const models: GameControlModel[] = raw ? JSON.parse(raw) : [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if reset is needed due to date change
    let updated = false;
    models.forEach(m => {
      if (m.lastResetDate !== todayStr) {
        m.currentWinnersToday = 0;
        m.lastResetDate = todayStr;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(KEYS.GAME_CONTROL_MODELS, JSON.stringify(models));
    }
    return models;
  }

  updateGameControlModel(modelId: string, updates: Partial<Pick<GameControlModel, 'maxWinnersPerDay' | 'currentWinnersToday'>>): { success: boolean; models: GameControlModel[] } {
    const models = this.getGameControlModels();
    const idx = models.findIndex(m => m.id === modelId);
    if (idx !== -1) {
      models[idx] = {
        ...models[idx],
        ...updates
      };
      localStorage.setItem(KEYS.GAME_CONTROL_MODELS, JSON.stringify(models));
      return { success: true, models };
    }
    return { success: false, models };
  }

  getGameModelMappings(): { [gameId: string]: string } {
    const raw = localStorage.getItem(KEYS.GAME_MODEL_MAPPING);
    return raw ? JSON.parse(raw) : {};
  }

  setGameModelMapping(gameId: string, modelId: string): void {
    const mapping = this.getGameModelMappings();
    mapping[gameId] = modelId;
    localStorage.setItem(KEYS.GAME_MODEL_MAPPING, JSON.stringify(mapping));
  }

  checkGameOutcome(userId: string, gameId: string): 'none' | 'force_win' | 'force_lose' {
    const mappings = this.getGameModelMappings();
    const modelId = mappings[gameId] || 'model-rng';
    const models = this.getGameControlModels();
    const model = models.find(m => m.id === modelId);

    if (!model) return 'none';

    if (model.type === 'force_loss') {
      return 'force_lose';
    }
    if (model.type === 'force_win') {
      return 'force_win';
    }
    if (model.type === 'winner_cap') {
      if (model.currentWinnersToday >= model.maxWinnersPerDay) {
        return 'force_lose';
      }
    }
    return 'none';
  }

  trackGameWin(gameId: string): void {
    const mappings = this.getGameModelMappings();
    const modelId = mappings[gameId];
    if (!modelId) return;

    const models = this.getGameControlModels();
    const model = models.find(m => m.id === modelId);
    if (model && model.type === 'winner_cap') {
      model.currentWinnersToday += 1;
      localStorage.setItem(KEYS.GAME_CONTROL_MODELS, JSON.stringify(models));
    }
  }
}

export const db = new DummySupabaseClient();
