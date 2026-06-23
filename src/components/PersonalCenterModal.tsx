/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardList,
  Crown,
  Gift,
  History,
  Lock,
  Mail,
  Pencil,
  Power,
  ReceiptText,
  ShieldCheck,
  Ticket,
  Trophy,
  UserCircle,
  Users,
  WalletCards,
  X,
  AlertCircle,
} from 'lucide-react';
import { db } from '../db/dummySupabase';
import { UserProfile, Wallet } from '../types';
import {
  getPaymentSetting,
  PAYMENT_SETTINGS_STORAGE_KEY,
  PAYMENT_SETTINGS_UPDATED_EVENT,
  PaymentSetting,
  refreshPaymentSetting,
} from '../lib/paymentSettings';

type DashboardMenu = 'profile' | 'deposit' | 'withdraw' | 'history' | 'invite' | 'alerts';

type PersonalInfo = {
  nickname: string;
  email: string;
  fullName: string;
  countryCode: string;
  phone: string;
};

type EWalletInfo = {
  walletType: 'Nagad' | 'BKash';
  walletAddress: string;
  transactionPassword: string;
  createdAt: string;
};

interface PersonalCenterModalProps {
  user: UserProfile;
  wallet: Wallet;
  avatarUrl: string;
  initialMenu?: DashboardMenu;
  onClose: () => void;
  onChangeAvatar: () => void;
  onLogout: () => void;
  onNavigate: (menu: DashboardMenu) => void;
}

const sideMenu = [
  { label: 'আমার অ্যাকাউন্ট', icon: UserCircle, menu: 'profile' as DashboardMenu },
  { label: 'ডিপোজিট', icon: Ticket, menu: 'deposit' as DashboardMenu },
  { label: 'উত্তোলন', icon: BadgeDollarSign, menu: 'withdraw' as DashboardMenu },
  { label: 'বেটিং রেকর্ড', icon: ClipboardList, menu: 'history' as DashboardMenu },
  { label: 'অ্যাকাউন্ট রেকর্ড', icon: ReceiptText, menu: 'history' as DashboardMenu },
  { label: 'লাভ ও ক্ষতি', icon: History, menu: 'history' as DashboardMenu },
  { label: 'পুরস্কার কেন্দ্র', icon: Trophy, menu: 'alerts' as DashboardMenu },
  { label: 'বন্ধুদের আমন্ত্রণ করুন', icon: Users, menu: 'invite' as DashboardMenu },
  { label: 'মিশন', icon: Gift, menu: 'alerts' as DashboardMenu, badge: '2' },
  { label: 'অন্তরঙ্গ বার্তা', icon: Mail, menu: 'alerts' as DashboardMenu },
];

const securityItems = [
  {
    title: 'ব্যক্তিগত তথ্য',
    description: 'আপনার অ্যাকাউন্ট নিরাপত্তা উন্নত করতে ব্যক্তিগত তথ্য পূরণ করুন।',
    icon: UserCircle,
    status: 'alert',
    color: 'from-amber-300 to-yellow-500',
  },
  {
    title: 'লগইন পাসওয়ার্ড',
    description: 'অক্ষর এবং সংখ্যার সমন্বয়ে শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।',
    icon: Lock,
    status: 'ok',
    color: 'from-cyan-300 to-teal-500',
  },
  {
    title: 'ই-ওয়ালেট বাঁধুন',
    description: 'উত্তোলনের জন্য আপনার পছন্দের ই-ওয়ালেট নম্বর যুক্ত করুন।',
    icon: WalletCards,
    status: 'alert',
    color: 'from-pink-400 to-fuchsia-500',
  },
  {
    title: 'লেনদেন পাসওয়ার্ড',
    description: 'লেনদেন অনুমোদনের জন্য আলাদা নিরাপত্তা পাসওয়ার্ড সেট করুন।',
    icon: ShieldCheck,
    status: 'alert',
    color: 'from-yellow-600 to-stone-500',
  },
  {
    title: 'নিরাপত্তা সেটিং',
    description: 'প্রশ্ন, পিন এবং লগইন সতর্কতা চালু করে অ্যাকাউন্ট সুরক্ষিত রাখুন।',
    icon: ShieldCheck,
    status: 'alert',
    color: 'from-violet-400 to-purple-600',
  },
];

const depositChannels = [
  { id: 'bkash', label: 'Bkash', color: 'bg-pink-500', logo: 'ব' },
  { id: 'nagad', label: 'NAGAD', color: 'bg-orange-500', logo: 'ন' },
] as const;

const depositProviders = ['TKPAY', '711TK', 'BD99PAY', 'HRPAY', 'D7PAY'];
const depositAmounts = [100, 200, 500, 1000, 3000, 5000, 10000, 20000];
const depositPromos = [
  {
    title: 'নতুন সদস্যদের প্রথম জমা বোনাস সর্বোচ্চ ৳৯,৯৯৯ (1/3)',
    subtitle: 'M71 নতুন সদস্যদের প্রথম জমা বোনাস সর্বোচ্চ ৳৯,৯৯৯',
    reward: '৳ 100.00',
    note: '*মনে রাখবেন: এই তথ্য যারা যাচাই করেননি, তাদের বোনাস প্রাপ্ত হবে না।',
    conditions: [
      { label: 'ই-ওয়ালেট বাঁধুন', action: 'সেট আপ করুন', done: false },
      { label: 'আপনার নাম সেট আপ করুন', action: 'সেট আপ করুন', done: false },
      { label: 'ফোন নম্বর সেট আপ করুন', done: true },
    ],
  },
  {
    title: 'দৈনিক প্রথম আমানত বোনাস ৫% (0/2)',
    subtitle: 'আজ থেকে, সকল নতুন ও পুরাতন সদস্যরা প্রতিদিনের প্রথম জমায় বোনাস পাবেন',
    reward: '৳ 200.00',
    note: '*প্রতিদিনের প্রথম সফল জমার পর এই বোনাস যাচাই করা হবে।',
    conditions: [
      { label: 'ই-ওয়ালেট বাঁধুন', action: 'সেট আপ করুন', done: false },
      { label: 'লেনদেন পাসওয়ার্ড সেট করুন', action: 'সেট আপ করুন', done: false },
    ],
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '২০২৬-০৩-১৯';
  return date.toLocaleDateString('bn-BD', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const getPersonalInfoKey = (userId: string) => `playportal_personal_info_${userId}`;
const getEWalletKey = (userId: string) => `playportal_ewallet_info_${userId}`;

const isPersonalInfoComplete = (info: PersonalInfo | null | undefined) => {
  return Boolean(info?.nickname?.trim() && info?.fullName?.trim() && info?.phone?.trim());
};

const readSavedPersonalInfo = (userId: string): PersonalInfo | null => {
  const saved = localStorage.getItem(getPersonalInfoKey(userId));
  if (!saved) return null;
  try {
    return JSON.parse(saved) as PersonalInfo;
  } catch {
    return null;
  }
};

const readSavedEWallet = (userId: string): EWalletInfo | null => {
  const saved = localStorage.getItem(getEWalletKey(userId));
  if (!saved) return null;
  try {
    return JSON.parse(saved) as EWalletInfo;
  } catch {
    return null;
  }
};

const isEWalletComplete = (info: EWalletInfo | null | undefined) => {
  return Boolean(info?.walletType && info?.walletAddress?.trim() && info?.transactionPassword?.trim());
};

const maskWalletAddress = (value: string) => {
  const clean = value.trim();
  if (clean.length <= 4) return clean;
  return `${'*'.repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
};

export default function PersonalCenterModal({
  user,
  wallet,
  avatarUrl,
  initialMenu = 'profile',
  onClose,
  onChangeAvatar,
  onLogout,
  onNavigate,
}: PersonalCenterModalProps) {
  const [activeMenu, setActiveMenu] = useState<DashboardMenu>(initialMenu);
  const [depositChannel, setDepositChannel] = useState<(typeof depositChannels)[number]['id']>('bkash');
  const [depositProvider, setDepositProvider] = useState<string>('TKPAY');
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [selectedPromo, setSelectedPromo] = useState<number | null>(null);
  const [depositFeedback, setDepositFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => {
    const saved = localStorage.getItem(getPersonalInfoKey(user.id));
    if (saved) {
      try {
        return JSON.parse(saved) as PersonalInfo;
      } catch {
        // Fall back to profile defaults below.
      }
    }
    return {
      nickname: user.username,
      email: user.email || '',
      fullName: '',
      countryCode: '+880',
      phone: user.phone || '',
    };
  });
  const [hasPersonalInfo, setHasPersonalInfo] = useState<boolean>(() => isPersonalInfoComplete(personalInfo));
  const [showPersonalInfoPopup, setShowPersonalInfoPopup] = useState<boolean>(false);
  const [personalInfoFeedback, setPersonalInfoFeedback] = useState<string>('');
  const [eWalletInfo, setEWalletInfo] = useState<EWalletInfo>(() => readSavedEWallet(user.id) || {
    walletType: 'Nagad',
    walletAddress: '',
    transactionPassword: '',
    createdAt: '',
  });
  const [hasEWallet, setHasEWallet] = useState<boolean>(() => isEWalletComplete(eWalletInfo));
  const [showEWalletPopup, setShowEWalletPopup] = useState<boolean>(false);
  const [eWalletFeedback, setEWalletFeedback] = useState<string>('');
  const [showPaymentPopup, setShowPaymentPopup] = useState<boolean>(false);
  const [paymentTrxId, setPaymentTrxId] = useState<string>('');
  const [paymentFeedback, setPaymentFeedback] = useState<string>('');
  const [paymentSettingsRevision, setPaymentSettingsRevision] = useState<number>(0);
  const [activePaymentSetting, setActivePaymentSetting] = useState<PaymentSetting>(() => getPaymentSetting(depositProvider, depositChannel));
  const pendingDeposit = Math.max(0, Math.round(wallet.totalDeposit * 0.02));
  const pendingWithdraw = Math.max(0, Math.round(wallet.totalWithdraw * 0.02));

  useEffect(() => {
    if (activeMenu === 'profile' && !hasPersonalInfo) {
      setShowPersonalInfoPopup(true);
    }
  }, [activeMenu, hasPersonalInfo]);

  useEffect(() => {
    const refreshPaymentSettings = () => setPaymentSettingsRevision(revision => revision + 1);
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === PAYMENT_SETTINGS_STORAGE_KEY) {
        refreshPaymentSettings();
      }
    };

    window.addEventListener(PAYMENT_SETTINGS_UPDATED_EVENT, refreshPaymentSettings);
    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(PAYMENT_SETTINGS_UPDATED_EVENT);
      channel.onmessage = refreshPaymentSettings;
    } catch {
      channel = null;
    }

    return () => {
      window.removeEventListener(PAYMENT_SETTINGS_UPDATED_EVENT, refreshPaymentSettings);
      window.removeEventListener('storage', handleStorage);
      channel?.close();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setActivePaymentSetting(getPaymentSetting(depositProvider, depositChannel));
    refreshPaymentSetting(depositProvider, depositChannel)
      .then((setting) => {
        if (!cancelled) setActivePaymentSetting(setting);
      })
      .catch(() => {
        if (!cancelled) setActivePaymentSetting(getPaymentSetting(depositProvider, depositChannel));
      });

    return () => {
      cancelled = true;
    };
  }, [depositProvider, depositChannel, paymentSettingsRevision]);

  useEffect(() => {
    if (!showPaymentPopup) return undefined;

    const refreshActivePaymentSetting = () => {
      setActivePaymentSetting(getPaymentSetting(depositProvider, depositChannel));
      refreshPaymentSetting(depositProvider, depositChannel)
        .then(setActivePaymentSetting)
        .catch(() => setActivePaymentSetting(getPaymentSetting(depositProvider, depositChannel)));
    };

    refreshActivePaymentSetting();
    const intervalId = window.setInterval(refreshActivePaymentSetting, 2000);
    return () => window.clearInterval(intervalId);
  }, [showPaymentPopup, depositProvider, depositChannel]);

  const goTo = (menu: DashboardMenu) => {
    if (menu === 'profile' || menu === 'deposit') {
      setActiveMenu(menu);
      setDepositFeedback(null);
      return;
    }
    onNavigate(menu);
  };

  const submitDeposit = () => {
    const amount = Number(depositAmount);
    const savedInfo = readSavedPersonalInfo(user.id);
    const infoForDeposit = isPersonalInfoComplete(savedInfo) ? savedInfo! : personalInfo;
    if (!isPersonalInfoComplete(infoForDeposit)) {
      setHasPersonalInfo(false);
      setShowPersonalInfoPopup(true);
      setDepositFeedback({ type: 'error', msg: 'ডিপোজিট করার আগে ব্যক্তিগত তথ্য পূরণ করুন।' });
      return;
    }
    setHasPersonalInfo(true);
    const savedWallet = readSavedEWallet(user.id);
    if (!isEWalletComplete(savedWallet)) {
      setHasEWallet(false);
      setShowEWalletPopup(true);
      setDepositFeedback({ type: 'error', msg: 'ডিপোজিট করার আগে ই-ওয়ালেট বাঁধুন।' });
      return;
    }
    setHasEWallet(true);
    if (!Number.isFinite(amount) || amount < 100) {
      setDepositFeedback({ type: 'error', msg: 'ন্যূনতম জমার পরিমাণ ৳100।' });
      return;
    }
    if (amount > 50000) {
      setDepositFeedback({ type: 'error', msg: 'সর্বোচ্চ জমার পরিমাণ ৳50,000।' });
      return;
    }

    setPaymentTrxId('');
    setPaymentFeedback('');
    setActivePaymentSetting(getPaymentSetting(depositProvider, depositChannel));
    refreshPaymentSetting(depositProvider, depositChannel)
      .then(setActivePaymentSetting)
      .catch(() => setActivePaymentSetting(getPaymentSetting(depositProvider, depositChannel)));
    setShowPaymentPopup(true);
  };

  const reloadActivePaymentSetting = () => {
    setActivePaymentSetting(getPaymentSetting(depositProvider, depositChannel));
    refreshPaymentSetting(depositProvider, depositChannel)
      .then((setting) => {
        setActivePaymentSetting(setting);
        setPaymentFeedback('Payment number reloaded from Supabase admin settings.');
        setTimeout(() => setPaymentFeedback(''), 1800);
      })
      .catch(() => {
        setPaymentFeedback('Could not reload from Supabase. Check payment_settings table/policies.');
        setTimeout(() => setPaymentFeedback(''), 2600);
      });
    setPaymentSettingsRevision(revision => revision + 1);
  };

  const confirmPaymentDeposit = () => {
    const amount = Number(depositAmount);
    const savedInfo = readSavedPersonalInfo(user.id);
    const infoForDeposit = isPersonalInfoComplete(savedInfo) ? savedInfo! : personalInfo;

    if (!paymentTrxId.trim()) {
      setPaymentFeedback('TrxID অবশ্যই পূরণ করতে হবে।');
      return;
    }

    db.submitDepositRequest(user.id, {
      amount,
      paymentMethod: `${depositChannel.toUpperCase()} Manual - ${depositProvider}`,
      accountName: infoForDeposit.fullName || infoForDeposit.nickname || user.username,
      accountNumber: `${infoForDeposit.countryCode} ${infoForDeposit.phone}`,
      refNo: paymentTrxId.trim(),
    });
    setDepositFeedback({ type: 'success', msg: `৳${amount.toLocaleString()} জমার আবেদন পাঠানো হয়েছে। Admin approval pending.` });
    setShowPaymentPopup(false);
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
    setPersonalInfoFeedback('');
  };

  const savePersonalInfo = () => {
    if (!personalInfo.nickname.trim() || !personalInfo.fullName.trim() || !personalInfo.phone.trim()) {
      setPersonalInfoFeedback('উপনাম, পূর্ণনাম এবং মোবাইল নম্বর পূরণ করুন।');
      return;
    }
    const nextInfo = {
      ...personalInfo,
      nickname: personalInfo.nickname.trim(),
      fullName: personalInfo.fullName.trim(),
      email: personalInfo.email.trim(),
      phone: personalInfo.phone.trim(),
    };
    localStorage.setItem(getPersonalInfoKey(user.id), JSON.stringify(nextInfo));
    setPersonalInfo(nextInfo);
    setHasPersonalInfo(true);
    setShowPersonalInfoPopup(false);
  };

  const updateEWalletInfo = (field: keyof EWalletInfo, value: string) => {
    setEWalletInfo(prev => ({ ...prev, [field]: value } as EWalletInfo));
    setEWalletFeedback('');
  };

  const saveEWalletInfo = () => {
    if (!eWalletInfo.walletAddress.trim() || !eWalletInfo.transactionPassword.trim()) {
      setEWalletFeedback('ওয়ালেট ঠিকানা এবং লেনদেন পাসওয়ার্ড পূরণ করুন।');
      return;
    }
    const nextInfo: EWalletInfo = {
      ...eWalletInfo,
      walletAddress: eWalletInfo.walletAddress.trim(),
      transactionPassword: eWalletInfo.transactionPassword.trim(),
      createdAt: eWalletInfo.createdAt || new Date().toISOString(),
    };
    localStorage.setItem(getEWalletKey(user.id), JSON.stringify(nextInfo));
    setEWalletInfo(nextInfo);
    setHasEWallet(true);
    setShowEWalletPopup(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-6">
      <button
        type="button"
        aria-label="Close personal center"
        onClick={onClose}
        className="fixed inset-0 cursor-default"
      />

      <section className="relative z-10 grid h-[min(650px,calc(100dvh-1.5rem))] w-[min(1320px,calc(100vw-1.5rem))] grid-cols-1 overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:h-[min(680px,calc(100dvh-4rem))] md:w-[min(86rem,calc(100vw-4rem))] md:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="max-h-[10.5rem] overflow-y-auto bg-[#30343d] text-white md:max-h-none md:min-h-full preserve-dark-bg-text">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-lg font-black leading-none sm:text-xl">ব্যক্তিগত কেন্দ্র</h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white md:hidden"
              aria-label="Close"
            >
              <X size={23} />
            </button>
          </div>

          <nav className="grid grid-cols-2 gap-1 overflow-y-auto px-2 py-2 sm:grid-cols-3 md:block md:max-h-none md:space-y-0.5 md:overflow-visible md:p-0">
            {sideMenu.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={`${item.label}-${item.menu}`}
                  type="button"
                  onClick={() => goTo(item.menu)}
                  className={`relative flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px] font-black leading-tight transition-colors sm:text-xs md:w-full md:gap-2.5 md:rounded-none md:px-4 md:py-2 ${
                    activeMenu === item.menu
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-inner'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                  <span className="min-w-0 break-words">{item.label}</span>
                  {item.badge && (
                    <span className="absolute -right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs text-white md:right-3">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="relative min-h-0 min-w-0 overflow-y-auto bg-white p-3 sm:p-4 lg:p-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 hidden h-10 w-10 place-items-center rounded-full text-[#0d2f49] hover:bg-slate-100 md:grid"
            aria-label="Close"
          >
            <X size={31} />
          </button>

          {activeMenu === 'deposit' ? (
            <DepositPanel
              channel={depositChannel}
              provider={depositProvider}
              amount={depositAmount}
              selectedPromo={selectedPromo}
              hasPersonalInfo={hasPersonalInfo}
              hasEWallet={hasEWallet}
              feedback={depositFeedback}
              onChannelChange={setDepositChannel}
              onProviderChange={setDepositProvider}
              onAmountChange={(value) => {
                setDepositAmount(value);
                setDepositFeedback(null);
              }}
              onPromoChange={setSelectedPromo}
              onPersonalInfoOpen={() => setShowPersonalInfoPopup(true)}
              onEWalletOpen={() => setShowEWalletPopup(true)}
              onSubmit={submitDeposit}
            />
          ) : (
          <div className="grid min-w-0 gap-3 pt-9 sm:gap-4 md:pt-5 lg:grid-cols-[minmax(230px,0.9fr)_minmax(245px,0.9fr)] xl:grid-cols-[0.88fr_0.92fr_1.02fr]">
            <section className="min-w-0 rounded-xl bg-gradient-to-b from-white to-slate-50 p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <img
                    src={avatarUrl}
                    alt={`${user.username} profile`}
                    className="h-16 w-16 rounded-full border-4 border-white bg-slate-100 object-cover shadow-xl sm:h-[4.5rem] sm:w-[4.5rem]"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={onChangeAvatar}
                    className="absolute -left-2 top-0 grid h-8 w-8 place-items-center rounded-full bg-yellow-400 text-slate-950 shadow-lg hover:bg-yellow-300"
                    title="Random profile picture"
                  >
                    <Pencil size={17} />
                  </button>
                </div>

                <div className="min-w-0 pt-2">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-slate-500 px-3 py-1 text-[10px] font-black text-white shadow-md">
                    <Crown size={13} />
                    VIP0
                  </div>
                  <h3 className="break-all text-lg font-black text-slate-700 sm:text-xl">{user.username}</h3>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">যোগদান করেছেন {formatDate(user.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="break-all text-xs font-black text-slate-500">{user.username}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="min-w-0 break-words text-2xl font-black text-slate-800 sm:text-3xl">৳ {wallet.balance.toLocaleString()}</p>
                  <div className="flex gap-2 text-slate-500">
                    <RefreshButton />
                    <EyeButton />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-slate-500">
                <button
                  type="button"
                  onClick={() => goTo('deposit')}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-100"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-500">
                    <ArrowUpCircle size={21} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black leading-snug text-slate-500">{pendingDeposit} জমা দেওয়া অনুরোধ প্রস্তুতি চলছে</span>
                    <span className="text-xs text-slate-400">{new Date().toLocaleDateString('bn-BD')}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => goTo('withdraw')}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-100"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-500">
                    <ArrowDownCircle size={21} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black leading-snug text-slate-500">{pendingWithdraw} উত্তোলন অনুরোধ প্রস্তুতি চলছে</span>
                    <span className="text-xs text-slate-400">{new Date().toLocaleDateString('bn-BD')}</span>
                  </span>
                </button>

                <div className="flex gap-4 rounded-xl p-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-500">
                    <ShieldCheck size={21} />
                  </span>
                  <p className="text-xs font-bold leading-relaxed text-slate-500">
                    শেষ লগইন সময় : {new Date().toLocaleString('bn-BD')}<br />
                    শেষ লগইন আইপি: 59.153.100.193
                  </p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-gradient-to-b from-rose-600 via-rose-500 to-red-400 text-white shadow-[0_18px_50px_rgba(225,29,72,0.28)] preserve-dark-bg-text">
              <div className="flex min-h-[17.5rem] flex-col items-center justify-center p-4 text-center sm:min-h-[19.5rem]">
                <div className="grid h-[8.5rem] w-[8.5rem] place-items-center rounded-full bg-white/20 shadow-[0_0_0_12px_rgba(255,255,255,0.08),0_0_0_24px_rgba(255,255,255,0.05)] sm:h-[9.5rem] sm:w-[9.5rem]">
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-rose-700 shadow-2xl sm:h-28 sm:w-28">
                    <div>
                      <p className="text-3xl font-black sm:text-4xl">নিম্ন</p>
                      <p className="mt-1 text-sm font-black">নিরাপত্তা শতকরা</p>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-base font-black sm:text-lg">স্কোর হল 14 শতাংশ</p>
                <p className="mt-2 text-sm font-bold sm:text-base">আপনার অ্যাকাউন্ট নিরাপত্তা স্তর হল নিম্ন</p>
              </div>

              <div className="bg-rose-100/70 px-3 py-3 text-center text-slate-700">
                <h4 className="mb-3 text-base font-black sm:text-lg">পরামর্শিত সেটিং</h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <QuickSecurityButton label="ব্যক্তিগত তথ্য" icon={UserCircle} color="bg-yellow-400 text-white" onClick={() => setShowPersonalInfoPopup(true)} />
                  <QuickSecurityButton label="ই-ওয়ালেট বাঁধুন" icon={WalletCards} color="bg-fuchsia-500 text-white" onClick={() => setShowEWalletPopup(true)} />
                  <QuickSecurityButton label="লেনদেন পাসওয়ার্ড" icon={ShieldCheck} color="bg-stone-500 text-white" onClick={() => goTo('profile')} />
                </div>
              </div>
            </section>

            <section className="min-w-0 space-y-2 rounded-xl bg-slate-50/70 p-2 lg:col-span-2 xl:col-span-1">
              {securityItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => item.title.includes('ব্যক্তিগত') ? setShowPersonalInfoPopup(true) : item.title.includes('ওয়ালেট') ? setShowEWalletPopup(true) : goTo('profile')}
                    className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white sm:gap-3"
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${item.color} text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] sm:h-12 sm:w-12`}>
                      <Icon size={24} />
                    </span>
                    <span className="min-w-0 pt-1">
                      <span className="flex min-w-0 items-start gap-2 text-sm font-black leading-tight text-slate-600 sm:text-base">
                        {item.title}
                        {item.status === 'ok' ? (
                          <CheckCircle2 size={22} className="shrink-0 text-green-500" />
                        ) : (
                          <AlertCircle size={22} className="shrink-0 text-red-500" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs font-bold leading-snug text-slate-400">{item.description}</span>
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-rose-50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-300 to-orange-400 text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] sm:h-12 sm:w-12">
                  <Power size={25} />
                </span>
                <span className="pt-1">
                  <span className="text-sm font-black text-slate-600 sm:text-base">লগআউট</span>
                  <span className="mt-1 block text-xs font-bold leading-relaxed text-slate-400 sm:text-sm">নিরাপদে লগআউট করুন</span>
                </span>
              </button>
            </section>
          </div>
          )}

          {showPersonalInfoPopup && (
            <PersonalInfoPopup
              user={user}
              avatarUrl={avatarUrl}
              info={personalInfo}
              feedback={personalInfoFeedback}
              onChange={updatePersonalInfo}
              onClose={() => setShowPersonalInfoPopup(false)}
              onSave={savePersonalInfo}
            />
          )}

          {showEWalletPopup && (
            <EWalletPopup
              info={eWalletInfo}
              feedback={eWalletFeedback}
              onChange={updateEWalletInfo}
              onClose={() => setShowEWalletPopup(false)}
              onSave={saveEWalletInfo}
            />
          )}

          {showPaymentPopup && (
            <PaymentInstructionPopup
              amount={Number(depositAmount)}
              provider={depositProvider}
              channel={depositChannel}
              setting={activePaymentSetting}
              trxId={paymentTrxId}
              feedback={paymentFeedback}
              onTrxIdChange={(value) => {
                setPaymentTrxId(value);
                setPaymentFeedback('');
              }}
              onReloadSetting={reloadActivePaymentSetting}
              onClose={() => setShowPaymentPopup(false)}
              onConfirm={confirmPaymentDeposit}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function RefreshButton() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100">
      <History size={19} />
    </span>
  );
}

function EyeButton() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100">
      <UserCircle size={19} />
    </span>
  );
}

function PersonalInfoPopup({
  user,
  avatarUrl,
  info,
  feedback,
  onChange,
  onClose,
  onSave,
}: {
  user: UserProfile;
  avatarUrl: string;
  info: PersonalInfo;
  feedback: string;
  onChange: (field: keyof PersonalInfo, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex justify-end overflow-hidden bg-black/45">
      <button
        type="button"
        aria-label="Close personal information popup"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section className="relative z-10 flex h-full w-full flex-col rounded-l-2xl bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.3)] sm:w-[min(44rem,58%)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute -left-4 top-3 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white shadow-lg"
          aria-label="Close personal information"
        >
          <X size={18} />
        </button>

        <header className="flex shrink-0 items-center gap-2 px-6 py-5">
          <span className="h-5 w-1.5 rounded-full bg-green-500" />
          <h3 className="text-base font-black text-slate-700">ব্যক্তিগত তথ্য</h3>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-5 flex items-center gap-5">
            <img
              src={avatarUrl}
              alt={`${user.username} profile`}
              className="h-20 w-20 rounded-full bg-slate-100 object-cover shadow-lg"
              referrerPolicy="no-referrer"
            />
            <p className="text-base font-bold text-slate-500">{user.username}</p>
          </div>

          <div className="space-y-4">
            <FormRow label="উপনাম:">
              <input
                value={info.nickname}
                onChange={(event) => onChange('nickname', event.target.value)}
                placeholder="আপনার ডাকনাম পূরণ করুন"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 shadow-inner outline-none focus:border-red-300 focus:bg-white"
              />
            </FormRow>

            <FormRow label="ইমেইল:">
              <input
                value={info.email}
                onChange={(event) => onChange('email', event.target.value)}
                placeholder="ইমেইল"
                type="email"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 shadow-inner outline-none focus:border-red-300 focus:bg-white"
              />
            </FormRow>

            <FormRow label="পূর্ণনাম:">
              <div className="space-y-1">
                <input
                  value={info.fullName}
                  onChange={(event) => onChange('fullName', event.target.value)}
                  placeholder="পূর্ণ নাম"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 shadow-inner outline-none focus:border-red-300 focus:bg-white"
                />
                <p className="text-sm font-black leading-snug text-red-500">
                  আপনার আপলোড করা জাতীয় পরিচয়পত্র সাথে সামঞ্জস্যপূর্ণ নামটি পূরণ করতে ভুলবেন না, অন্যথায় প্রত্যাহার ব্যর্থ হতে পারে।
                </p>
              </div>
            </FormRow>

            <FormRow label="মোবাইল নম্বর:">
              <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-inner">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-green-600 text-xs font-black text-red-500">●</span>
                  <select
                    value={info.countryCode}
                    onChange={(event) => onChange('countryCode', event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-black text-slate-500 outline-none"
                  >
                    <option value="+880">+880</option>
                    <option value="+91">+91</option>
                    <option value="+63">+63</option>
                  </select>
                </label>
                <input
                  value={info.phone}
                  onChange={(event) => onChange('phone', event.target.value.replace(/[^\d*]/g, ''))}
                  placeholder="মোবাইল নম্বর"
                  inputMode="tel"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 shadow-inner outline-none focus:border-red-300 focus:bg-white"
                />
              </div>
            </FormRow>
          </div>

          {feedback && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
              {feedback}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-red-500 px-8 py-3 text-sm font-black text-white shadow-lg hover:bg-red-600"
          >
            জমা দিন
          </button>
        </footer>
      </section>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start">
      <label className="pt-2 text-sm font-black text-slate-500">{label}</label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function EWalletPopup({
  info,
  feedback,
  onChange,
  onClose,
  onSave,
}: {
  info: EWalletInfo;
  feedback: string;
  onChange: (field: keyof EWalletInfo, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const savedWallet = isEWalletComplete(info);

  return (
    <div className="absolute inset-0 z-20 flex overflow-hidden bg-black/45">
      <button
        type="button"
        aria-label="Close e-wallet popup"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section className="relative z-10 grid h-full w-full grid-cols-1 overflow-hidden rounded-l-2xl bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.3)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-red-500 text-white shadow-lg"
          aria-label="Close e-wallet"
        >
          <X size={19} />
        </button>

        <div className="min-h-0 overflow-y-auto border-b border-slate-200 px-6 pb-24 pt-12 lg:border-b-0 lg:border-r">
          <h3 className="mb-8 flex items-center gap-3 text-xl font-black text-slate-600">
            <span className="h-7 w-1.5 rounded-full bg-green-500" />
            ই-ওয়ালেট বাঁধুন
          </h3>

          <div className="space-y-6">
            <FormRow label="ই-ওয়ালেট:">
              <label className="flex h-12 w-full max-w-sm items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-lg font-bold text-slate-900 shadow-inner">
                <span>E wallet</span>
                <select
                  value="E wallet"
                  disabled
                  className="w-8 bg-transparent text-slate-500 outline-none"
                  aria-label="Wallet group"
                >
                  <option>E wallet</option>
                </select>
              </label>
            </FormRow>

            <FormRow label="কার্ডের নাম:">
              <input
                value={info.walletAddress ? `${info.walletAddress.slice(0, 1)}********` : ''}
                readOnly
                placeholder="K********"
                className="h-12 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-400 shadow-inner outline-none"
              />
            </FormRow>

            <div className="rounded-xl border border-slate-300 p-4">
              <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <p className="pt-3 text-base font-black text-slate-500">ই-ওয়ালেট প্রকার:</p>
                <div className="space-y-3">
                  {(['Nagad', 'BKash'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onChange('walletType', type)}
                      className={`h-14 w-full max-w-sm rounded-lg border text-base font-bold transition-all ${
                        info.walletType === type
                          ? 'border-red-400 bg-red-50 text-red-500'
                          : 'border-slate-200 bg-white text-slate-400 hover:border-red-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <p className="pt-3 text-base font-black text-slate-500">ওয়ালেট ঠিকানা:</p>
                <input
                  value={info.walletAddress}
                  onChange={(event) => onChange('walletAddress', event.target.value.replace(/[^\d]/g, ''))}
                  placeholder={`অনুগ্রহ করে ${info.walletType} অ্যাকাউন্ট নম্বর পূরণ করুন`}
                  inputMode="numeric"
                  className="h-12 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-700 shadow-inner outline-none focus:border-red-300 focus:bg-white"
                />
              </div>
            </div>

            <FormRow label="লেনদেন পাসওয়ার্ড:">
              <input
                value={info.transactionPassword}
                onChange={(event) => onChange('transactionPassword', event.target.value)}
                placeholder="লেনদেন পাসওয়ার্ড পূরণ করুন"
                type="password"
                className="h-12 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-700 shadow-inner outline-none focus:border-red-300 focus:bg-white"
              />
            </FormRow>

            {feedback && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                {feedback}
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-8">
          <h3 className="mb-8 flex items-center gap-3 text-xl font-black text-slate-600">
            <span className="h-7 w-1.5 rounded-full bg-red-500" />
            নিবন্ধিত ই-ওয়ালেট <span className="text-slate-400">(1/4)</span>
          </h3>

          {savedWallet ? (
            <div className="max-w-md rounded-2xl bg-gradient-to-r from-orange-100 to-amber-50 p-4 shadow-[0_18px_40px_rgba(251,146,60,0.18)]">
              <div className="flex items-center gap-4">
                <span className={`grid h-20 w-28 shrink-0 place-items-center rounded-xl text-2xl font-black text-white ${info.walletType === 'Nagad' ? 'bg-orange-500' : 'bg-pink-500'}`}>
                  {info.walletType === 'Nagad' ? 'নগদ' : 'bKash'}
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-black text-slate-700">{info.walletType}</p>
                  <p className="mt-1 text-lg font-bold text-slate-500">{maskWalletAddress(info.walletAddress)}</p>
                  <p className="mt-3 text-sm font-bold text-slate-400">
                    {info.createdAt ? new Date(info.createdAt).toLocaleString('bn-BD') : new Date().toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
              এখনো কোনো ই-ওয়ালেট যোগ করা হয়নি।
            </div>
          )}
        </div>

        <footer className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-7 py-4 backdrop-blur lg:right-auto lg:w-1/2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-red-500 px-8 py-3 text-sm font-black text-white shadow-lg hover:bg-red-600 disabled:bg-slate-300"
          >
            জমা দিন
          </button>
        </footer>
      </section>
    </div>
  );
}

function PaymentInstructionPopup({
  amount,
  provider,
  channel,
  setting,
  trxId,
  feedback,
  onTrxIdChange,
  onReloadSetting,
  onClose,
  onConfirm,
}: {
  amount: number;
  provider: string;
  channel: string;
  setting: PaymentSetting;
  trxId: string;
  feedback: string;
  onTrxIdChange: (value: string) => void;
  onReloadSetting: () => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(setting.walletNumber);
    } catch {
      // Clipboard may be blocked in some browser contexts; the number remains visible.
    }
  };

  const brandColor = channel === 'bkash' ? 'bg-[#cf00a8]' : 'bg-[#f15a24]';
  const brandLabel = channel === 'bkash' ? 'bKash' : 'Nagad';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-black/45 p-3">
      <button
        type="button"
        aria-label="Close payment instruction"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section className="relative z-10 flex h-[min(620px,calc(100%-1rem))] w-[min(58rem,calc(100%-1rem))] flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        <header className="shrink-0 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-red-500" />
              <span className="h-4 w-4 rounded-full bg-yellow-400" />
              <span className="h-4 w-4 rounded-full bg-green-500" />
              <h3 className="ml-3 text-base font-black text-slate-600">{provider} Payment Page</h3>
            </div>
            <button type="button" onClick={onClose} className="text-slate-600 hover:text-red-500">
              <X size={30} />
            </button>
          </div>
          <div className="border-t border-slate-200 bg-[#f0f0f4] px-5 py-3 text-sm font-bold text-slate-600">
            {setting.domain}?trackingNumber={crypto.randomUUID?.() || `manual-${Date.now()}`}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="bg-emerald-700 px-6 py-4 text-white sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-black">BDT {amount.toLocaleString()}</p>
                <p className="mt-2 text-xl font-black">{setting.warning}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black"><span className="rounded bg-white px-2 text-emerald-700">PAY</span> SERVICE</p>
                <p className="mt-2 inline-flex overflow-hidden rounded text-xs font-black">
                  <span className="bg-white px-3 py-1 text-slate-700">EN</span>
                  <span className="bg-slate-300 px-3 py-1 text-slate-700">বাং</span>
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <p className="mb-4 text-xl font-black leading-snug text-red-500">
              আপনি যদি টাকার পরিমাণ পরিবর্তন করেন (BDT {amount.toLocaleString()}), আপনি ক্রেডিট পেতে সক্ষম হবেন না।
            </p>

            <div className={`mb-2 flex items-center gap-4 rounded-lg ${brandColor} p-3 text-white`}>
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-sm font-black text-slate-700 shadow">
                {brandLabel}
              </span>
              <span className="text-xl font-black">{setting.title}</span>
            </div>

            <label className="block text-lg font-black text-slate-900">Wallet No<span className="text-red-500">*</span></label>
            <p className="mt-1 text-base font-bold text-slate-700">{setting.instructions}</p>
            <div className="mt-2 flex flex-col gap-3 rounded bg-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-lg font-bold tracking-wide text-slate-700">{setting.walletNumber}</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onReloadSetting} className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-black text-blue-700">
                  RELOAD NUMBER
                </button>
                <button type="button" onClick={copyWallet} className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-black text-emerald-700">
                  COPY
                </button>
              </div>
            </div>

            <label className="mt-4 block text-lg font-black text-slate-900">
              ক্যাশআউটের TrxID নাম্বারটি লিখুন<span className="text-red-500">(প্রয়োজন)</span>
            </label>
            <input
              value={trxId}
              onChange={(event) => onTrxIdChange(event.target.value)}
              placeholder="TrxID অবশ্যই পূরণ করতে হবে!"
              className="mt-3 h-14 w-full rounded-lg border-2 border-red-500 px-4 text-base font-bold text-slate-700 outline-none focus:bg-red-50"
            />

            {feedback && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                {feedback}
              </div>
            )}

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-xl border-2 border-slate-800 px-16 py-3 text-lg font-black text-slate-900 hover:bg-slate-900 hover:text-white"
              >
                নিশ্চিত
              </button>
            </div>

            <div className="mt-6">
              <p className="text-base font-black text-slate-900">সতর্কতা:</p>
              <p className="mt-2 text-sm font-black text-red-500">লেনদেন আইডি সঠিকভাবে পূরণ করতে হবে, অন্যথায় স্কোর ব্যর্থ হবে !!</p>
              <p className="mt-1 text-sm font-bold leading-relaxed text-slate-400">
                অনুগ্রহ করে নিশ্চিত হয়ে নিন যে আপনি {brandLabel} deposit ওয়ালেট নাম্বারে ক্যাশ আউট করছেন।
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DepositPanel({
  channel,
  provider,
  amount,
  selectedPromo,
  hasPersonalInfo,
  hasEWallet,
  feedback,
  onChannelChange,
  onProviderChange,
  onAmountChange,
  onPromoChange,
  onPersonalInfoOpen,
  onEWalletOpen,
  onSubmit,
}: {
  channel: (typeof depositChannels)[number]['id'];
  provider: string;
  amount: string;
  selectedPromo: number | null;
  hasPersonalInfo: boolean;
  hasEWallet: boolean;
  feedback: { type: 'success' | 'error'; msg: string } | null;
  onChannelChange: (channel: (typeof depositChannels)[number]['id']) => void;
  onProviderChange: (provider: string) => void;
  onAmountChange: (amount: string) => void;
  onPromoChange: (index: number | null) => void;
  onPersonalInfoOpen: () => void;
  onEWalletOpen: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="grid h-full min-h-0 min-w-0 gap-0 pt-0 md:grid-cols-[17rem_minmax(0,1fr)]">
      <section className="border-b border-slate-200 bg-slate-50 p-3 md:border-b-0 md:border-r">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          {depositChannels.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChannelChange(item.id)}
              className={`relative flex min-h-20 items-center gap-3 rounded-lg border bg-white p-3 text-left shadow-sm transition-all ${
                channel === item.id
                  ? 'border-red-400 ring-1 ring-red-400'
                  : 'border-slate-200 hover:border-red-200'
              }`}
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${item.color} text-lg font-black text-white`}>
                {item.logo}
              </span>
              <span className="text-base font-bold text-slate-500">{item.label}</span>
              {channel === item.id && (
                <span className="absolute right-0 top-0 rounded-bl-xl rounded-tr-lg bg-orange-400 px-2 py-1 text-white">
                  <CheckCircle2 size={15} />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="relative flex min-h-0 flex-col overflow-hidden bg-white">
        <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-base font-black text-slate-800">
            <span className="h-5 w-1.5 rounded-full bg-green-500" />
            জমার তথ্য
          </h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-full border-2 border-indigo-200 px-3 py-1.5 text-xs font-black text-indigo-500">
              জমা রেকর্ড
            </button>
            <button type="button" className="rounded-full border-2 border-indigo-200 px-3 py-1.5 text-xs font-black text-indigo-500">
              জমা করার উপায়?
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-20">
          <div className="rounded-xl border border-red-100 bg-orange-50 px-4 py-3 text-sm font-bold leading-relaxed text-red-500">
            এটি {channel.toUpperCase()} পেমেন্ট চ্যানেল, অনুগ্রহ করে শুধুমাত্র {channel.toUpperCase()} ট্রান্সফার ব্যবহার করুন, অন্যথায় ব্যালেন্স সফলভাবে যোগ করা সম্ভব হবে না।
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {depositProviders.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => onProviderChange(item)}
                className={`relative min-w-24 rounded-lg border px-4 py-3 text-left text-sm font-black transition-all ${
                  provider === item
                    ? 'border-red-400 text-slate-600 ring-1 ring-red-400'
                    : 'border-slate-200 text-slate-400 hover:border-red-200'
                }`}
              >
                <span className="absolute -left-0.5 -top-0.5 rounded-br-lg rounded-tl-lg bg-orange-400 px-1.5 py-1 text-white">
                  <CheckCircle2 size={13} />
                </span>
                <span className="pl-3">{item}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg bg-slate-700 px-4 py-3 text-white shadow-md">
            <AlertCircle size={22} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-sm font-bold leading-relaxed">
              সতর্ক: আপনার জমা সফলভাবে সম্পন্ন করার জন্য অনুগ্রহ করে সঠিক ওয়ালেট ব্যবহার করে সঠিক ডিপোজিট অর্ডারের পরিমাণ স্থানান্তর করুন।
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-slate-700">জমার পরিমাণ:</label>
            <div className="flex flex-wrap gap-2">
              {depositAmounts.map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onAmountChange(String(value))}
                  className={`min-w-20 rounded-lg border px-4 py-2.5 text-sm font-bold transition-all ${
                    Number(amount) === value
                      ? 'border-red-400 bg-red-50 text-red-500'
                      : 'border-red-100 text-slate-500 hover:border-red-300'
                  }`}
                >
                  {value.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              value={amount}
              onChange={(e) => onAmountChange(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="জমার পরিমাণ"
              className="mt-3 w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-300 focus:bg-white"
            />
            <p className="mt-3 text-sm font-black text-red-500">জমা সীমা: ৳ 100 - ৳ 50,000</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
            <p className="text-sm font-black text-slate-700">প্রচার নির্বাচন করুন:</p>
            <div className="space-y-3">
              {depositPromos.map((promo, index) => (
                <div
                  key={promo.title}
                  className={`overflow-hidden rounded-xl border transition-all ${
                    selectedPromo === index
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50 opacity-75 hover:opacity-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onPromoChange(selectedPromo === index ? null : index)}
                    className="flex w-full items-start gap-3 p-3 text-left"
                  >
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selectedPromo === index ? 'border-red-400 bg-red-400' : 'border-slate-300 bg-white'}`}>
                      {selectedPromo === index && <CheckCircle2 size={16} className="text-white" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-slate-600">{promo.title}</span>
                      <span className="block text-xs font-bold text-slate-400">{promo.subtitle}</span>
                    </span>
                    <span className={`shrink-0 text-sm font-black ${selectedPromo === index ? 'text-red-500' : 'text-slate-400'}`}>≥ {promo.reward}</span>
                  </button>

                  {selectedPromo === index && (
                    <div className="mx-3 mb-3 border-t border-red-200 pt-3">
                      <p className="mb-3 text-sm font-bold text-slate-500">{promo.note}</p>
                      <div className="space-y-3">
                        {promo.conditions.map(condition => {
                          const isPersonalCondition = condition.label.includes('নাম') || condition.label.includes('ফোন');
                          const isWalletCondition = condition.label.includes('ওয়ালেট');
                          const isDone = condition.done || (isPersonalCondition && hasPersonalInfo) || (isWalletCondition && hasEWallet);
                          return (
                            <div
                              key={condition.label}
                              className={`relative flex min-h-14 items-center justify-between gap-3 overflow-hidden rounded-lg px-4 py-3 ${
                                isDone ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                              }`}
                            >
                              <span className="relative z-10 text-sm font-black sm:text-base">{condition.label}</span>
                              {isDone ? (
                                <CheckCircle2 size={48} className="absolute right-8 text-green-300/80" />
                              ) : (
                                <button
                                  type="button"
                                  onClick={isWalletCondition ? onEWalletOpen : isPersonalCondition ? onPersonalInfoOpen : undefined}
                                  className="relative z-10 inline-flex shrink-0 items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white hover:bg-red-600"
                                >
                                  {condition.action}
                                  <ArrowRight size={16} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {feedback && (
            <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-black ${
              feedback.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border border-red-200 bg-red-50 text-red-600'
            }`}>
              {feedback.msg}
            </div>
          )}
        </div>

        <footer className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-full bg-red-500 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-red-600"
          >
            জমার জন্য আবেদন করুন
          </button>
        </footer>
      </section>
    </div>
  );
}

function QuickSecurityButton({
  label,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="min-w-0 rounded-xl p-2 hover:bg-white/45">
      <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full shadow-lg ${color}`}>
        <Icon size={28} />
      </span>
      <span className="mt-2 block text-xs font-black leading-tight text-slate-700">{label}</span>
    </button>
  );
}
