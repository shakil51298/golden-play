import React, { useState, useEffect } from 'react';
import { db } from '../db/dummySupabase';
import { Wallet, UserProfile } from '../types';
import { Crown, Sparkles, AlertCircle, CheckCircle2, Award, Gift, Calendar, Lock } from 'lucide-react';

interface VipBonusModalProps {
  onClose: () => void;
  uid: string | null;
  onBalanceChange: () => void;
  openAuth: () => void;
  currentLanguage?: string;
}

export default function VipBonusModal({ onClose, uid, onBalanceChange, openAuth, currentLanguage }: VipBonusModalProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [vipsCheckInClaimed, setVipsCheckInClaimed] = useState<boolean>(false);

  useEffect(() => {
    if (uid) {
      const freshUser = db.getCurrentUser();
      if (freshUser) {
        setWallet(freshUser.wallet);
        setUserProfile(freshUser.profile);
      }
      
      // Check if daily check-in is already claimed today
      const lastClaimKey = `playportal_last_vip_claim_${uid}`;
      const lastClaim = localStorage.getItem(lastClaimKey);
      const todayStr = new Date().toISOString().split('T')[0];
      if (lastClaim === todayStr) {
        setVipsCheckInClaimed(true);
      }
    }
  }, [uid]);

  // Determine VIP level based on user total deposit
  const getVipLevel = (deposit: number) => {
    if (deposit >= 1000000) return 5;
    if (deposit >= 250000) return 4;
    if (deposit >= 50000) return 3;
    if (deposit >= 15000) return 2;
    if (deposit >= 2000) return 1;
    return 0;
  };

  const getVipTitle = (level: number) => {
    const titles = [
      'Level 0 (Explorer)',
      'Level 1 (Bronze)',
      'Level 2 (Silver)',
      'Level 3 (Gold)',
      'Level 4 (Platinum)',
      'Level 5 (Diamond Elite)'
    ];
    return titles[level];
  };

  const getVipBadgeColor = (level: number) => {
    const colors = [
      'bg-slate-600 text-slate-100 border-slate-500',
      'bg-amber-700 text-amber-100 border-amber-600',
      'bg-slate-400 text-slate-950 border-slate-300',
      'bg-yellow-500 text-slate-950 border-yellow-400',
      'bg-cyan-500 text-cyan-950 border-cyan-400',
      'bg-purple-600 text-white border-purple-400 animate-pulse'
    ];
    return colors[level];
  };

  const currentLevel = wallet ? getVipLevel(wallet.totalDeposit) : 0;
  const currentLevelLabel = getVipTitle(currentLevel);

  // Milestone targets
  const vipMilestones = [
    { level: 1, deposit: 2000, label: 'Bronze' },
    { level: 2, deposit: 15000, label: 'Silver' },
    { level: 3, deposit: 50000, label: 'Gold' },
    { level: 4, deposit: 250000, label: 'Platinum' },
    { level: 5, deposit: 1000000, label: 'Diamond Elite' },
  ];

  // Next level computation
  const nextMilestone = vipMilestones.find(m => m.level > currentLevel);
  const percentToNext = nextMilestone && wallet
    ? Math.min(100, Math.floor((wallet.totalDeposit / nextMilestone.deposit) * 100))
    : 100;

  const handleClaimCheckIn = () => {
    if (!uid) {
      openAuth();
      return;
    }
    
    const res = db.claimDailyVipCheckIn(uid, currentLevel);
    if (res.success) {
      setFeedback({
        text: `🎉 Success! Standard daily check-in rewards of ৳${res.bonusAmount}.00 credited into your VIP Bonus Wallet.`,
        isError: false
      });
      setVipsCheckInClaimed(true);
      onBalanceChange();
      // Reload wallet state
      const freshUser = db.getCurrentUser();
      if (freshUser) {
        setWallet(freshUser.wallet);
      }
    } else {
      setFeedback({
        text: res.error || 'Claim process failed. Please retry.',
        isError: true
      });
    }

    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div id="vip-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#132c30] to-[#040c0d] border border-yellow-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Glowing aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-[#17383c]/90 to-[#122c2f]/90 border-b border-yellow-500/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-400/25 border border-yellow-500/40 text-yellow-400 rounded-lg shadow-md">
              <Crown size={18} className="animate-pulse" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white tracking-widest uppercase">GOLDEN PLAY VIP DESK</h3>
              <p className="text-[10px] text-yellow-400/80 font-mono">Unlock Premium Loyalty & Daily Check-In Perks</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors shadow cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Contents */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {/* Welcome User Card */}
          {uid && wallet && userProfile ? (
            <div className="bg-black/40 border border-[#1b3f44] text-xs p-3.5 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{userProfile.avatarUrl}</span>
                  <div>
                    <span className="font-bold text-white text-xs block">{userProfile.username}</span>
                    <span className="text-[9.5px] font-mono text-slate-400">Total Wagered: ৳{wallet.totalWagered.toLocaleString()}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getVipBadgeColor(currentLevel)}`}>
                  👑 {currentLevelLabel}
                </span>
              </div>

              {/* Progress Milestones */}
              {nextMilestone ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                    <span>Deposit Progress: ৳{wallet.totalDeposit.toLocaleString() ?? 0}</span>
                    <span>Next Level ({nextMilestone.label}): ৳{nextMilestone.deposit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-[#1e484e]">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${percentToNext}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-300">
                     ✨ You are only <strong>৳{(nextMilestone.deposit - wallet.totalDeposit).toLocaleString()}</strong> away from upgrading to <strong>{nextMilestone.label} (Level {nextMilestone.level})</strong>!
                  </p>
                </div>
              ) : (
                <div className="p-2 border border-purple-500/20 bg-purple-950/20 rounded-lg text-center text-yellow-400 font-bold text-[10px]">
                  🏆 Ultimate Rank Achieved! You are inside the top tier Diamond Elite Guild!
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-black/40 border border-amber-500/20 rounded-xl text-center space-y-2.5">
              <AlertCircle size={20} className="mx-auto text-yellow-500" />
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Connect your account or register a player ID with Golden Play to claim daily VIP bonus cash and progress towards high-roller cashbacks!
              </p>
              <button
                onClick={() => { onClose(); openAuth(); }}
                className="px-4 py-1.5 bg-yellow-400 text-slate-950 hover:bg-yellow-300 text-[10px] font-mono font-black rounded-lg uppercase tracking-wide cursor-pointer"
              >
                Sign In Now
              </button>
            </div>
          )}

          {/* Daily Check-In Bonus Grid */}
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-yellow-400 font-mono tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Claim Daily Loyalty Allowance
            </h4>
            
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono">
              {[
                { lvl: 0, reward: '৳15', label: 'Lvl 0' },
                { lvl: 1, reward: '৳50', label: 'Bronze' },
                { lvl: 2, reward: '৳200', label: 'Silver' },
                { lvl: 3, reward: '৳1k', label: 'Gold' },
                { lvl: 4, reward: '৳3.5k', label: 'Platinum' },
                { lvl: 5, reward: '৳8k', label: 'Elite' },
              ].map((item) => {
                const isUserLvl = currentLevel === item.lvl && uid !== null;
                const isLocked = currentLevel < item.lvl || uid === null;
                
                return (
                  <div 
                    key={item.lvl}
                    className={`relative p-2 rounded-lg border text-center flex flex-col justify-between h-20 transition-all ${
                      isUserLvl 
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300 shadow-lg' 
                        : isLocked 
                        ? 'border-slate-800 bg-slate-950/60 text-slate-600'
                        : 'border-[#1b3f44] bg-[#0c2225] text-slate-300'
                    }`}
                  >
                    <span className="text-[8px] font-bold block truncate">{item.label}</span>
                    <span className="text-xs font-black block my-1">{item.reward}</span>
                    {isLocked ? (
                      <div className="flex items-center justify-center text-[7px] text-slate-500">
                        <Lock size={8} className="mr-0.5" /> LOCK
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-[7.5px] text-green-400 font-bold">
                        <CheckCircle2 size={8} className="mr-0.5" /> QUALIFIED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-1.5">
              <button
                onClick={handleClaimCheckIn}
                disabled={vipsCheckInClaimed || !uid}
                className={`w-full py-2.5 rounded-xl text-center text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                  vipsCheckInClaimed 
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed' 
                    : !uid 
                    ? 'bg-slate-700 text-slate-400 border border-slate-600 cursor-pointer'
                    : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 hover:brightness-110 active:scale-98 cursor-pointer shadow-lg shadow-yellow-500/10'
                }`}
              >
                {vipsCheckInClaimed 
                  ? '✓ TODAY ALREADY CLAIMED' 
                  : !uid 
                  ? '🔒 LOGIN TO CLAIM ALLOWANCE' 
                  : `CLAIM ALLOWANCE (Lvl ${currentLevel})`
                }
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {feedback && (
            <div className={`p-2.5 rounded-lg text-[10.5px] leading-relaxed border flex items-center gap-2 font-medium ${
              feedback.isError 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-green-500/10 border-green-500/25 text-green-400'
            }`}>
              {feedback.isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* VIP Perks Description */}
          <div className="border-t border-[#1b3f44] pt-3.5 space-y-2.5">
            <h5 className="text-[9.5px] uppercase font-mono font-black text-slate-400 tracking-wide">
              🌟 VIP Milestone Leveling Table & Perks
            </h5>
            
            <div className="text-[10px] space-y-2 leading-relaxed text-slate-300">
              <div className="flex justify-between items-center bg-black/20 p-1.5 rounded border border-[#1b3f44]/40">
                <span className="font-bold text-white">Level 1: Bronze Guild</span>
                <span className="text-[9px] font-mono text-yellow-400 bg-yellow-950/40 px-1.5 py-0.2 rounded">Dep ৳2,000+</span>
              </div>
              <p className="pl-2 border-l border-yellow-500 text-slate-400">Claims ৳50 daily check-ins. Automatic 1.2% daily loss cashback unlocked.</p>
              
              <div className="flex justify-between items-center bg-black/20 p-1.5 rounded border border-[#1b3f44]/40">
                <span className="font-bold text-white">Level 2: Silver League</span>
                <span className="text-[9px] font-mono text-yellow-400 bg-yellow-950/40 px-1.5 py-0.2 rounded">Dep ৳15,000+</span>
              </div>
              <p className="pl-2 border-l border-cyan-500 text-slate-400">Claims ৳200 daily allowance. Unlocks priority GCash transfer routes & 24/7 dedicated desk.</p>

              <div className="flex justify-between items-center bg-black/20 p-1.5 rounded border border-[#1b3f44]/40">
                <span className="font-bold text-white">Level 3: Golden Hall</span>
                <span className="text-[9px] font-mono text-yellow-400 bg-yellow-950/40 px-1.5 py-0.2 rounded">Dep ৳50,000+</span>
              </div>
              <p className="pl-2 border-l border-amber-600 text-slate-400">Claims ৳1,000 check-ins. 1.5% live casino rebate. Boosts agent team commissions by 1%.</p>

              <div className="flex justify-between items-center bg-black/20 p-1.5 rounded border border-[#1b3f44]/40">
                <span className="font-bold text-white">Level 4: Platinum VIP</span>
                <span className="text-[9px] font-mono text-yellow-400 bg-yellow-950/40 px-1.5 py-0.2 rounded">Dep ৳250,000+</span>
              </div>
              <p className="pl-2 border-l border-purple-500 text-slate-400">Claims ৳3,500 daily allowance. 1.8% rebates, private Telegram host audit, & custom physical gift deliveries.</p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#0a171a] border-t border-[#1b3f44] flex items-center justify-between shrink-0 text-[10px]">
          <span className="text-slate-500 font-mono">ID: GOLDENPLAY-VIP-DESK</span>
          <p className="text-slate-400 text-right leading-none">Manual audited bonuses. Terms apply 18+.</p>
        </div>

      </div>
    </div>
  );
}
