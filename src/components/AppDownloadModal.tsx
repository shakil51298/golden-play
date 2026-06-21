import React, { useState, useEffect } from 'react';
import { db } from '../db/dummySupabase';
import { Download, Tablet, ShieldCheck, CheckCircle2, CloudDownload, Sparkles, AlertCircle } from 'lucide-react';

interface AppDownloadModalProps {
  onClose: () => void;
  uid: string | null;
  onBalanceChange: () => void;
  openAuth: () => void;
  currentLanguage?: string;
}

export default function AppDownloadModal({ onClose, uid, onBalanceChange, openAuth, currentLanguage }: AppDownloadModalProps) {
  const [downloadStep, setDownloadStep] = useState<'idle' | 'progress' | 'completed' | 'rewarded'>('idle');
  const [percent, setPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Initializing secure connection...');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    // If user has already claimed app bonus in past, mark it
    if (uid) {
      const claimedKey = `playportal_claimed_app_bonus_${uid}`;
      if (localStorage.getItem(claimedKey) === 'true') {
        setDownloadStep('rewarded');
      }
    }
  }, [uid]);

  const startFakeDownload = () => {
    setDownloadStep('progress');
    setPercent(0);
    setErrorText(null);

    const steps = [
      { p: 10, text: '🔍 Contacting secure server nodes...' },
      { p: 25, text: '📥 Streaming goldenpay_mobile_v205.apk (24.5 MB)...' },
      { p: 50, text: '⚡ Transferring package blocks (12.1 / 24.5 MB)...' },
      { p: 75, text: '📦 Unpacking assets & cache libraries...' },
      { p: 90, text: '🛡️ Scanning code via Google Play Protect Secure Shield...' },
      { p: 100, text: '🚀 Installation successful! App linked to your device.' }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      setPercent(p => {
        if (p >= 100) {
          clearInterval(interval);
          setDownloadStep('completed');
          return 100;
        }

        const nextP = p + Math.floor(Math.random() * 8) + 4;
        const targetP = Math.min(100, nextP);

        // Update status text matching progress
        if (currentStepIdx < steps.length && targetP >= steps[currentStepIdx].p) {
          setStatusText(steps[currentStepIdx].text);
          currentStepIdx++;
        }

        return targetP;
      });
    }, 200);
  };

  const claimBonusCash = () => {
    if (!uid) {
      openAuth();
      return;
    }

    const claimedKey = `playportal_claimed_app_bonus_${uid}`;
    if (localStorage.getItem(claimedKey) === 'true') {
      setErrorText('You have already claimed your ৳100.00 app download bonus for this player profile.');
      setDownloadStep('rewarded');
      return;
    }

    // Add bonus cash
    const wallet = db.addBonusBalance(uid, 100, 'Golden Play App Installer Promotional Bonus');
    if (wallet) {
      localStorage.setItem(claimedKey, 'true');
      setDownloadStep('rewarded');
      onBalanceChange();
    } else {
      setErrorText('Could not sync user wallet ledger.');
    }
  };

  return (
    <div id="app-download-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1c3830] to-[#040d0a] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Decorative background lights */}
        <div className="absolute top-0 right-0 w-32 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#173c33] to-[#122e27] border-b border-emerald-500/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-400 text-slate-950 rounded-lg shadow-md">
              <Download size={16} className="animate-bounce" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">GOLDEN PLAY APP DOWNLOAD DESK</h4>
              <span className="text-[9.5px] text-emerald-400 font-mono block mt-1">Get ৳100 Instant Bonus Free</span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-black/40 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center text-[10px] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Contents */}
        <div className="p-4 space-y-4 text-xs text-slate-350">
          
          {/* Visual Showcase Box */}
          <div className="p-3 bg-black/40 border border-[#1b4338] rounded-xl flex items-center gap-3">
            <div className="text-4xl">📱</div>
            <div className="space-y-0.5">
              <h5 className="font-extrabold text-white text-[12px]">Golden Play Premium App v2.0.5</h5>
              <p className="text-[10px] text-slate-400 leading-normal">Fast-load slot buffers, bypass browser redirects, and secure custom biometrics log-in.</p>
            </div>
          </div>

          {/* Interactive download status pipeline */}
          {downloadStep === 'idle' && (
            <div className="space-y-3 p-1.5 text-center">
              <CloudDownload size={32} className="mx-auto text-emerald-400 animate-pulse" />
              <p className="text-[11px] leading-relaxed text-slate-300">
                Install our official Android / iOS sandbox container to instantly credit <strong className="text-yellow-400 text-[12px] font-black">৳100.00</strong> direct to your sports/slots bonus wallet.
              </p>
              
              <button
                onClick={startFakeDownload}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-105 active:scale-98 text-slate-950 font-black tracking-wider uppercase rounded-xl cursor-pointer text-[10.5px] shadow-lg shadow-emerald-500/10"
              >
                START APK INSTALLER DOWNLOAD
              </button>
            </div>
          )}

          {downloadStep === 'progress' && (
            <div className="space-y-2.5 p-1 bg-black/20 border border-emerald-950 rounded-lg p-3">
              <div className="flex justify-between items-center font-mono text-[9px] text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                  STATUS ARCHIVE
                </span>
                <span>{percent}%</span>
              </div>
              
              {/* Progress bar boundary */}
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-emerald-900/30">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-150"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>

              <span className="font-mono text-[9px] text-emerald-400 leading-none block italic select-none">
                 {statusText}
              </span>
            </div>
          )}

          {downloadStep === 'completed' && (
            <div className="space-y-3 text-center p-2 border border-yellow-500/20 bg-yellow-950/10 rounded-xl">
              <CheckCircle2 size={32} className="mx-auto text-yellow-400" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono">INSTALLATION AUDITED</span>
                <p className="text-[11px] text-slate-200 font-bold">Registration key linked successfully! Claim your ৳100.00 bonus.</p>
              </div>

              {uid ? (
                <button
                  onClick={claimBonusCash}
                  className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-black uppercase rounded-lg tracking-wider cursor-pointer"
                >
                  🎁 CLAIM ৳100 BONUS CREDITS
                </button>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[9.5px] text-red-400">Please login to authorize wallet crediting.</p>
                  <button
                    onClick={() => { onClose(); openAuth(); }}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase rounded-lg tracking-wider cursor-pointer"
                  >
                    Login & Verify Now
                  </button>
                </div>
              )}
            </div>
          )}

          {downloadStep === 'rewarded' && (
            <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-950/20 text-center space-y-2">
              <p className="text-[14px]">🛡️ App Verified & Bound</p>
              <div className="text-[10.5px] text-emerald-400 leading-normal">
                ✓ APK Container matches device. <br />
                ✓ App download promotional bonus (<strong>৳100</strong>) has been fully unlocked and added into your transaction logs!
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          )}

          {errorText && (
            <div className="p-2 border border-red-500/10 bg-red-950/10 text-red-400 rounded-lg text-[10px] flex items-center gap-1.5">
              <AlertCircle size={12} />
              <span>{errorText}</span>
            </div>
          )}

          {/* Bullet Benefits */}
          <div className="border-t border-[#1b4338] pt-3.5 space-y-2 text-[10px] text-slate-400">
            <span className="uppercase font-mono font-bold block">Why run on Golden Play APK:</span>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5">✓ <span className="text-emerald-400 font-semibold">Zero-Latency:</span> 2x faster page layouts through persistent asset buffers.</p>
              <p className="flex items-center gap-1.5">✓ <span className="text-emerald-400 font-semibold">Security:</span> Fully isolated from external browser injections.</p>
              <p className="flex items-center gap-1.5">✓ <span className="text-emerald-400 font-semibold">Push Notices:</span> Receive rapid payout status updates instantly.</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a1210] border-t border-[#1b4338] text-[9px] font-mono text-slate-500 text-center">
          SHA256: 4e9a0319803b9021d7bc...
        </div>

      </div>
    </div>
  );
}
