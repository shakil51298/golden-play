/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './db/dummySupabase';
import { UserProfile, Wallet, Game, Banner, Promotion, GameCategory, PortalAnnouncement } from './types';
import { syncService } from './db/supabaseSync';
import { isSupabaseConfigured } from './db/supabaseClient';
import AuthModal from './components/AuthModal';
import SlotMachineDemo from './components/SlotMachineDemo';
import LuckyMinesDemo from './components/LuckyMinesDemo';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import AgentPanel from './components/AgentPanel';
import VipBonusModal from './components/VipBonusModal';
import SupportChatWidget from './components/SupportChatWidget';
import AppDownloadModal from './components/AppDownloadModal';
import CustomerAnnouncementModal from './components/CustomerAnnouncementModal';
import RecentWinners from './components/RecentWinners';
import InfoAccordions from './components/InfoAccordions';
import GameProviders from './components/GameProviders';
import PersonalCenterModal from './components/PersonalCenterModal';
import { 
  Gamepad2, Gift, Wallet2, Users, ShieldAlert, Sparkles, Search, Heart, 
  Play, HelpCircle, LogOut, LogIn, ChevronLeft, ChevronRight, MessageCircle, AlertCircle, TrendingUp,
  Volume2, Sun, Moon, Crown, Headphones, Download, ChevronDown, ChevronUp, Coins, Menu, X,
  Eye, EyeOff, RefreshCw, Pencil, UserCircle, ReceiptText, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';

const avatarSeeds = [
  'luna-vip', 'ruby-crown', 'maya-gold', 'nora-spin', 'aria-luck', 'zara-play',
  'kai-royal', 'mira-coin', 'sana-star', 'ravi-ace', 'leo-jackpot', 'tara-win'
];

const buildAvatarUrl = (seed: string) => {
  const safeSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${safeSeed}&backgroundColor=ffd5dc,b6e3f4,c0aede,ffdfbf`;
};

const getProfileAvatarUrl = (profile: UserProfile) => {
  if (profile.avatarUrl && /^(https?:|data:)/.test(profile.avatarUrl)) {
    return profile.avatarUrl;
  }
  return buildAvatarUrl(`${profile.id}-${profile.username}`);
};

const randomAvatarUrl = (profile: UserProfile) => {
  const seed = avatarSeeds[Math.floor(Math.random() * avatarSeeds.length)];
  return buildAvatarUrl(`${profile.id}-${seed}-${Date.now()}`);
};

export default function App() {
  // Collapsed Sidebar layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isVipOpen, setIsVipOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [isPromoAccordionExpanded, setIsPromoAccordionExpanded] = useState<boolean>(true);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'bn' | 'hi'>('bn');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isPersonalCenterOpen, setIsPersonalCenterOpen] = useState<boolean>(false);
  const [personalCenterInitialMenu, setPersonalCenterInitialMenu] = useState<'profile' | 'deposit' | 'withdraw' | 'history' | 'invite' | 'alerts'>('profile');
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);

  // Authentication & Profile states
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authTabSelected, setAuthTabSelected] = useState<'login' | 'register' | 'forgot'>('login');
  const [initialResetEmail, setInitialResetEmail] = useState<string>('');
  const [initialResetOtp, setInitialResetOtp] = useState<string>('');
  const [initialResetTab, setInitialResetTab] = useState<'login' | 'register' | 'forgot' | undefined>(undefined);

  // Multi-panel display toggles
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAgentOpen, setIsAgentOpen] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  // Home Navigation state
  const [currentViewTab, setCurrentViewTab] = useState<'lobby' | 'promo' | 'wallet' | 'referral'>('lobby');
  const [activeDashboardSubMenu, setActiveDashboardSubMenu] = useState<'profile' | 'deposit' | 'withdraw' | 'history' | 'invite' | 'alerts'>('profile');

  // Lobby Games Filtering states
  const [activeLobbyCategory, setActiveLobbyCategory] = useState<GameCategory>('popular');
  const [gameSearchQuery, setGameSearchQuery] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [showRecentlyPlayedOnly, setShowRecentlyPlayedOnly] = useState<boolean>(false);

  // Dynamic systems lists
  const [games, setGames] = useState<Game[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>([]);

  // Carousel slider state
  const [activeBannerIdx, setActiveBannerIdx] = useState<number>(0);

  // Full-interactive customer announcement popup modal states (Bengali promo mockup)
  const [popupAnnouncements, setPopupAnnouncements] = useState<PortalAnnouncement[]>([]);
  const [showPromoPopup, setShowPromoPopup] = useState<boolean>(false);
  const [selectedPopupId, setSelectedPopupId] = useState<string>('');

  // Interactive Live Progressive Jackpot Ticker state
  const [jackpotPoolValue, setJackpotPoolValue] = useState<number>(8845112.50);

  // Referrals tracker
  const [inviteReferralCode, setInviteReferralCode] = useState<string>('');

  // Active Announcements state
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('playportal_theme');
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  const getOrderedActiveBanners = () => {
    return db.getData<Banner>('playportal_banners_v1')
      .filter(b => b.isActive)
      .sort((a, b) => {
        const orderA = Number.isFinite(a.displayOrder) ? Number(a.displayOrder) : Number.MAX_SAFE_INTEGER;
        const orderB = Number.isFinite(b.displayOrder) ? Number(b.displayOrder) : Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('playportal_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Initial fetch
    syncActiveUser();
    
    const supabaseConfigured = isSupabaseConfigured();

    // Load static data. When Supabase is configured, public banners/promos come
    // from admin-controlled Supabase rows, not this browser's demo localStorage.
    setGames(db.getData<Game>('playportal_games_v1'));
    setBanners(supabaseConfigured ? [] : getOrderedActiveBanners());
    setPromotions(supabaseConfigured ? [] : db.getData<Promotion>('playportal_promotions_v1').filter(p => p.isActive));
    setAnnouncements(db.getAnnouncements());

    // Load interactive popups on reload (every reload!)
    const pops = db.getPopupAnnouncements().filter(item => item.isActive);
    setPopupAnnouncements(pops);
    if (pops.length > 0) {
      setSelectedPopupId(pops[0].id);
      setShowPromoPopup(true);
    }

    // Listen to updates from admin panel in same/different window
    const handleLobbyContentUpdate = () => {
      const freshBanners = getOrderedActiveBanners();
      setBanners(freshBanners);
      setActiveBannerIdx(current => freshBanners.length > 0 ? Math.min(current, freshBanners.length - 1) : 0);
      setPromotions(db.getData<Promotion>('playportal_promotions_v1').filter(p => p.isActive));
      setAnnouncements(db.getAnnouncements());

      const freshP = db.getPopupAnnouncements().filter(item => item.isActive);
      setPopupAnnouncements(freshP);
    };
    window.addEventListener('storage', handleLobbyContentUpdate);
    window.addEventListener('playportal_announcements_updated', handleLobbyContentUpdate);
    window.addEventListener('playportal_banners_updated', handleLobbyContentUpdate);
    window.addEventListener('playportal_popup_announcements_updated', handleLobbyContentUpdate);

    // Public lobby content must load for logged-out/incognito users too.
    if (supabaseConfigured) {
      syncService.pullPublicContentFromSupabase()
        .then((res) => {
          if (res.success) {
            handleLobbyContentUpdate();
          } else {
            console.warn('Public lobby content pull failed gracefully:', res.error);
          }
        })
        .catch((e) => console.warn('Public lobby content pull failed gracefully:', e));

      // Full private sync is best-effort and may fail for logged-out visitors.
      syncService.pullFromSupabase()
        .then((res) => {
          if (res.success) {
            handleLobbyContentUpdate();
            syncActiveUser();
          } else {
            console.warn('Background full pull failed gracefully:', res.error);
          }
        })
        .catch((e) => console.warn('Background pull on mount failed gracefully:', e));
    }

    // Handle affiliate parameter referrals
    const urlParams = new URLSearchParams(window.location.search);
    const referralParam = urlParams.get('ref');
    if (referralParam) {
      setInviteReferralCode(referralParam);
      // Auto open registration modal with referred agent filled!
      setIsAuthOpen(true);
    }

    const actionParam = urlParams.get('action');
    const emailParam = urlParams.get('email');
    const otpParam = urlParams.get('otp');
    if (actionParam === 'reset-password' && emailParam) {
      setInitialResetEmail(emailParam);
      setInitialResetOtp(otpParam || '');
      setInitialResetTab('forgot');
      setIsAuthOpen(true);

      // Clean up URL parameters so they don't stick around in browser address bar (this is super clean!)
      try {
        const cleanupUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanupUrl);
      } catch (e) {
        console.error(e);
      }
    }

    // Auto rotate banners
    const bannerTimer = setInterval(() => {
      setBanners(prev => {
        if (prev.length > 0) {
          setActiveBannerIdx(current => (current + 1) % prev.length);
        }
        return prev;
      });
    }, 5000);

    // Increment Progressive Jackpot to excite visitors!
    const jackpotTimer = setInterval(() => {
      setJackpotPoolValue(val => val + (Math.random() * 0.45));
    }, 1100);

    return () => {
      clearInterval(bannerTimer);
      clearInterval(jackpotTimer);
      window.removeEventListener('storage', handleLobbyContentUpdate);
      window.removeEventListener('playportal_announcements_updated', handleLobbyContentUpdate);
      window.removeEventListener('playportal_banners_updated', handleLobbyContentUpdate);
      window.removeEventListener('playportal_popup_announcements_updated', handleLobbyContentUpdate);
    };
  }, []);

  const syncActiveUser = () => {
    const fresh = db.getCurrentUser();
    if (fresh) {
      setCurrentUser(fresh.profile);
      setCurrentWallet(fresh.wallet);
      setFavoriteIds(db.getFavorites(fresh.profile.id));
      setRecentlyPlayedIds(db.getRecentlyPlayed(fresh.profile.id));

      // Automatically pop up announcements to greet the newly logged-in customer!
      const pops = db.getPopupAnnouncements().filter(item => item.isActive);
      if (pops.length > 0) {
        setPopupAnnouncements(pops);
        setSelectedPopupId(pops[0].id);
        setShowPromoPopup(true);
      }
    } else {
      setCurrentUser(null);
      setCurrentWallet(null);
      setFavoriteIds([]);
      setRecentlyPlayedIds([]);
    }
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    setIsPersonalCenterOpen(false);
    db.logout();
    syncActiveUser();
    setCurrentViewTab('lobby');
  };

  const openPersonalCenter = (menu: typeof activeDashboardSubMenu = 'profile') => {
    setPersonalCenterInitialMenu(menu);
    setIsPersonalCenterOpen(true);
    setIsProfileMenuOpen(false);
    setIsAdminOpen(false);
    setIsAgentOpen(false);
  };

  const routeToDashboard = (menu: typeof activeDashboardSubMenu) => {
    setActiveDashboardSubMenu(menu);
    setCurrentViewTab('wallet');
    setIsProfileMenuOpen(false);
    setIsPersonalCenterOpen(false);
    setIsAdminOpen(false);
    setIsAgentOpen(false);
  };

  const refreshCurrentAvatar = () => {
    if (!currentUser) return;
    const profiles = db.getData<UserProfile>('playportal_profiles_v1');
    const nextAvatar = randomAvatarUrl(currentUser);
    const updatedProfiles = profiles.map(profile => (
      profile.id === currentUser.id ? { ...profile, avatarUrl: nextAvatar } : profile
    ));
    db.setData('playportal_profiles_v1', updatedProfiles);
    setCurrentUser(prev => prev ? { ...prev, avatarUrl: nextAvatar } : prev);
    window.dispatchEvent(new Event('playportal_profile_updated'));
  };

  const toggleFavoriteGame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const updated = db.toggleFavorite(currentUser.id, id);
    setFavoriteIds(updated);
  };

  const launchGame = (game: Game) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setActiveGame(game);
  };

  const handleMainTabChange = (tab: 'lobby' | 'promo' | 'wallet' | 'referral') => {
    if (tab === 'wallet' || tab === 'referral') {
      if (!currentUser) {
        setIsAuthOpen(true);
        return;
      }
      if (tab === 'wallet') {
        setActiveDashboardSubMenu('profile');
      } else {
        setActiveDashboardSubMenu('invite');
        tab = 'wallet'; // Shares dashboard layout
      }
    }
    setCurrentViewTab(tab);
  };

  const handlePromoGridAction = (code: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    // Route them nicely to the deposit screen to utilize that promotion code
    setActiveDashboardSubMenu('deposit');
    setCurrentViewTab('wallet');
  };

  // Filter games inside render
  const filteredGames = games.filter(g => {
    // 1. Category checks (popular, slots, live, etc.)
    if (activeLobbyCategory !== 'popular' && g.category !== activeLobbyCategory) {
      return false;
    }
    if (activeLobbyCategory === 'popular' && !g.isPopular) {
      return false;
    }

    // 2. Search query check
    if (gameSearchQuery.trim()) {
      const matchText = gameSearchQuery.toLowerCase();
      if (!g.title.toLowerCase().includes(matchText) && !g.provider.toLowerCase().includes(matchText)) {
        return false;
      }
    }

    // 3. Favorites toggle check
    if (showFavoritesOnly) {
      return favoriteIds.includes(g.id);
    }

    // 4. Recently played toggle check
    if (showRecentlyPlayedOnly) {
      return recentlyPlayedIds.includes(g.id);
    }

    return true;
  });

  const t = {
    en: {
      home: 'Home',
      vipBonus: 'VIP Bonus',
      referEarn: 'Refer Earn',
      bettingBonus: 'Betting Bonus',
      promotion: 'Promotion',
      seeMore: 'See more',
      customerService: 'Customer Service',
      appDownload: 'APP Download',
      promoLine1: '৳500 Welcome Slot Payouts!',
      promoLine2: 'Golden Play App Download Bonus ৳100',
      promoLine3: 'Up to 1.8% Double Rebates Daily',
      adminPanel: '⚙️ Admin Panel',
      agentPanel: '💎 Agent Desk',
      loginTrigger: 'SIGN IN / JOIN COINS',
      switchTitle: 'Translate',
      goldTitle: 'RECOMMENDED LOBBY',
      catPopular: '🔥 POPULAR',
      catSlots: '🎰 SLOTS',
      catLive: '🎡 LIVE CASINO',
      catSports: '⚽ SPORTS',
      catFishing: '🦈 FISHING',
      catCards: '♠️ TABLE CARDS',
      jackpotTitle: 'GRAND REBEL PROGRESSIVE JACKPOT',
      jackpotSub: 'High-multiplier slot wagers contribute to dynamic pool value.',
      searchPlaceholder: 'Query by title or provider (e.g. Pragmatic, Olympus)...',
      favoritesLabel: 'FAVORITES',
      recentLabel: 'RECENT PLAYED',
      noGamesMatched: 'No games matched your query category, search text, or favorites logs.',
      activePromoTitle: 'ACTIVE LOBBY PROMOTIONS',
      sandboxDisclaimer: 'This is an educational sandbox simulator platform. All deposits and financial payouts listed inside ledger histories operate on a manually-audited pipeline. No real money gambling occurs.',
      clearFilters: 'Clear lobby filters',
      announcementsLabel: '📢 Portal News'
    },
    bn: {
      home: 'হোম',
      vipBonus: 'ভিআইপি বোনাস',
      referEarn: 'রেফার ও আয়ের ডেক্স',
      bettingBonus: 'বেটিং বোনাস',
      promotion: 'প্রোমোশন',
      seeMore: 'আরো দেখুন',
      customerService: 'গ্রাহক সেবা যোগাযোগ',
      appDownload: 'অ্যাপ ডাউনলোড করুন',
      promoLine1: 'রেজিস্ট্রেশন করলেই ফ্রি গিফট অফার...',
      promoLine2: 'Golden Play APP ডাউনলোড বোনাস ৳১০০',
      promoLine3: 'নতুন সদস্যদের প্রথম ডিপোজিট বোনাস...',
      adminPanel: '⚙️ লেজার অ্যাডমিন',
      agentPanel: '💎 এজেন্ট ডেস্ক',
      loginTrigger: 'সাইন ইন / রেজিস্ট্রেশন',
      switchTitle: 'ভাষা পরিবর্তন',
      goldTitle: 'সুপার রিকমেন্ড লবি',
      catPopular: '🔥 জনপ্রিয় গেম',
      catSlots: '🎰 স্লট গেমস',
      catLive: '🎡 লাইভ ক্যাসিনো',
      catSports: '⚽ স্পোর্টস বেটিং',
      catFishing: '🦈 ফিশিং হান্টার',
      catCards: '♠️ বোর্ড কার্ড',
      jackpotTitle: 'গ্র্যান্ড রেবেল প্রোগ্রেসিভ জ্যাকপট',
      jackpotSub: 'উচ্চ পরিমাণের স্লট বাজি জ্যাকপট পুল বৃদ্ধি করে।',
      searchPlaceholder: 'গেম বা প্রোভাইডার দিয়ে খুঁজুন (উদ্বাহরর: Pragmatic, Olympus)...',
      favoritesLabel: 'পছন্দসই',
      recentLabel: 'সম্প্রতি খেলেছেন',
      noGamesMatched: 'কোনো গেম আপনার খোঁজা তথ্যের সাথে মেলেনি।',
      activePromoTitle: 'অফিসিয়াল চলমান প্রোমোশন সমূহ',
      sandboxDisclaimer: 'এটি একটি শিক্ষামূলক সিমুলেটর প্ল্যাটফর্ম। সমস্ত ডিপোজিট এবং আর্থিক উত্তোলন ম্যানুয়ালি যাচাই করা হয় এবং এটি কোনো আসল টাকার জুয়া খেলা নয়।',
      clearFilters: 'ফিল্টার মুছুন',
      announcementsLabel: '📢 ঘোষণা ও প্রচার'
    },
    hi: {
      home: 'होम',
      vipBonus: 'वीआईपी बोनस',
      referEarn: 'सिफारिश / कमाई',
      bettingBonus: 'बेटिंग बोनस',
      promotion: 'प्रमोशन',
      seeMore: 'और देखें',
      customerService: 'ग्राहक सेवा',
      appDownload: 'ऐप डाउनलोड',
      promoLine1: '৳५०० स्लॉट पंजीकरण ऑफर गिफ्ट!',
      promoLine2: 'Golden Play ऐप डाउनलोड बोनस ৳१००',
      promoLine3: 'नए सदस्यों के लिए कैशबैक।',
      adminPanel: '⚙️ एडमिन नियंत्रण',
      agentPanel: '💎 एजेंट डेस्क',
      loginTrigger: 'साइन इन / रजिस्टर',
      switchTitle: 'भाषा बदलें',
      goldTitle: 'अनुशंसित लॉबी',
      catPopular: '🔥 लोकप्रिय',
      catSlots: '🎰 स्लॉट',
      catLive: '🎡 लाइव कैसीनो',
      catSports: '⚽ खेल',
      catFishing: '🦈 मछली पकड़ना',
      catCards: '♠️ बोर्ड कार्ड',
      jackpotTitle: 'ग्रैंड विद्रोही प्रगतिशील जैकपॉट',
      jackpotSub: 'उच्च दांव इस गतिशील जैकपॉट पूल को बढ़ाते हैं।',
      searchPlaceholder: 'शीर्षक या प्रदाता द्वारा खोजें (जैसे Pragmatic, Olympus)...',
      favoritesLabel: 'पसंदीदा',
      recentLabel: 'हाल ही में खेला गया',
      noGamesMatched: 'आपकी श्रेणी या खोज सामग्री से मेल खाने वाला कोई गेम नहीं मिला।',
      activePromoTitle: 'सक्रिय लॉबी प्रचार',
      sandboxDisclaimer: 'यह एक शैक्षिक सिम्युलेटर प्लेटफॉर्म है। सभी जमा और निकासी को केवल परीक्षण/सिमुलेशन उद्देश्यों के लिए रखा गया है, कोई वास्तविक धन जुआ नहीं है।',
      clearFilters: 'फ़िल्टर साफ़ करें',
      announcementsLabel: '📢 समाचार और प्रचार'
    }
  }[currentLanguage];

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#070b19] text-white flex font-sans select-none relative pb-18 sm:pb-0 w-full min-w-0">
      
      {/* ======================================= */}
      {/* LEFT SIDEBAR (Sticky on desktop, slide on mobile) */}
      {/* ======================================= */}
      <aside 
        id="collapsable_left_sidebar"
        className={`shrink-0 z-48 bg-gradient-to-b from-[#182d30] via-[#101e20] to-[#050b0c] border-r border-[#224246]/70 transition-all duration-300 flex flex-col h-[100dvh] overflow-y-auto top-0 shadow-2xl
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
          ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 w-64 translate-x-0' : 'fixed md:sticky md:flex -translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#224246] flex items-center justify-between relative bg-[#0d2123] shrink-0 h-16 w-full">
          {isSidebarCollapsed ? (
            <div 
              onClick={() => handleMainTabChange('lobby')}
              className="mx-auto cursor-pointer font-black text-amber-400 text-base tracking-tighter col-span-1"
            >
              GP
            </div>
          ) : (
            <div 
              onClick={() => handleMainTabChange('lobby')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="flex items-center text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                GOLDENPLAY
              </div>
            </div>
          )}

          {/* Overlapping Orange/Yellow Collapse Toggle Trigger */}
          <button
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className="absolute right-[-14px] top-4.5 z-45 w-7 h-7 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-full shadow-lg flex items-center justify-center border border-amber-600 cursor-pointer hidden md:flex hover:scale-105 transition-all"
            title={isSidebarCollapsed ? "Expand Sidebar Menu" : "Collapse Sidebar Menu"}
          >
            {isSidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Scrollable Items Container */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-none">
          
          {/* Main Navigation keys list */}
          <div className="space-y-2 col-span-1">
            
            {/* 1. Home tab */}
            <button
              onClick={() => {
                handleMainTabChange('lobby');
                setIsAdminOpen(false);
                setIsAgentOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                currentViewTab === 'lobby' && !isAdminOpen && !isAgentOpen
                  ? 'bg-slate-950/85 border-[#4facb5] text-[#ffe57e] font-black shadow-lg shadow-black/40'
                  : 'bg-black/25 border-[#1f3b3e] text-slate-400 hover:bg-[#122c2f] hover:text-white'
              }`}
            >
              <span className="text-lg">🏠</span>
              {!isSidebarCollapsed && (
                <span className="text-xs uppercase font-extrabold tracking-wide text-left">{t.home}</span>
              )}
            </button>

            {/* 2. VIP Bonus (Crown gradient) */}
            <button
              onClick={() => {
                setIsVipOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full p-2.5 rounded-xl border bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-855 text-yellow-305 border-yellow-600/30 flex items-center gap-3 transition-all cursor-pointer relative shadow-[0_3px_8px_rgba(220,38,38,0.2)] hover:shadow-[0_4px_12px_rgba(220,38,38,0.4)] hover:scale-[1.01] preserve-dark-bg-text"
            >
              <div className="relative shrink-0">
                <span className="text-lg">👑</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  <span className="text-xs uppercase font-black tracking-widest block leading-none">{t.vipBonus}</span>
                  <span className="text-[7.5px] font-mono text-yellow-500/80 block leading-none mt-1">Claim Allowance</span>
                </div>
              )}
            </button>

            {/* 3. Refer & Earn (Coins Blue gradient) */}
            <button
              onClick={() => {
                handleMainTabChange('referral');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer preserve-dark-bg-text ${
                currentViewTab === 'wallet' && activeDashboardSubMenu === 'invite'
                  ? 'bg-[#12314f] border-cyan-400 text-white font-black'
                  : 'bg-gradient-to-r from-blue-950 to-indigo-950 text-cyan-200 border-cyan-500/20 hover:from-blue-900 hover:to-indigo-900'
              }`}
            >
              <span className="text-lg shrink-0">💎</span>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  <span className="text-xs uppercase font-extrabold tracking-wide block leading-none">{t.referEarn}</span>
                  <span className="text-[7.5px] font-mono text-cyan-300 block leading-none mt-1">10% team commission</span>
                </div>
              )}
            </button>

            {/* 4. Betting Bonus Chest (Purple/Violet gradient) */}
            <button
              onClick={() => {
                handleMainTabChange('promo');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer preserve-dark-bg-text ${
                currentViewTab === 'promo'
                  ? 'bg-[#431454] border-purple-400 text-white font-black'
                  : 'bg-gradient-to-r from-[#2c0f38] to-[#431454] text-purple-200 border-purple-500/20 hover:from-[#3a1249] hover:to-[#551d6b]'
              }`}
            >
              <span className="text-lg shrink-0">🧧</span>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  <span className="text-xs uppercase font-extrabold tracking-wide block leading-none">{t.bettingBonus}</span>
                  <span className="text-[7.5px] font-mono text-purple-305 block leading-none mt-1">Verify promo codes</span>
                </div>
              )}
            </button>

          </div>

          {/* Special Admin & Agent overrides in Sidebar */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'agent') && (
            <div className="border-t border-[#224246] pt-3 space-y-2">
              <span className="text-[8px] font-mono uppercase text-[#4facb5]/80 font-bold tracking-widest block px-1">
                {!isSidebarCollapsed ? "MANAGEMENT HUB" : "MGR"}
              </span>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setIsAdminOpen(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl border border-red-500/30 bg-red-950/25 hover:bg-red-950/40 text-red-350 flex items-center gap-3 cursor-pointer transition-all animate-pulse"
                >
                  <span className="text-sm shrink-0 font-sans">⚙️</span>
                  {!isSidebarCollapsed && (
                    <span className="text-xs font-black uppercase tracking-wider">{t.adminPanel}</span>
                  )}
                </button>
              )}

              {currentUser?.role === 'agent' && (
                <button
                  onClick={() => {
                    setIsAgentOpen(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl border border-yellow-500/30 bg-yellow-950/20 hover:bg-yellow-950/35 text-yellow-405 flex items-center gap-3 cursor-pointer transition-all"
                >
                  <span className="text-sm shrink-0">💎</span>
                  {!isSidebarCollapsed && (
                    <span className="text-xs font-black uppercase tracking-wider">{t.agentPanel}</span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Accordion List for Promotion Star points matching image */}
          {!isSidebarCollapsed && (
            <div className="bg-black/30 rounded-xl border border-[#224246]/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsPromoAccordionExpanded(!isPromoAccordionExpanded)}
                className="w-full p-2.5 flex justify-between items-center text-slate-300 hover:text-white hover:bg-[#122c2f] transition-all text-left font-sans cursor-pointer"
              >
                <div className="flex items-center gap-1.5 flex-row">
                  <span className="text-red-400">🚨</span>
                  <span className="text-[10px] uppercase font-black text-slate-200 tracking-wider">
                    {t.promotion}
                  </span>
                </div>
                {isPromoAccordionExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {isPromoAccordionExpanded && (
                <div className="p-2.5 bg-[#081517] border-t border-[#224246]/45 space-y-2 text-[10px]">
                  <ul className="space-y-1.5 font-sans leading-normal text-slate-300 list-none">
                    <li className="flex items-start gap-1">
                      <span className="text-yellow-400 shrink-0">⭐️</span>
                      <span className="hover:text-yellow-300 cursor-pointer">{t.promoLine1}</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-yellow-400 shrink-0">⭐️</span>
                      <span className="hover:text-yellow-300 cursor-pointer">{t.promoLine2}</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-yellow-400 shrink-0">⭐️</span>
                      <span className="hover:text-yellow-300 cursor-pointer">{t.promoLine3}</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => {
                      handleMainTabChange('promo');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full mt-2 py-1 px-2 text-center bg-[#153437] hover:bg-[#1f4e52] border border-[#2d5c60] text-[#3fc0cc] hover:text-white rounded-lg font-bold text-[9px] uppercase tracking-wide cursor-pointer transition-colors"
                  >
                    {t.seeMore} &gt;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Support and Download Nodes */}
          <div className="border-t border-[#224246] pt-3 space-y-2">
            <span className="text-[8px] font-mono uppercase text-[#4facb5]/80 tracking-widest block px-1">
              {!isSidebarCollapsed ? "RESOURCES" : "RES"}
            </span>

            {/* Announcements Dialog Trigger button */}
            <button
              onClick={() => {
                const pops = db.getPopupAnnouncements().filter(item => item.isActive);
                if (pops.length > 0) {
                  setPopupAnnouncements(pops);
                  setSelectedPopupId(pops[0].id);
                  setShowPromoPopup(true);
                }
                setIsMobileSidebarOpen(false);
              }}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-red-600/35 to-rose-600/35 border border-red-500/30 text-white hover:text-yellow-200 hover:from-red-600/50 hover:to-rose-600/50 flex items-center gap-3 cursor-pointer transition-all shadow-[0_0_8px_rgba(239,68,68,0.15)]"
            >
              <span className="text-lg shrink-0">📢</span>
              {!isSidebarCollapsed && (
                <span className="text-xs uppercase font-extrabold tracking-wide text-red-100">{t.announcementsLabel}</span>
              )}
            </button>

            {/* Support button */}
            <button
              onClick={() => {
                setIsSupportOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full p-2.5 rounded-xl bg-black/20 border border-[#1f3b3e] text-slate-300 hover:text-cyan-305 hover:bg-[#122c2f] flex items-center gap-3 cursor-pointer transition-all"
            >
              <span className="text-lg shrink-0">🎧</span>
              {!isSidebarCollapsed && (
                <span className="text-xs uppercase font-extrabold tracking-wide">{t.customerService}</span>
              )}
            </button>

            {/* Mobile apk emulator */}
            <button
              onClick={() => {
                setIsDownloadOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full p-2.5 rounded-xl bg-[#14322c] border border-emerald-500/20 text-emerald-435 hover:text-white hover:bg-emerald-950 flex items-center gap-3 cursor-pointer transition-all"
            >
              <span className="text-lg shrink-0">📱</span>
              {!isSidebarCollapsed && (
                <span className="text-xs uppercase font-extrabold tracking-wide">{t.appDownload}</span>
              )}
            </button>
          </div>

        </div>

        {/* Sidebar Footer with Language Dropdown selectors */}
        <div className="p-3 bg-[#0a1b1d] border-t border-[#224246] shrink-0 space-y-2">
          
          <div className="flex items-center justify-between text-[9px]">
            {!isSidebarCollapsed && <span className="text-slate-500 font-mono text-[8.5px] tracking-wide font-extrabold">{t.switchTitle}:</span>}
            
            {isSidebarCollapsed ? (
              <button 
                onClick={() => {
                  const nextLang = currentLanguage === 'en' ? 'bn' : currentLanguage === 'bn' ? 'hi' : 'en';
                  setCurrentLanguage(nextLang);
                }}
                className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center border border-[#224246] hover:border-slate-700 font-mono font-bold text-base cursor-pointer"
                title="Change Language"
              >
                {currentLanguage === 'en' ? '🇺🇸' : currentLanguage === 'bn' ? '🇧🇩' : '🇮🇳'}
              </button>
            ) : (
              <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-[#224246]/60">
                {[
                  { key: 'en', label: 'EN', flag: '🇺🇸' },
                  { key: 'bn', label: 'বাংলা', flag: '🇧🇩' },
                  { key: 'hi', label: 'हिंदी', flag: '🇮🇳' },
                ].map((lang) => (
                  <button
                    key={lang.key}
                    onClick={() => setCurrentLanguage(lang.key as any)}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold flex items-center gap-0.5 transition-all cursor-pointer ${
                      currentLanguage === lang.key
                        ? 'bg-[#1a3f44] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isSidebarCollapsed && (
            <div className="flex justify-between items-center text-[8.5px] text-[#4facb5]/50 font-mono">
              <span className="shrink-0">GoldenPlay-Pinnacle V2</span>
              <span>Secure verified</span>
            </div>
          )}

        </div>
      </aside>

      {/* MOBILE DRAWER BACKDROP */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-47 bg-black/70 md:hidden backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* ======================================= */}
      {/* RIGHT MAIN CONTAINER (Flex layout column) */}
      {/* ======================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto">

        {/* 1. Header Navigation Bar */}
        <header className="sticky top-0 z-40 bg-[#0a0f24] border-b border-blue-950 p-2.5 sm:p-3 flex justify-between items-center gap-2 shadow-lg">
          
          <div className="flex items-center">
            {/* Hamburger trigger menu for mobile layout */}
            <button
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="p-1.5 rounded-lg bg-[#0e1938] border border-blue-900/40 text-slate-300 mr-2.5 md:hidden hover:bg-[#152554] cursor-pointer"
              title="Open Navigation menu"
            >
              <Menu size={18} />
            </button>
          </div>



        {/* User wallet balance quick access / login triggers */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {/* Light/Dark Toggle */}
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg bg-[#0e1938] hover:bg-[#152554] border border-blue-900/40 text-yellow-400 transition-all flex items-center justify-center cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-yellow-400 animate-[spin_8s_linear_infinite]" />
            ) : (
              <Moon size={17} className="text-indigo-400" />
            )}
          </button>

          {currentUser && currentWallet ? (
            <div className="relative flex min-w-0 items-center gap-1.5 sm:gap-2">
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => openPersonalCenter('deposit')}
                  className="px-3 py-2 rounded-xl bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950 border border-yellow-200/60 font-black text-[11px] uppercase shadow-md cursor-pointer hover:brightness-110"
                >
                  Deposit
                </button>
                <button
                  onClick={() => routeToDashboard('withdraw')}
                  className="px-3 py-2 rounded-xl bg-[#123743] hover:bg-[#174a56] text-slate-100 border border-cyan-700/60 font-black text-[11px] uppercase shadow-md cursor-pointer"
                >
                  Withdraw
                </button>
              </div>

              <div className="flex min-w-0 items-center gap-1 rounded-full bg-[#102c39] border border-cyan-900/60 pl-1.5 pr-1.5 py-1 text-xs shadow-inner">
                <button
                  type="button"
                  onClick={() => openPersonalCenter('profile')}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-[0_0_12px_rgba(250,204,21,0.35)] cursor-pointer"
                  title="Open wallet"
                >
                  <Coins size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => openPersonalCenter('profile')}
                  className="hidden min-[360px]:block min-w-0 px-1 font-mono text-slate-100 cursor-pointer"
                  title="Open wallet"
                >
                  <span className="text-[11px] sm:text-sm font-black">
                    {isBalanceVisible ? `৳ ${currentWallet.balance.toLocaleString()}` : '৳ ••••'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBalanceVisible(prev => !prev)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-200 hover:bg-white/10 cursor-pointer"
                  title={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                >
                  {isBalanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  onClick={syncActiveUser}
                  className="hidden min-[360px]:grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-200 hover:bg-white/10 cursor-pointer"
                  title="Refresh wallet"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex shrink-0 items-center gap-1 rounded-full p-0.5 pr-1.5 hover:bg-white/10 transition-colors cursor-pointer"
                title="Open profile menu"
              >
                <img
                  src={getProfileAvatarUrl(currentUser)}
                  alt={`${currentUser.username} profile`}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-yellow-400/50 object-cover bg-[#102c39]"
                  referrerPolicy="no-referrer"
                />
                <ChevronDown size={17} className={`text-slate-200 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="fixed inset-0 z-30 cursor-default bg-transparent"
                  />
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-cyan-100/70 bg-[#173f43] shadow-[0_24px_60px_rgba(0,0,0,0.45)] preserve-dark-bg-text">
                    <div className="relative p-5 sm:p-6">
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img
                            src={getProfileAvatarUrl(currentUser)}
                            alt={`${currentUser.username} profile large`}
                            className="h-24 w-24 rounded-full border-4 border-[#214f54] object-cover bg-[#102c39]"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={refreshCurrentAvatar}
                            className="absolute -left-1 top-0 grid h-10 w-10 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-lg hover:bg-yellow-300 cursor-pointer"
                            title="Random profile picture"
                          >
                            <Pencil size={18} />
                          </button>
                          <span className="absolute -bottom-1 right-0 grid h-12 w-12 place-items-center rounded-full border-4 border-[#173f43] bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 shadow-lg">
                            <Crown size={24} />
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-all text-xl font-black text-white">{currentUser.username}</h3>
                          <p className="mt-1 text-[11px] font-mono uppercase tracking-widest text-cyan-100/70">{currentUser.role} account</p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-2 text-slate-100">
                        <button type="button" onClick={() => openPersonalCenter('profile')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-white/10 cursor-pointer">
                          <UserCircle size={22} className="text-blue-300" />
                          <span>আমার অ্যাকাউন্ট</span>
                        </button>
                        <button type="button" onClick={() => openPersonalCenter('deposit')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-white/10 cursor-pointer">
                          <ArrowUpCircle size={22} className="text-emerald-300" />
                          <span>ডিপোজিট করুন</span>
                        </button>
                        <button type="button" onClick={() => routeToDashboard('withdraw')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-white/10 cursor-pointer">
                          <ArrowDownCircle size={22} className="text-amber-300" />
                          <span>উত্তোলন করুন</span>
                        </button>
                        <button type="button" onClick={() => routeToDashboard('history')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-white/10 cursor-pointer">
                          <Gamepad2 size={22} className="text-rose-300" />
                          <span>বেটিং রেকর্ড</span>
                        </button>
                        <button type="button" onClick={() => routeToDashboard('history')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-white/10 cursor-pointer">
                          <ReceiptText size={22} className="text-pink-300" />
                          <span>অ্যাকাউন্ট রেকর্ড</span>
                        </button>
                        <button type="button" onClick={() => routeToDashboard('invite')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-white/10 cursor-pointer">
                          <Users size={22} className="text-cyan-300" />
                          <span>অ্যাফিলিয়েট / রেফার</span>
                        </button>
                        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-200 hover:bg-red-500/15 cursor-pointer">
                          <LogOut size={22} className="text-red-400" />
                          <span>সাইন আউট</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="login_trigger_btn"
                onClick={() => { setAuthTabSelected('login'); setIsAuthOpen(true); }}
                className="px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider hover:brightness-110 shadow-md cursor-pointer"
              >
                SIGN IN
              </button>
              <button
                id="register_trigger_btn"
                onClick={() => { setAuthTabSelected('register'); setIsAuthOpen(true); }}
                className="px-3 sm:px-4 py-1.5 rounded-full bg-[#0e1938] hover:bg-[#152554] border border-blue-900/60 text-yellow-400 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                REGISTER
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Infinite right-to-left announcement / marquee ticker bar */}
      <div className="bg-[#05091a] border-b border-blue-950/40 text-xs py-2 px-3 flex items-center justify-between gap-2 shadow-inner select-none overflow-hidden relative">
        <div className="flex items-center gap-1.5 text-yellow-400 font-extrabold pr-3 bg-[#05091a] z-10 border-r border-blue-950/30 shrink-0">
          <Volume2 size={13} className="animate-bounce" />
          <span className="tracking-wide text-[9px] uppercase font-mono font-bold">INFO DECK</span>
        </div>
        <div className="flex-grow overflow-hidden relative w-full animate-marquee-hover-pause">
          <div className="animate-marquee inline-flex gap-16 md:gap-24 text-slate-300 font-medium whitespace-nowrap text-[11px]">
            {announcements.length === 0 ? (
              <span className="font-mono text-[11px] text-slate-400">⚡ Welcome to Golden Play Portal! Enjoy secure deposit and fast manual payouts.</span>
            ) : (
              <>
                {announcements.map((ann, i) => (
                  <span key={`original-${i}`}>{ann}</span>
                ))}
                {announcements.map((ann, i) => (
                  <span key={`duplicate-${i}`}>{ann}</span>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Body Grid Wrapper */}
      <main className="flex-1 max-w-5xl w-full min-w-0 mx-auto p-2.5 sm:p-3 space-y-4">
        
        {/* Banner Announcement Carousel (Only displayed on Lobby landing page) */}
        {currentViewTab === 'lobby' && banners.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-blue-950 bg-slate-950 h-32 sm:h-40 md:h-56 group">
            
            {/* Slide renderer */}
            {(() => {
              const getFontSizeClasses = (size: string | undefined) => {
                if (size === 'medium') return 'text-[14px] md:text-[32px]';
                if (size === 'large') return 'text-[16px] md:text-[42px]';
                if (size === 'maximum') return 'text-[18px] md:text-[54px]';
                return 'text-sm md:text-2xl'; // Default / balanced
              };

              return banners.map((slide, idx) => {
                const isCustomTemplate = !!slide.templateType;
                const fullImageSrc = slide.imageLink || slide.imageUrl;
                const slideBg = isCustomTemplate
                  ? (slide.bgGradient || 'linear-gradient(135deg, #070e28 0%, #0c2054 50%, #08173d 100%)')
                  : (slide.imageUrl || 'linear-gradient(135deg, #070e28 0%, #0c2054 50%, #08173d 100%)');

                const isGradient = typeof slideBg === 'string' && (slideBg.startsWith('linear-gradient') || slideBg.startsWith('radial-gradient'));
                const sizeClass = getFontSizeClasses(slide.titleFontSize);

                return (
                  <div
                    key={slide.id}
                    style={isGradient ? { background: slideBg } : { backgroundImage: `url(${slideBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    className={`absolute inset-0 transition-all duration-700 preserve-dark-bg-text ${
                      activeBannerIdx === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    {slide.templateType === 'full-image' ? (
                      <div className="w-full h-full relative cursor-pointer" onClick={() => slide.promoCode && handleMainTabChange('promo')}>
                        <img
                          src={fullImageSrc}
                          alt={slide.title || 'M71 Promotion'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover sm:object-fill"
                        />
                        {slide.promoCode && (
                          <div className="absolute bottom-3 left-4 md:bottom-4 md:left-6 z-15">
                            <span className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-105 text-slate-950 font-black text-[10px] md:text-xs uppercase rounded-lg tracking-wider shadow-lg">
                              CLAIM CODE: {slide.promoCode}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : isCustomTemplate ? (
                      <div className="w-full h-full relative grid grid-cols-12 items-center px-6 md:px-12 select-none overflow-hidden">
                        {/* Ambient light overlay */}
                        <div className="absolute inset-0 bg-radial-at-t from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>
                        
                        {slide.templateType === 'left-text-right-image' ? (
                          <>
                            {/* Left Column (7 cols): Two lines of text */}
                            <div className="col-span-7 space-y-2 md:space-y-3 text-left z-10 py-4 pr-2">
                              <span className="inline-block px-1.5 py-0.5 bg-yellow-400 text-slate-950 text-[8px] font-mono font-black uppercase tracking-wider rounded">
                                EXCLUSIVE OFFER
                              </span>
                              <div className="space-y-1">
                                {slide.titleLine1 && (
                                  <h3 className={`font-black text-white uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none ${sizeClass}`}>
                                    {slide.titleLine1}
                                  </h3>
                                )}
                                {slide.titleLine2 && (
                                  <h3 className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight ${sizeClass}`}>
                                    {slide.titleLine2}
                                  </h3>
                                )}
                              </div>
                              {slide.subtitle && (
                                <p className="text-[9px] md:text-sm text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2 md:line-clamp-none font-medium">
                                  {slide.subtitle}
                                </p>
                              )}
                              {slide.offerMechanicsOneLine && (
                                <p 
                                  style={{ fontSize: slide.mechanicsFontSize ? `${slide.mechanicsFontSize}px` : undefined }}
                                  className="font-bold text-amber-300 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)] line-clamp-1 font-sans mt-0.5 tracking-wide uppercase leading-normal text-[10px]"
                                >
                                  ⚙️ Mechanics: {slide.offerMechanicsOneLine}
                                </p>
                              )}
                              {slide.promoCode && (
                                <div className="pt-0.5">
                                  <button 
                                    onClick={() => handleMainTabChange('promo')}
                                    className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[9px] uppercase rounded tracking-wider cursor-pointer shadow-md transition-all transform hover:scale-102"
                                  >
                                    CODE: {slide.promoCode}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Right Column (5 cols): Beautiful image */}
                            <div className="col-span-5 h-full relative flex items-center justify-center p-2 z-10">
                              {slide.imageLink ? (
                                <img
                                  src={slide.imageLink}
                                  alt={slide.titleLine1 || 'banner graphic'}
                                  referrerPolicy="no-referrer"
                                  className="max-h-[95%] max-w-full object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105"
                                />
                              ) : (
                                <div className="text-[10px] text-slate-500 italic">No image link</div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Left Column (5 cols): Beautiful image */}
                            <div className="col-span-5 h-full relative flex items-center justify-center p-2 z-10">
                              {slide.imageLink ? (
                                <img
                                  src={slide.imageLink}
                                  alt={slide.titleLine1 || 'banner graphic'}
                                  referrerPolicy="no-referrer"
                                  className="max-h-[95%] max-w-full object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105"
                                />
                              ) : (
                                <div className="text-[10px] text-slate-500 italic">No image link</div>
                              )}
                            </div>

                            {/* Right Column (7 cols): Two lines of text */}
                            <div className="col-span-7 space-y-2 md:space-y-3 text-right z-10 py-4 pl-2 flex flex-col items-end justify-center">
                              <span className="inline-block px-1.5 py-0.5 bg-yellow-400 text-slate-950 text-[8px] font-mono font-black uppercase tracking-wider rounded">
                                EXCLUSIVE OFFER
                              </span>
                              <div className="space-y-1">
                                {slide.titleLine1 && (
                                  <h3 className={`font-black text-white uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none ${sizeClass}`}>
                                    {slide.titleLine1}
                                  </h3>
                                )}
                                {slide.titleLine2 && (
                                  <h3 className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight ${sizeClass}`}>
                                    {slide.titleLine2}
                                  </h3>
                                )}
                              </div>
                              {slide.subtitle && (
                                <p className="text-[9px] md:text-sm text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2 md:line-clamp-none font-medium">
                                  {slide.subtitle}
                                </p>
                              )}
                              {slide.offerMechanicsOneLine && (
                                <p 
                                  style={{ fontSize: slide.mechanicsFontSize ? `${slide.mechanicsFontSize}px` : undefined }}
                                  className="font-bold text-amber-300 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)] line-clamp-1 font-sans mt-0.5 tracking-wide uppercase leading-normal text-[10px]"
                                >
                                  ⚙️ Mechanics: {slide.offerMechanicsOneLine}
                                </p>
                              )}
                              {slide.promoCode && (
                                <div className="pt-0.5">
                                  <button 
                                    onClick={() => handleMainTabChange('promo')}
                                    className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[9px] uppercase rounded tracking-wider cursor-pointer shadow-md transition-all transform hover:scale-102"
                                  >
                                    CODE: {slide.promoCode}
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 p-5 md:p-8 flex items-center w-full h-full">
                        {/* Visual Glass filter over slide */}
                        <div className="absolute inset-0 bg-[#060a17]/50 backdrop-blur-[1px]"></div>

                        {/* Text Content overlay */}
                        <div className="relative z-10 w-full max-w-lg space-y-1.5 md:space-y-2">
                          <div className="inline-block px-2 py-0.5 bg-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded">
                            LOBBY EXCLUSIVE
                          </div>
                          <h3 className="text-base md:text-2xl font-black text-white leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {slide.title}
                          </h3>
                          <p className="text-[10px] md:text-xs text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {slide.subtitle}
                          </p>
                          
                          {slide.promoCode && (
                            <div className="pt-1.5">
                              <button 
                                onClick={() => handleMainTabChange('promo')}
                                className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[10px] uppercase rounded tracking-widest cursor-pointer shadow-sm transition-all"
                              >
                                CLAIM CODE: {slide.promoCode}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {/* Slider Dots indicators */}
            <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeBannerIdx === idx ? 'bg-yellow-400 w-4' : 'bg-white/40'
                  }`}
                ></button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Progressive Jackpots Ticker (Always exciting to view!) */}
        {currentViewTab === 'lobby' && (
          <div className="bg-[#0e1938] border border-yellow-500/20 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.06)]">
            <div className="flex min-w-0 items-center gap-2">
              <span className="p-1.5 bg-yellow-400/10 text-yellow-400 rounded-lg">
                <TrendingUp size={16} className="animate-bounce" />
              </span>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold font-mono tracking-widest block">{t.jackpotTitle}</span>
                <p className="text-xs text-slate-300 leading-snug">{t.jackpotSub}</p>
              </div>
            </div>
            
            {/* Pulsing visual ticker count */}
            <div className="w-full sm:w-auto bg-slate-950 px-3 sm:px-4 py-1.5 rounded-lg border border-blue-900/40 text-center">
              <span className="font-mono text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 tracking-wider">
                ৳{jackpotPoolValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Recent Winners Section (Animated rolling feed, clickable to launch games) */}
        {currentViewTab === 'lobby' && (
          <RecentWinners 
            games={games} 
            onPlayGame={launchGame} 
          />
        )}

        {/* 4. Display Core Routing Screens */}
        {currentViewTab === 'lobby' ? (
          
          // LOBBY VIEW BOARD
          <div className="space-y-4">
            
            {/* Category Slider Line */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin text-xs">
              {[
                { id: 'popular', label: t.catPopular, icon: '🔥' },
                { id: 'slots', label: t.catSlots, icon: '🎰' },
                { id: 'live', label: t.catLive, icon: '🎡' },
                { id: 'sports', label: t.catSports, icon: '⚽' },
                { id: 'fishing', label: t.catFishing, icon: '🦈' },
                { id: 'cards', label: t.catCards, icon: '♠️' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveLobbyCategory(cat.id as any);
                    setShowFavoritesOnly(false);
                    setShowRecentlyPlayedOnly(false);
                  }}
                  className={`py-2 px-4 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    activeLobbyCategory === cat.id && !showFavoritesOnly && !showRecentlyPlayedOnly
                      ? 'bg-yellow-400 text-slate-950 border-yellow-250 scale-102 shadow-md font-black'
                      : 'bg-[#101935] hover:bg-[#15234d] text-slate-300 border-blue-950'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick Filter Controls Drawer (Search, Favs, History toggles) */}
            <div className="bg-[#101935]/40 border border-blue-950 p-3 rounded-xl flex flex-col md:flex-row gap-3 items-center text-xs">
              
              {/* Dynamic search bar */}
              <div className="flex bg-[#060a17] rounded-lg border border-blue-900/80 p-2.5 items-center gap-2 w-full md:flex-1">
                <Search size={14} className="text-slate-500" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={gameSearchQuery}
                  onChange={(e) => setGameSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:outline-hidden text-yellow-300 w-full placeholder:text-slate-600 text-xs font-mono"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    setShowFavoritesOnly(prev => !prev);
                    setShowRecentlyPlayedOnly(false);
                  }}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    showFavoritesOnly 
                      ? 'bg-red-500/10 border-red-500 text-red-400 font-extrabold shadow-xs' 
                      : 'bg-transparent border-blue-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Heart size={14} className={showFavoritesOnly ? 'fill-red-400' : ''} />
                  {t.favoritesLabel} ({favoriteIds.length})
                </button>

                <button
                  onClick={() => {
                    setShowRecentlyPlayedOnly(prev => !prev);
                    setShowFavoritesOnly(false);
                  }}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all flex items-center justify-center gap-1 ${
                    showRecentlyPlayedOnly 
                      ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-extrabold shadow-xs' 
                      : 'bg-transparent border-blue-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.recentLabel} ({recentlyPlayedIds.length})
                </button>
              </div>
            </div>

            {/* Games grid lobby renderer */}
            {filteredGames.length === 0 ? (
              <div className="p-6 sm:p-12 text-center bg-[#101935]/30 rounded-xl border border-blue-950 space-y-2">
                <AlertCircle size={24} className="mx-auto text-yellow-400 animate-bounce" />
                <p className="text-xs text-slate-500">No games matched your query category, search text, or favorites logs.</p>
                <button
                  onClick={() => {
                    setActiveLobbyCategory('popular');
                    setGameSearchQuery('');
                    setShowFavoritesOnly(false);
                    setShowRecentlyPlayedOnly(false);
                  }}
                  className="px-3 py-1 bg-blue-950 text-xs text-blue-300 rounded border border-blue-900"
                >
                  Clear lobby filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(136px,1fr))] sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {filteredGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => launchGame(game)}
                    className="relative min-w-0 bg-linear-to-b from-[#101935] to-[#0a0f24] rounded-2xl overflow-hidden border border-blue-950 hover:border-yellow-400/40 cursor-pointer shadow-md group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,215,0,0.1)]"
                  >
                    
                    {/* Visual Art Box */}
                    <div className="aspect-[1.24/1] min-h-24 max-h-32 bg-[#090f23] relative flex items-center justify-center text-center p-3 overflow-hidden select-none">
                      {/* Ambient background blur circles */}
                      <div className="absolute w-20 h-20 rounded-full bg-blue-600/10 blur-xl"></div>
                      
                      {/* Symbol representation character */}
                      <span className="text-3xl sm:text-4xl filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)] z-10 font-sans transform group-hover:scale-115 transition-transform duration-300">
                        {(game.imageUrl && typeof game.imageUrl === 'string') ? game.imageUrl.split(' ')[0] : '🎮'}
                      </span>

                      {/* Overlap play button hover layer */}
                      <div className="absolute inset-0 bg-[#060a17]/75 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play size={18} className="fill-slate-950 ml-0.5" />
                        </div>
                      </div>

                      {/* Favorite mini badge toggler icon */}
                      <button
                        onClick={(e) => toggleFavoriteGame(game.id, e)}
                        className="absolute top-2.5 right-2.5 z-20 p-1 rounded-full bg-slate-950/80 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Heart 
                          size={13} 
                          className={favoriteIds.includes(game.id) ? 'fill-red-400 text-red-400' : ''} 
                        />
                      </button>

                      {/* Game provider small ribbon */}
                      <span className="absolute bottom-1.5 left-2 right-2 z-10 text-[7.5px] bg-slate-950/80 px-1.5 py-0.5 rounded border border-blue-950 text-slate-400 font-mono tracking-wider uppercase truncate">
                        {game.provider}
                      </span>
                    </div>

                    {/* Meta/Text line */}
                    <div className="p-2.5 sm:p-3 bg-[#0a0f24] border-t border-blue-950/80 space-y-1">
                      <div className="text-[11px] font-black uppercase text-slate-200 tracking-wide truncate">
                        {game.title}
                      </div>
                      <div className="flex flex-col min-[390px]:flex-row min-[390px]:justify-between min-[390px]:items-center gap-0.5 text-[8.5px] sm:text-[9px] text-slate-500 font-mono">
                        <span className="truncate">Plays: {(game.playsCount + (favoriteIds.includes(game.id) ? 1 : 0)).toLocaleString()}</span>
                        <span className="text-yellow-400 font-bold uppercase">DEMO PLAY</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* Active Promotions Section directly on the Home Page Lobby */}
            {promotions.length > 0 && (
              <div id="lobby_promotions_section" className="space-y-3 pt-2">
                <div className="flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-2 border-b border-blue-950/50 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🧧</span>
                    <h3 className="text-xs font-black uppercase text-yellow-400 tracking-wider font-sans">
                      {t.activePromoTitle}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleMainTabChange('promo')}
                    className="text-[10px] text-blue-400 font-bold hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    {t.seeMore} →
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {promotions.slice(0, 3).map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => handlePromoGridAction(p.promoCode)}
                      className="bg-linear-to-b from-[#101935] to-[#0a0f24] p-3 rounded-xl border border-blue-950 hover:border-yellow-400/40 cursor-pointer shadow-sm transition-all text-left flex flex-col justify-between min-h-[110px] group/promo"
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <span className="inline-block px-1.5 py-0.2 bg-[#431454] text-purple-200 text-[7px] font-black tracking-widest rounded font-mono uppercase">
                            {p.type}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-yellow-405 group-hover/promo:text-yellow-350">{p.promoCode}</span>
                        </div>
                        <h4 className="text-[11px] font-black uppercase tracking-tight text-white leading-tight line-clamp-1">{p.title}</h4>
                        <p className="text-[9px] text-slate-400 line-clamp-2 leading-tight font-sans">{p.description}</p>
                      </div>
                      <div className="mt-2 text-[8px] font-bold text-blue-400 flex items-center justify-between">
                        <span>Click to Claim</span>
                        <span className="group-hover/promo:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Information & Help Accordions in Bengali */}
            <InfoAccordions />

            {/* 7. Game Providers Section */}
            <GameProviders />



          </div>
        ) : currentViewTab === 'promo' ? (
          
          // PROMOTIONS VIEW GRID
          <div className="w-full min-w-0 space-y-4 text-white">
            <div className="text-center px-1">
              <h3 className="text-base sm:text-lg font-black tracking-widest uppercase text-yellow-400 leading-tight">{t.activePromoTitle}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">Maximize your deposits utilizing the bonus codes listed below. Rewards pay bonus points automatically</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {promotions.map((p) => (
                <div 
                  key={p.id}
                  className={`min-w-0 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between border relative min-h-44 sm:min-h-48 overflow-hidden select-none bg-radial to-slate-950 border-blue-950/80 shadow-md preserve-dark-bg-text ${p.imageUrl}`}
                >
                  <div className="min-w-0 space-y-2">
                    <span className="inline-block px-2.5 py-0.5 bg-yellow-400 text-slate-950 text-[9px] font-black tracking-wider rounded uppercase font-mono">
                      {p.type.toUpperCase()} BONUS
                    </span>
                    <h4 className="text-sm sm:text-base font-black uppercase tracking-wide text-white leading-tight break-words">{p.title}</h4>
                    <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-mono break-words">{p.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-900 flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center bg-slate-950/40 p-2 rounded-lg gap-2 text-xs">
                    <div className="min-w-0 w-full min-[430px]:w-auto">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Promotion Code</span>
                      <span className="block font-bold font-mono text-yellow-400 select-all break-all">{p.promoCode}</span>
                    </div>
                    
                    <button
                      onClick={() => handlePromoGridAction(p.promoCode)}
                      className="w-full min-[430px]:w-auto px-3 py-2 min-[430px]:py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[10px] uppercase rounded tracking-wider cursor-pointer"
                    >
                      CHALLENGE NOW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          
          // USER WALLET & DEPOSIT SYSTEMS
          <UserDashboard 
            userId={currentUser?.id || ''} 
            onBalanceChange={syncActiveUser}
            activeMenu={activeDashboardSubMenu}
            onSubPageChange={setActiveDashboardSubMenu}
            onLogout={handleLogout}
            currentLanguage={currentLanguage}
          />
        )}

      </main>

      {/* 5. Role-Based Floating Access Panels triggers */}
      <footer className="bg-[#0a0f24] border-t border-blue-950 px-4 py-3 text-center text-xs text-slate-500 hidden sm:block">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <p>© 2026 Golden Play. All Rights Reserved.</p>
          
          <div className="flex gap-2">
            {currentUser?.role === 'agent' && (
              <button
                onClick={() => setIsAgentOpen(true)}
                className="px-3.5 py-1 bg-yellow-500/10 hover:bg-yellow-950 border border-yellow-500/30 text-yellow-400 font-bold uppercase rounded text-[10px] tracking-wider cursor-pointer"
              >
                💎 Agent Desk
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* 6. IMMERSIVE BOTTOM NAV (Classic Mobile Game Look & Feel!) */}
      <nav id="bottom_navigation_bar" className="fixed bottom-0 left-0 right-0 z-45 bg-[#0a0f24] border-t border-blue-950 p-2 flex justify-around items-center sm:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
        
        {/* Lobby page trigger */}
        <button
          onClick={() => handleMainTabChange('lobby')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            currentViewTab === 'lobby' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 size={16} />
          <span>Lobby</span>
        </button>

        {/* Promo events trigger */}
        <button
          onClick={() => handleMainTabChange('promo')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            currentViewTab === 'promo' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift size={16} />
          <span>Bonus</span>
        </button>

        {/* Wallet trigger */}
        <button
          onClick={() => handleMainTabChange('wallet')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            currentViewTab === 'wallet' && activeDashboardSubMenu !== 'invite' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet2 size={16} />
          <span>Wallet</span>
        </button>

        {/* Affilites invitation trigger */}
        <button
          onClick={() => handleMainTabChange('referral')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            currentViewTab === 'wallet' && activeDashboardSubMenu === 'invite' ? 'text-yellow-400' : 'text-slate-400'
          }`}
        >
          <Users size={16} />
          <span>Affiliate</span>
        </button>

        {/* Dynamic Mobile Role indicators (Red for Admin, gold for Agent) */}
        {currentUser?.role === 'agent' && (
          <button
            onClick={() => setIsAgentOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] text-yellow-400 font-bold animate-pulse"
          >
            <Sparkles size={16} />
            <span>Agent</span>
          </button>
        )}
      </nav>

      </div> {/* CLOSE RIGHT MAIN CONTAINER (flex-1 flex flex-col) */}

      {/* ======================================= */}
      {/* 7. MODALS DRAWERS FLOATING DIALOGS      */}
      {/* ======================================= */}

      {/* VIP Bonus modal dashboard */}
      {isVipOpen && currentUser && (
        <VipBonusModal
          uid={currentUser.id}
          onBalanceChange={syncActiveUser}
          onClose={() => setIsVipOpen(false)}
          openAuth={() => setIsAuthOpen(true)}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Realtime support live chat */}
      {isSupportOpen && (
        <SupportChatWidget
          onClose={() => setIsSupportOpen(false)}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Mobile Download and claim app reward */}
      {isDownloadOpen && currentUser && (
        <AppDownloadModal
          uid={currentUser.id}
          onBalanceChange={syncActiveUser}
          onClose={() => setIsDownloadOpen(false)}
          openAuth={() => setIsAuthOpen(true)}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Interactive customer announcements/promos popup modal */}
      {showPromoPopup && popupAnnouncements.length > 0 && (
        <CustomerAnnouncementModal
          announcements={popupAnnouncements}
          onClose={() => setShowPromoPopup(false)}
        />
      )}

      {/* Personal center account popup */}
      {isPersonalCenterOpen && currentUser && currentWallet && (
        <PersonalCenterModal
          user={currentUser}
          wallet={currentWallet}
          avatarUrl={getProfileAvatarUrl(currentUser)}
          initialMenu={personalCenterInitialMenu}
          onClose={() => setIsPersonalCenterOpen(false)}
          onChangeAvatar={refreshCurrentAvatar}
          onLogout={handleLogout}
          onNavigate={routeToDashboard}
        />
      )}

      {/* Play Game Modal Overlays */}
      {activeGame && currentUser && (
        activeGame.id === 'g-mines-1' || activeGame.id.includes('mines') ? (
          <LuckyMinesDemo
            userId={currentUser.id}
            onBalanceChange={syncActiveUser}
            onClose={() => setActiveGame(null)}
            gameId={activeGame.id}
            gameTitle={activeGame.title}
            currentLanguage={currentLanguage}
          />
        ) : (
          <SlotMachineDemo
            userId={currentUser.id}
            onBalanceChange={syncActiveUser}
            onClose={() => setActiveGame(null)}
            gameId={activeGame.id}
            gameTitle={activeGame.title}
            currentLanguage={currentLanguage}
          />
        )
      )}

      {/* Auth Modal Sign in/Sign-up */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => {
            setIsAuthOpen(false);
            setInitialResetEmail('');
            setInitialResetOtp('');
            setInitialResetTab(undefined);
          }}
          onLoginSuccess={syncActiveUser}
          currentLanguage={currentLanguage}
          initialEmail={initialResetEmail}
          initialOtp={initialResetOtp}
          initialTab={initialResetTab}
        />
      )}

      {/* Admin Panel Modal Overlay */}
      {isAdminOpen && currentUser?.role === 'admin' && (
        <AdminPanel
          onBalanceChange={syncActiveUser}
          onGoHome={() => {
            handleMainTabChange('lobby');
            setIsAdminOpen(false);
            setIsAgentOpen(false);
            setIsMobileSidebarOpen(false);
          }}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* Agent Panel Modal Overlay */}
      {isAgentOpen && currentUser?.role === 'agent' && (
        <AgentPanel
          agentId={currentUser.id}
          onBalanceChange={syncActiveUser}
          onClose={() => setIsAgentOpen(false)}
        />
      )}

    </div>
  );
}
