/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../db/dummySupabase';
import { Coins, Flame, Trophy, Play, Settings, AlertCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface SlotMachineDemoProps {
  userId: string;
  onBalanceChange: () => void;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  currentLanguage?: string;
}

// Reel symbols and their payout multiplier weights
const SYMBOLS = [
  { char: '7️⃣', label: 'Lucky Seven', weight: 1, multiplier: 25 },
  { char: '👑', label: 'Crown', weight: 2, multiplier: 12 },
  { char: '💎', label: 'Diamond', weight: 3, multiplier: 8 },
  { char: '🍒', label: 'Cherry', weight: 4, multiplier: 3 },
  { char: '🍋', label: 'Lemon', weight: 5, multiplier: 2 },
  { char: '🍀', label: 'Clover', weight: 5, multiplier: 1.5 },
];

export default function SlotMachineDemo({ userId, onBalanceChange, onClose, gameId, gameTitle, currentLanguage }: SlotMachineDemoProps) {
  const [balance, setBalance] = useState<number>(0);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [reels, setReels] = useState<string[]>(['7️⃣', '💎', '👑']);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [spinMessage, setSpinMessage] = useState<string>('Set your bet & pull the lever!');
  const [spinStatus, setSpinStatus] = useState<'idle' | 'win' | 'loss' | 'jackpot'>('idle');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [recentWinTicker, setRecentWinTicker] = useState<{ name: string; amount: number }[]>([]);

  // Sound effects simulator using active visual indicator
  const [audioCue, setAudioCue] = useState<string | null>(null);

  // ADMIN OVERRIDE OUTCOME CONTROLS
  const [userRole, setUserRole] = useState<string>('user');
  const [userName, setUserName] = useState<string>('Player');
  const [adminControlOpen, setAdminControlOpen] = useState<boolean>(false);
  const [outcomeOverride, setOutcomeOverride] = useState<'none' | 'force_jackpot' | 'force_crowns' | 'force_win' | 'force_loss'>('none');

  useEffect(() => {
    fetchBalances();
    db.addRecentlyPlayed(userId, gameId);
    
    // Simulate real-time community winner alerts
    const interval = setInterval(() => {
      const names = ['jack_pot', 'luffy_slots', 'spin_king', 'riches99', 'ph_slot_master'];
      const amounts = [120, 450, 1500, 300, 750];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomAmt = amounts[Math.floor(Math.random() * amounts.length)];
      setRecentWinTicker(prev => [{ name: randomName, amount: randomAmt }, ...prev].slice(0, 3));
    }, 6000);

    return () => clearInterval(interval);
  }, [userId, gameId]);

  const fetchBalances = () => {
    const userState = db.getCurrentUser();
    if (userState) {
      setBalance(userState.wallet.balance);
      setBonusBalance(userState.wallet.bonusBalance);
      setUserRole(userState.profile.role);
      setUserName(userState.profile.username);
    }
  };

  const playSoundEffect = (type: 'spin' | 'win' | 'loss' | 'jackpot') => {
    if (!soundEnabled) return;
    if (type === 'spin') setAudioCue('🎰 Swoosh! Reels spinning...');
    if (type === 'win') setAudioCue('🔊 Ding! Ding! WINNER!');
    if (type === 'loss') setAudioCue('🔉 Womp womp!');
    if (type === 'jackpot') setAudioCue('👑 🔥 MEGA JACKPOT FLARE! 🔥 👑');
    
    setTimeout(() => {
      setAudioCue(null);
    }, 2500);
  };

  const handleSpin = () => {
    const totalResource = balance + bonusBalance;
    if (totalResource < betAmount) {
      setSpinMessage('❌ Insufficient balance! Please deposit to play.');
      setSpinStatus('loss');
      return;
    }

    if (spinning) return;

    setSpinning(true);
    setSpinStatus('idle');
    setWinAmount(0);
    setSpinMessage('🎰 SPINNING THE GOLD REELS...');
    playSoundEffect('spin');

    // Reel spinning simulation with delay phases
    let times = 0;
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
      ]);
      times++;
      if (times > 10) {
        clearInterval(interval);
        evaluateSpinResult();
      }
    }, 120);
  };

  const evaluateSpinResult = () => {
    // Consult the active Outcome Control Model
    const modelOverride = db.checkGameOutcome(userId, gameId);
    let resolvedOverride: string = outcomeOverride;
    if (resolvedOverride === 'none' && modelOverride !== 'none') {
      resolvedOverride = modelOverride;
    }

    // Generate final reels based on admin outcome rigs
    let finalReels = [
      getRandomSymbolByWeight(),
      getRandomSymbolByWeight(),
      getRandomSymbolByWeight()
    ];

    if (resolvedOverride === 'force_jackpot') {
      finalReels = ['7️⃣', '7️⃣', '7️⃣'];
    } else if (resolvedOverride === 'force_crowns') {
      finalReels = ['👑', '👑', '👑'];
    } else if (resolvedOverride === 'force_win') {
      const winOptions = [
        ['💎', '💎', '💎'],
        ['👑', '👑', '👑'],
        ['🍒', '🍒', '🍋'],
        ['🍋', '🍋', '🍀'],
        ['🍀', '🍀', '💎']
      ];
      finalReels = winOptions[Math.floor(Math.random() * winOptions.length)];
    } else if (resolvedOverride === 'force_loss' || resolvedOverride === 'force_lose') {
      finalReels = ['🍒', '🍋', '🍀'];
    }

    setReels(finalReels);

    const [r1, r2, r3] = finalReels;
    let factor = 0;
    let status: 'win' | 'loss' | 'jackpot' = 'loss';
    let msg = 'Better luck next spin!';

    // Match criteria
    if (r1 === r2 && r2 === r3) {
      // 3 of a kind
      const matched = SYMBOLS.find(s => s.char === r1);
      factor = matched ? matched.multiplier : 2;
      status = r1 === '7️⃣' ? 'jackpot' : 'win';
      msg = status === 'jackpot' ? '🌟 🔥 MEGA JACKPOT! EXTREME PAYOUT! 🔥 🌟' : `Lucky Triple Match! Payout multiplier: ${factor}x`;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      // 2 of a kind
      const matchedChar = r1 === r2 ? r1 : r3;
      const matched = SYMBOLS.find(s => s.char === matchedChar);
      factor = matched ? Math.max(1, matched.multiplier * 0.3) : 1.2;
      // Truncate factor nicely
      factor = Math.round(factor * 10) / 10;
      status = 'win';
      msg = `Dynamic Double Match! Win multiplier: ${factor}x`;
    }

    const outcomePayout = Math.round(betAmount * factor);

    // Call state backend play API
    const result = db.playGameWager(userId, betAmount, factor, gameId);

    setSpinning(false);
    setSpinStatus(status);
    setWinAmount(outcomePayout);
    setSpinMessage(factor > 0 ? `🎉 ${msg}. Won ৳${outcomePayout}!` : `Loss of ৳${betAmount}. Spin again!`);

    if (factor > 0) {
      playSoundEffect(status === 'jackpot' ? 'jackpot' : 'win');
    } else {
      playSoundEffect('loss');
    }

    fetchBalances();
    onBalanceChange();
  };

  const getRandomSymbolByWeight = (): string => {
    // Basic weight-based distribution
    const pool: string[] = [];
    SYMBOLS.forEach(sym => {
      // lower weight = fewer items in pool
      for (let i = 0; i < sym.weight; i++) {
        pool.push(sym.char);
      }
    });
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const changeBet = (amt: number) => {
    if (spinning) return;
    if (amt <= 0) return;
    setBetAmount(amt);
    setSpinMessage(`Bet set to ৳${amt}. Good luck!`);
    setSpinStatus('idle');
  };

  return (
    <div id="slot_machine_container" className="fixed inset-0 z-50 bg-[#060a17]/95 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1229] border-2 border-yellow-400 bg-linear-to-b from-[#0e1938] to-[#070b18] w-full max-w-lg rounded-2xl p-6 shadow-[0_0_35px_rgba(255,215,0,0.2)] text-white relative">
        
        {/* Top Header */}
        <div className="flex justify-between items-center mb-4 border-b border-blue-900 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-400/10 rounded-full text-yellow-400">
              <Trophy size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-yellow-400">{gameTitle}</h2>
              <p className="text-[10px] text-blue-400 font-mono">PROVIDER: {gameId.includes('slots') ? 'PG Soft Demo' : 'Pragmatic Demo'}</p>
            </div>
          </div>
          <button 
            id="close_game_btn"
            onClick={onClose}
            className="p-1 px-3 bg-red-950 hover:bg-red-900 text-red-300 rounded-md border border-red-500/30 text-xs transition-colors"
          >
            QUIT GAME
          </button>
        </div>

        {/* Live Audio notification */}
        {audioCue && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 font-bold px-4 py-1 rounded-full text-xs shadow-md animate-bounce z-10 font-mono">
            {audioCue}
          </div>
        )}

        {/* Balance Status Line */}
        <div className="grid grid-cols-2 gap-3 mb-4 bg-[#060a17] p-3 rounded-lg border border-blue-900/40">
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Real Cash Balance</span>
            <span className="text-base text-green-400 font-black font-mono">৳{balance.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Promo Credits</span>
            <span className="text-base text-yellow-400 font-black font-mono">৳{bonusBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Outer Slot Visual Housing */}
        <div className="bg-yellow-400 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(255,215,0,0.3)] mb-5">
          <div className="bg-linear-to-r from-blue-950 via-slate-900 to-blue-950 border-4 border-yellow-600 rounded-xl py-6 px-4 relative overflow-hidden">
            
            {/* Ambient Background Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.02)_1px,transparent_1px)] bg-[size:100%_8px] pointer-events-none"></div>

            {/* Reel Slots Wrapper */}
            <div className="grid grid-cols-3 gap-3 relative z-10">
              {reels.map((char, index) => (
                <div 
                  key={index} 
                  className={`h-24 md:h-28 bg-[#090e1e] rounded-xl flex items-center justify-center border-2 ${spinning ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse' : 'border-yellow-500/40'} text-5xl md:text-6xl transition-all duration-100 select-none shadow-inner`}
                >
                  <span className={spinning ? 'animate-bounce' : ''}>
                    {char}
                  </span>
                </div>
              ))}
            </div>

            {/* Horizontal alignment paylines */}
            <div className="absolute inset-y-1/2 left-0 right-0 h-0.5 bg-yellow-400/30 border-t border-dashed border-yellow-400 pointer-events-none"></div>
          </div>
        </div>

        {/* Screen/Feedback console */}
        <div className={`p-3 rounded-lg text-center font-mono text-xs mb-5 border transition-all ${
          spinStatus === 'jackpot' 
            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400 animate-pulse' 
            : spinStatus === 'win'
            ? 'bg-green-500/10 text-green-300 border-green-500/40'
            : spinStatus === 'loss'
            ? 'bg-red-500/15 text-red-300 border-red-500/30'
            : 'bg-slate-950 text-blue-300 border-blue-900/60'
        }`}>
          {spinning ? (
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping delay-75"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping delay-150"></span>
              <span className="font-bold tracking-wider">{spinMessage}</span>
            </div>
          ) : (
            <div className="font-bold">{spinMessage}</div>
          )}
          {winAmount > 0 && (
            <div className="text-yellow-400 text-lg font-black mt-1 animate-bounce">
              +৳{winAmount.toLocaleString()} CASH CREDITED!
            </div>
          )}
        </div>

        {/* Bet controls */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5 text-xs text-slate-300">
            <span>CHOOSE BET INTENSITY</span>
            <span className="font-mono text-yellow-400 font-bold">ACTIVE BET: ৳{betAmount}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[10, 50, 100, 250, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => changeBet(amt)}
                disabled={spinning}
                className={`py-2 text-xs rounded-lg font-mono font-bold transition-all ${
                  betAmount === amt 
                    ? 'bg-yellow-400 text-slate-950 border-2 border-yellow-200 font-black scale-105 shadow-[0_0_10px_rgba(255,215,0,0.3)]' 
                    : 'bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-900'
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Spin action trigger */}
        <div className="flex gap-3">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-3 bg-blue-950 hover:bg-blue-900 border border-blue-900 text-slate-300 rounded-xl transition-colors"
            title="Toggle sound simulation"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button
            id="spin_lever_btn"
            onClick={handleSpin}
            disabled={spinning}
            className={`flex-1 py-3 text-slate-950 font-black text-lg tracking-widest rounded-xl transition-all uppercase flex items-center justify-center gap-2 ${
              spinning 
                ? 'bg-yellow-600 cursor-not-allowed opacity-60' 
                : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-110 shadow-[0_4px_15px_rgba(255,215,0,0.4)] hover:shadow-[0_4px_22px_rgba(255,215,0,0.6)] cursor-pointer'
            }`}
          >
            <Coins size={20} className={spinning ? 'animate-spin' : 'animate-bounce'} />
            {spinning ? 'SPINNING...' : 'SPIN PLAY!'}
          </button>
        </div>

        {/* Paytable drawer info */}
        <div className="mt-5 border-t border-blue-900/60 pt-4 text-[10px] text-blue-300 font-mono">
          <p className="text-center font-bold text-yellow-400 uppercase mb-2">⭐ LIVE MULTIPLIER RULES ⭐</p>
          <div className="grid grid-cols-3 gap-2 text-center text-slate-400">
            <div>7️⃣7️⃣7️⃣ = <span className="text-yellow-400 font-bold">25x</span></div>
            <div>👑👑👑 = <span className="text-yellow-400 font-bold">12x</span></div>
            <div>💎💎💎 = <span className="text-yellow-400 font-bold">8x</span></div>
            <div>🍒🍒🍒 = 3x</div>
            <div>🍋🍋🍋 = 2x</div>
            <div>Double Match = 1.2x+</div>
          </div>
        </div>

        {/* Community Live Winner ticker */}
        {recentWinTicker.length > 0 && (
          <div className="mt-4 bg-[#060a17]/80 p-2.5 rounded-lg border border-blue-900/40">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold text-center mb-1">🔴 REAL-TIME CASINO EVENTS</span>
            <div className="space-y-1">
              {recentWinTicker.map((ticker, index) => (
                <div key={index} className="flex justify-between items-center text-[10px] text-slate-300 font-mono">
                  <span className="text-slate-400">👤 {ticker.name}</span>
                  <span className="text-green-400 font-bold">won +৳{ticker.amount}.00</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
