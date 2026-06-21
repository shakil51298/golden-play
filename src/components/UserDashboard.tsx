/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../db/dummySupabase';
import { UserProfile, Wallet, Transaction, PortalNotification } from '../types';
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, History, Share2, Clipboard, Bell, Shield, User, Check, AlertCircle, Copy } from 'lucide-react';

interface UserDashboardProps {
  userId: string;
  onBalanceChange: () => void;
  activeMenu: 'profile' | 'deposit' | 'withdraw' | 'history' | 'invite' | 'alerts';
  onSubPageChange: (menu: 'profile' | 'deposit' | 'withdraw' | 'history' | 'invite' | 'alerts') => void;
  onLogout?: () => void;
  currentLanguage?: string;
}

export default function UserDashboard({ userId, onBalanceChange, activeMenu, onSubPageChange, onLogout, currentLanguage }: UserDashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  
  const currentLang = currentLanguage || 'en';
  const t = {
    en: {
      profile: 'Member Profile',
      deposit: 'Deposit Funds',
      withdraw: 'Withdraw Cashout',
      history: 'Transaction History',
      invite: 'Affiliate Program',
      alerts: 'System alerts',
      username: 'Account UID',
      phone: 'Register Number',
      vipLevel: 'VIP Tier Class',
      balance: 'Available balance',
      totalDeposit: 'Accrued Deposits',
      totalWithdraw: 'Accrued Withdrawals',
      depositFormHeader: 'Initiate Manual Payment Deposit',
      depositLabel: 'Deposit Amount (৳)',
      methodLabel: 'Select Payment Method',
      accName: 'Sender Account Name',
      accNumber: 'Sender Account/Wallet Number',
      refPlaceholder: 'Manual Transaction TXID/Ref...',
      submitDeposit: 'Submit Deposit Ticket',
      withdrawFormHeader: 'Initiate Cashout Withdrawal Request',
      withdrawLabel: 'Withdrawal Amount (৳)',
      withdrawAccountName: 'Receiver Account Name',
      withdrawAccountNumber: 'Receiver Phone/Wallet Number',
      usdtWalletPlaceholder: 'USDT TRC20 Wallet Address...',
      submitWithdraw: 'Request Cashout Ticket',
      commissionHeader: 'VIP Invite & Earn commissions',
      commissionSub: 'Introduce active wagering players to earn 10% cash dynamic match',
      refCode: 'Your Refer code',
      copylink: 'Copy Team Invitation Links',
      recentTransactions: 'Recent Transactions Log Ledger',
      date: 'Date & Time',
      type: 'Mode',
      amount: 'Amount',
      status: 'Status',
      noAlerts: 'No critical messages or promotions found at this moment'
    },
    bn: {
      profile: 'সদস্য প্রোফাইল সামগ্রী',
      deposit: 'টাকা ডিপোজিটের মাধ্যম',
      withdraw: 'টাকা উত্তোলনের মাধ্যম',
      history: 'লেনদেন বিবরণ তালিকা',
      invite: 'অ্যাফিলিয়েট রেফার প্রোগ্রাম',
      alerts: 'সিস্টেম এলার্ট এবং তথ্য',
      username: 'ইউজার অ্যাকাউন্ট আইডি',
      phone: 'নিবন্ধিত ফোন নম্বর',
      vipLevel: 'ভিআইপি মেম্বারশিপ লেভেল',
      balance: 'বর্তমান মূল ব্যালেন্স',
      totalDeposit: 'সর্বমোট ডিপোজিটের পরিমাণ',
      totalWithdraw: 'সর্বমোট উত্তোলনের পরিমাণ',
      depositFormHeader: 'ম্যানুয়াল রিচার্জ বা ডিপোজিট করুন',
      depositLabel: 'ডিপোজিটের পরিমাণ (৳)',
      methodLabel: 'পেমেন্ট গেটওয়ে নির্বাচন করুন',
      accName: 'প্রেরক অ্যাকাউন্টের নাম',
      accNumber: 'প্রেরক ওয়ালেট বা ফোন নম্বর',
      refPlaceholder: 'ট্যাক্স আইডি (TXID / রেফারেন্স নম্বর)...',
      submitDeposit: 'ডিপোজিট আবেদন জমা দিন',
      withdrawFormHeader: 'টাকা উত্তোলনের আবেদন করুন',
      withdrawLabel: 'উত্তোলনের পরিমাণ (৳)',
      withdrawAccountName: 'গ্রাহক অ্যাকাউন্টের নাম',
      withdrawAccountNumber: 'গ্রাহক ওয়ালেট বা ফোন নম্বর',
      usdtWalletPlaceholder: 'ইউএসডিটি ওয়ালেট অ্যাড্রেস (TRC20)...',
      submitWithdraw: 'উত্তোলন আবেদন জমা দিন',
      commissionHeader: 'ভিআইপি রেফারেল ও টিম কমিশন ডেক্স',
      commissionSub: 'আপনার বন্ধুদের আমন্ত্রণ জানিয়ে ১০% পর্যন্ত ক্যাশব্যাক ম্যাচ উপার্জন করুন',
      refCode: 'আপনার রেফারেল কোড',
      copylink: 'আমন্ত্রণ লিঙ্ক কপি করুন',
      recentTransactions: 'লেনদেনের বিস্তারিত ইতিহাস',
      date: 'তারিখ ও সময়',
      type: 'ধরন',
      amount: 'পরিমাণ',
      status: 'স্ট্যাটাস',
      noAlerts: 'এই মুহূর্তে কোনো নতুন গুরুত্বপূর্ণ নোটিফিকেশন পাওয়া যায়নি।'
    },
    hi: {
      profile: 'सदस्य प्रोफ़ाइल',
      deposit: 'फंड जमा करें',
      withdraw: 'निकासी अनुरोध',
      history: 'लेनदेन इतिहास',
      invite: 'एफ़िलिएट पार्टनर कार्यक्रम',
      alerts: 'सिस्टम संदेश',
      username: 'सदस्य यूआईडी',
      phone: 'पंजीकृत मोबाइल नंबर',
      vipLevel: 'वीआईपी रैंक',
      balance: 'उपलब्ध शेष राशि',
      totalDeposit: 'कुल संचित जमा',
      totalWithdraw: 'कुल संचित निकासी',
      depositFormHeader: 'मैन्युअल भुगतान जमा शुरू करें',
      depositLabel: 'जमा राशि (৳)',
      methodLabel: 'भुगतान विकल्प चुनें',
      accName: 'प्रेषक का नाम',
      accNumber: 'प्रेषक नंबर / मोबाइल वॉलेट नंबर',
      refPlaceholder: 'ट्रांजेक्शन आईडी (TXID/संदर्भ संख्या)...',
      submitDeposit: 'जमा अनुरोध भेजें',
      withdrawFormHeader: 'निकासी अनुरोध दर्ज करें',
      withdrawLabel: 'निकासी राशि (৳)',
      withdrawAccountName: 'प्राप्तकर्ता का नाम',
      withdrawAccountNumber: 'प्राप्तकर्ता का नंबर / मोबाइल वॉलेट',
      usdtWalletPlaceholder: 'USDT TRC20 वॉलेट पता...',
      submitWithdraw: 'निकासी अनुरोध दर्ज करें',
      commissionHeader: 'वीआईपी रेफरल एवं टीम कमीशन टीम',
      commissionSub: 'सक्रिय खिलाड़ियों को आमंत्रित करें और १०% तक कैशबैक अर्जित करें',
      refCode: 'आपका रेफरल कोड',
      copylink: 'आमंत्रण लिंक कॉपी करें',
      recentTransactions: 'हाल के वित्तीय रिकॉर्ड',
      date: 'दिनांक और समय',
      type: 'प्रकार',
      amount: 'मात्रा',
      status: 'स्थिति',
      noAlerts: 'इस समय कोई महत्वपूर्ण सिस्टम संदेश उपलब्ध नहीं हैं।'
    }
  }[currentLang];
  
  // Forms state
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [depositChannel, setDepositChannel] = useState<'gcash' | 'bank' | 'usdt'>('gcash');
  const [depRef, setDepRef] = useState<string>('');
  const [depName, setDepName] = useState<string>('');
  const [depNumber, setDepNumber] = useState<string>('');

  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [withdrawChannel, setWithdrawChannel] = useState<'gcash' | 'bank' | 'usdt'>('gcash');
  const [wdName, setWdName] = useState<string>('');
  const [wdNumber, setWdNumber] = useState<string>('');
  const [wdUsdt, setWdUsdt] = useState<string>('');

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    loadUserData();
  }, [userId, activeMenu]);

  const loadUserData = () => {
    const data = db.getCurrentUser();
    if (data) {
      setProfile(data.profile);
      setWallet(data.wallet);
    }

    const txs = db.getData<Transaction>('playportal_transactions_v1');
    setTransactions(txs.filter(t => t.userId === userId));

    const notifs = db.getData<PortalNotification>('playportal_notifications_v1');
    setNotifications(notifs.filter(n => n.userId === 'all' || n.userId === userId));
  };

  const copyReferralCode = () => {
    if (!profile) return;
    const shareLink = `${window.location.origin}?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const amt = Number(depositAmount);
    if (!amt || amt < 50) {
      setFormFeedback({ type: 'error', msg: 'Minimum deposit is ৳50.00' });
      return;
    }

    if (!depRef) {
      setFormFeedback({ type: 'error', msg: 'Please provide the transaction Reference No. or screenshot receipt ID.' });
      return;
    }

    const res = db.submitDepositRequest(userId, {
      amount: amt,
      paymentMethod: depositChannel === 'gcash' ? 'GCash Manual Pay' : depositChannel === 'bank' ? 'Bank Transfer Manual' : 'USDT TRC20 Pay',
      accountName: depName,
      accountNumber: depNumber,
      refNo: depRef,
      usdtAddress: depositChannel === 'usdt' ? 'TRX-Wallet_Deposit_Address' : undefined,
    });

    if (res.success) {
      setFormFeedback({ type: 'success', msg: 'Deposit request recorded! Waiting for Admin verification.' });
      setDepRef('');
      setDepName('');
      setDepNumber('');
      onBalanceChange();
      loadUserData();
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const amt = Number(withdrawAmount);
    if (!amt || amt < 100) {
      setFormFeedback({ type: 'error', msg: 'Minimum withdrawal is ৳100.00' });
      return;
    }

    if (!wallet || wallet.balance < amt) {
      setFormFeedback({ type: 'error', msg: 'Insufficient cash balances.' });
      return;
    }

    if (withdrawChannel === 'gcash' && (!wdName || !wdNumber)) {
      setFormFeedback({ type: 'error', msg: 'Please enter your G-Cash full Name and Number.' });
      return;
    }

    if (withdrawChannel === 'bank' && (!wdName || !wdNumber)) {
      setFormFeedback({ type: 'error', msg: 'Enter target Bank Account name and Number.' });
      return;
    }

    if (withdrawChannel === 'usdt' && !wdUsdt) {
      setFormFeedback({ type: 'error', msg: 'USDT TRC20 withdrawal address is required.' });
      return;
    }

    const res = db.submitWithdrawRequest(userId, {
      amount: amt,
      paymentMethod: withdrawChannel === 'gcash' ? 'GCash Manual Pay' : withdrawChannel === 'bank' ? 'Bank Transfer Manual' : 'USDT TRC20 Pay',
      accountName: wdName || undefined,
      accountNumber: wdNumber || undefined,
      usdtAddress: wdUsdt || undefined,
    });

    if (res.success) {
      setFormFeedback({ type: 'success', msg: 'Withdrawal secured. Pending review!' });
      setWdName('');
      setWdNumber('');
      setWdUsdt('');
      onBalanceChange();
      loadUserData();
    } else {
      setFormFeedback({ type: 'error', msg: res.error || 'Server rejected withdrawal.' });
    }
  };

  const markAllNotifications = () => {
    const notifs = db.getData<PortalNotification>('playportal_notifications_v1');
    const updated = notifs.map(n => {
      if (n.userId === 'all' || n.userId === userId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    db.setData('playportal_notifications_v1', updated);
    loadUserData();
  };

  if (!profile || !wallet) {
    return <div className="text-center p-8 text-blue-300">Syncing database node...</div>;
  }

  // GCash, Bank payment mock reference data
  const merchantGcash = '0927-448-9121';
  const merchantBank = 'BDO: 0092-2384-5100 (GOLD CASINO INC)';
  const merchantUsdt = 'TR7NHqdjE41B755b6999L8SKZSw7FSS33t (TRC-20 Network)';

  return (
    <div id="user_dashboard_wrapper" className="p-4 max-w-2xl mx-auto space-y-5 text-white">
      
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-[#101935] to-[#0a0f24] rounded-2xl p-5 border border-blue-900 shadow-[0_4px_20px_rgba(30,58,138,0.3)]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-yellow-400/10 rounded-lg text-yellow-400">
              <User size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-300">{profile.username}</h3>
              <p className="text-[10px] text-blue-400 font-mono">ID: {profile.id} • {profile.role.toUpperCase()}</p>
            </div>
          </div>
          <span className="text-[10px] bg-blue-950 px-2 py-0.5 rounded-full border border-blue-900 text-blue-300 font-mono">
            Joined: {new Date(profile.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-blue-950/80 pt-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5">WITHDRAWABLE CASH</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-green-400 font-mono">৳{wallet.balance.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">BDT</span>
            </div>
          </div>
          <div className="border-l border-blue-950/80 pl-4">
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5">PROMO BONUS</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-yellow-400 font-mono">৳{wallet.bonusBalance.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">BDT</span>
            </div>
          </div>
        </div>

        {/* Quick specs lines */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 font-mono bg-[#060a17]/60 p-2 rounded-lg border border-blue-900/20">
          <div>
            <span className="block text-slate-500 text-[8px] uppercase">Wagered</span>
            <span className="text-slate-300 font-bold">৳{wallet.totalWagered.toLocaleString()}</span>
          </div>
          <div className="border-l border-blue-950">
            <span className="block text-slate-500 text-[8px] uppercase">Deposited</span>
            <span className="text-slate-300 font-bold">৳{wallet.totalDeposit.toLocaleString()}</span>
          </div>
          <div className="border-l border-blue-950">
            <span className="block text-slate-500 text-[8px] uppercase">Withdrawn</span>
            <span className="text-slate-300 font-bold">৳{wallet.totalWithdraw.toLocaleString()}</span>
          </div>
        </div>

        {/* Action triggers */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onSubPageChange('deposit')}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeMenu === 'deposit' 
                ? 'bg-yellow-400 text-slate-950 font-black' 
                : 'bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-900/60'
            }`}
          >
            <ArrowUpCircle size={15} /> {t.deposit.toUpperCase()}
          </button>
          <button
            onClick={() => onSubPageChange('withdraw')}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeMenu === 'withdraw' 
                ? 'bg-yellow-400 text-slate-950 font-black' 
                : 'bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-900/60'
            }`}
          >
            <ArrowDownCircle size={15} /> {t.withdraw.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Menu Sub-tabs navigation */}
      <div className="flex bg-[#0a0f24] p-1 rounded-lg border border-blue-950 text-xs overflow-x-auto gap-1">
        {[
          { key: 'profile', label: `👤 ${t.profile}` },
          { key: 'history', label: `📊 ${t.history}` },
          { key: 'invite', label: `🤝 ${t.invite}` },
          { key: 'alerts', label: `🔔 ${t.alerts} (${notifications.filter(u=>!u.isRead).length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { onSubPageChange(tab.key as any); setFormFeedback(null); }}
            className={`py-1.5 px-3 rounded-md font-semibold transition-all whitespace-nowrap ${
              activeMenu === tab.key 
                ? 'bg-blue-600/20 text-yellow-400 border border-blue-800' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Screen panel rendering */}
      {formFeedback && (
        <div className={`p-3 rounded-lg text-xs flex gap-2 items-start ${
          formFeedback.type === 'success' 
            ? 'bg-green-950/80 border border-green-500/20 text-green-300' 
            : 'bg-red-950/80 border border-red-500/20 text-red-300'
        }`}>
          {formFeedback.type === 'success' ? <Check size={16} className="shrink-0 text-green-400 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />}
          <span>{formFeedback.msg}</span>
        </div>
      )}

      {/* 1. Account Info Card */}
      {activeMenu === 'profile' && (
        <div className="bg-[#101935]/40 border border-blue-950 p-5 rounded-xl space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-400 border-b border-blue-950 pb-2">{t.profile}</h4>
          
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-blue-950/40">
              <span className="text-slate-400">{t.username}</span>
              <span className="text-slate-200 font-bold">{profile.username}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-950/40">
              <span className="text-slate-400">{t.phone}</span>
              <span className="text-slate-200">{profile.phone}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-950/40">
              <span className="text-slate-400">Registered Email</span>
              <span className="text-slate-200">{profile.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-950/40">
              <span className="text-slate-400">{t.vipLevel}</span>
              <span className="text-yellow-400 font-bold">{profile.role.toUpperCase()} LEVEL</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Referral Code</span>
              <span className="text-blue-300">{profile.referralCode}</span>
            </div>
          </div>

          {onLogout && (
            <div className="pt-2 border-t border-blue-950/40">
              <button 
                onClick={onLogout}
                className="w-full py-2.5 rounded-lg bg-red-650/15 hover:bg-red-950 border border-red-900 text-red-300 font-bold uppercase transition-all tracking-wide text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                🚪 SECURELY LOGOUT FROM SYSTEM
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Deposit Channel Panel */}
      {activeMenu === 'deposit' && (
        <div className="bg-[#101935]/60 border border-blue-900/60 p-5 rounded-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-400">Manual Payment Integration Channel</h4>
            <p className="text-[10px] text-slate-400">Deposit is instant but requires a manual reference check by admins to verify your transaction receipt.</p>
          </div>

          {/* Payment Method Selectors */}
          <div className="flex gap-2 text-xs">
            {['gcash', 'bank', 'usdt'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setDepositChannel(ch as any)}
                className={`flex-1 py-2 text-center rounded-lg font-bold border transition-all ${
                  depositChannel === ch 
                    ? 'bg-blue-600/10 border-yellow-400 text-yellow-400 font-black' 
                    : 'bg-transparent border-blue-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch === 'gcash' ? '📱 GCash Pay' : ch === 'bank' ? '🏦 Bank Trans' : '🪙 USDT TRC20'}
              </button>
            ))}
          </div>

          {/* Payment Instructions Board */}
          <div className="bg-slate-950/80 p-3.5 rounded-lg border border-blue-950 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-[10px] text-yellow-400 uppercase tracking-widest">⚠️ HOW TO DEPOSIT CASH:</p>
            <p>1. Open your payment app and transfer your desired amount to the following merchant credentials:</p>
            
            <div className="p-2.5 bg-[#060a17] rounded-md border border-blue-950 font-mono text-center relative">
              <span className="text-slate-400 text-[10px] block uppercase mb-1">Send funds to:</span>
              <span className="text-yellow-400 font-bold select-all">
                {depositChannel === 'gcash' ? merchantGcash : depositChannel === 'bank' ? merchantBank : merchantUsdt}
              </span>
            </div>

            <p>2. Keep your receipt! Enter the reference receipt number below and click Submit. An admin will audit it within minutes.</p>
          </div>

          {/* Deposit Form */}
          <form onSubmit={handleDepositSubmit} className="space-y-3.5">
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Deposit Amount (৳)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="500"
                min="50"
                className="w-full bg-[#060a17] border border-blue-950 rounded-lg p-2.5 text-sm text-yellow-300 font-mono"
              />
            </div>

            {depositChannel !== 'usdt' && (
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Your Remitter Name (Sender)</label>
                <input
                  type="text"
                  value={depName}
                  onChange={(e) => setDepName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full bg-[#060a17] border border-blue-950 rounded-lg p-2.5 text-sm text-yellow-300 font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1 font-mono">
                {depositChannel === 'usdt' ? 'Wallet Tx Hash or Code' : 'Transaction Reference Ref No.'}
              </label>
              <input
                type="text"
                value={depRef}
                onChange={(e) => setDepRef(e.target.value)}
                placeholder="RE-901452X-MX"
                className="w-full bg-[#060a17] border border-blue-950 rounded-lg p-2.5 text-sm text-yellow-300 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs tracking-wider uppercase cursor-pointer"
            >
              SUBMIT RECEIPT TO AUDITOR
            </button>
          </form>
        </div>
      )}

      {/* 3. Withdraw Portal Panel */}
      {activeMenu === 'withdraw' && (
        <div className="bg-[#101935]/60 border border-blue-900/60 p-5 rounded-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-400">Withdraw Cash Wallet Assets</h4>
            <p className="text-[10px] text-slate-400">Required: Manual bank or GCash details matching your original profile to receive funds securely.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {['gcash', 'bank', 'usdt'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setWithdrawChannel(ch as any)}
                className={`py-2 text-center rounded-lg font-bold border transition-all ${
                  withdrawChannel === ch 
                    ? 'bg-blue-600/10 border-yellow-400 text-yellow-400' 
                    : 'bg-transparent border-blue-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch === 'gcash' ? '📱 GCash Pay' : ch === 'bank' ? '🏦 bank Transfer' : '🪙 USDT TRC20'}
              </button>
            ))}
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Withdrawal Amount (৳)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="500"
                min="100"
                className="w-full bg-[#060a17] border border-blue-950 rounded-lg p-2.5 text-sm text-yellow-300 font-mono"
              />
              <span className="text-[9px] text-slate-500 mt-1 block">Maximum available: ৳{wallet.balance.toLocaleString()} | Min withdrawal: ৳100</span>
            </div>

            {withdrawChannel !== 'usdt' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Recipient account Name</label>
                  <input
                    type="text"
                    value={wdName}
                    onChange={(e) => setWdName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="w-full bg-[#060a17] border border-blue-950 rounded-lg p-2.5 text-xs text-yellow-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">account / Mobile Number</label>
                  <input
                    type="text"
                    value={wdNumber}
                    onChange={(e) => setWdNumber(e.target.value)}
                    placeholder="091122233"
                    className="w-full bg-[#060a17] border border-blue-950 rounded-lg p-2.5 text-xs text-yellow-300 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">USDT TRC20 Wallet Address</label>
                <input
                  type="text"
                  value={wdUsdt}
                  onChange={(e) => setWdUsdt(e.target.value)}
                  placeholder="TR7NHqdjE41B755b6999L8SKZS..."
                  className="w-full bg-[#060a17] border border-blue-950 rounded-lg p-2.5 text-xs text-yellow-300 font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-red-650 hover:bg-red-600 text-white font-black text-xs tracking-wider uppercase cursor-pointer border border-red-500/20"
            >
              AUTHORIZE SECURE WITHDRAWAL
            </button>
          </form>
        </div>
      )}

      {/* 4. Financial History Records */}
      {activeMenu === 'history' && (
        <div className="bg-[#101935]/40 border border-blue-950 p-4 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-blue-950 pb-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <History size={16} /> Transaction Ledger
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">{transactions.length} records found</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">No previous transactions logged for this profile.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-[#060a17]/80 p-3 rounded-lg border border-blue-950 text-xs flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] font-mono tracking-widest uppercase ${
                        tx.type === 'deposit' ? 'bg-green-950/40 text-green-400 border border-green-500/20' : 'bg-red-950/40 text-red-400 border border-red-500/20'
                      }`}>
                        {tx.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {tx.paymentMethod && <p className="text-[10px] text-slate-400">{tx.paymentMethod}</p>}
                    {tx.paymentDetails?.refNo && <p className="text-[9px] text-slate-500 font-mono">Ref: {tx.paymentDetails.refNo}</p>}
                    {tx.notes && <p className="text-[9px] text-slate-400 italic">"{tx.notes}"</p>}
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-sm font-black font-mono block">
                      {tx.type === 'deposit' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      tx.status === 'approved' 
                        ? 'bg-green-500/10 text-green-400' 
                        : tx.status === 'rejected'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. Invite & Referral Program */}
      {activeMenu === 'invite' && (
        <div className="bg-[#101935]/40 border border-blue-950 p-5 rounded-xl space-y-4">
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-400 flex items-center justify-center gap-1.5">
              <Share2 size={16} /> Golden Agent Referral Program
            </h4>
            <p className="text-xs text-slate-400">Share your custom link. Get 10% cash credits instantly on every payment your referred friends deposit!</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-blue-950 text-center space-y-2">
            <span className="text-[9px] text-slate-400 block font-mono">YOUR REFERRAL INVITE LINK</span>
            
            <div className="flex bg-[#060a17] rounded-md border border-blue-950 overflow-hidden text-xs">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}?ref=${profile.referralCode}`}
                className="w-full bg-transparent px-3 py-2 text-slate-300 font-mono border-none focus:outline-hidden"
              />
              <button
                onClick={copyReferralCode}
                className="px-4 bg-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-1 hover:bg-yellow-300 shrink-0 cursor-pointer"
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                {copiedCode ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>

          <div className="bg-[#060a17]/60 p-3 rounded-lg border border-blue-950/40 text-xs">
            <h5 className="font-bold text-[10px] text-yellow-400 uppercase tracking-wider mb-2 text-center">📈 LIVE TRACKED NETWORK</h5>
            
            {/* Find matching users in dummy state */}
            {(() => {
              const allUsers = db.getData<UserProfile>('playportal_profiles_v1');
              const recruited = allUsers.filter(u => u.referredByCode === profile.referralCode);
              return recruited.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No referred users under your code yet.</p>
              ) : (
                <div className="space-y-1.5 font-mono max-h-40 overflow-y-auto">
                  {recruited.map((rec, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-blue-950/30 text-[11px]">
                      <span className="text-slate-300">👤 {rec.username}</span>
                      <span className="text-slate-400">Date: {new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 6. Alerts Notification Center */}
      {activeMenu === 'alerts' && (
        <div className="bg-[#101935]/40 border border-blue-950 p-4 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-blue-950 pb-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <Bell size={16} /> Notification Inbox
            </h4>
            {notifications.some(n => !n.isRead) ? (
              <button
                onClick={markAllNotifications}
                className="text-[10px] px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded-md font-bold text-white uppercase text-center cursor-pointer"
              >
                Mark all as Read
              </button>
            ) : (
              <span className="text-[10px] text-slate-500">Inbox fully reviewed</span>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Your private inbox is empty.</p>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 rounded-lg border text-xs relative ${
                    notif.isRead 
                      ? 'bg-slate-950/40 border-blue-950/85 text-slate-400' 
                      : 'bg-blue-950/20 border-yellow-500/20 text-slate-200 shadow-sm'
                  }`}
                >
                  {!notif.isRead && (
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                  )}
                  <h5 className="font-bold text-[11px] uppercase tracking-wide text-yellow-400/90 mb-1">{notif.title}</h5>
                  <p className="leading-relaxed mb-1">{notif.message}</p>
                  <span className="text-[9px] text-slate-500 font-mono block text-right">{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
