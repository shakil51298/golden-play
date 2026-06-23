/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../db/dummySupabase';
import { UserProfile, Wallet, Transaction, CommissionReport } from '../types';
import { Shield, Sparkles, TrendingUp, Users, DollarSign, ArrowUpRight, Check, AlertCircle, Copy, Wallet2 } from 'lucide-react';

interface AgentPanelProps {
  agentId: string;
  onBalanceChange: () => void;
  onClose: () => void;
}

export default function AgentPanel({ agentId, onBalanceChange, onClose }: AgentPanelProps) {
  const [agentProfile, setAgentProfile] = useState<UserProfile | null>(null);
  const [agentWallet, setAgentWallet] = useState<Wallet | null>(null);
  const [referredUsers, setReferredUsers] = useState<UserProfile[]>([]);
  const [commTransactions, setCommTransactions] = useState<Transaction[]>([]);
  
  // Withdrawal Form Target state
  const [claimAmount, setClaimAmount] = useState<string>('500');
  const [claimBankName, setClaimBankName] = useState<string>('');
  const [claimBankNo, setClaimBankNo] = useState<string>('');
  const [claimUsdt, setClaimUsdt] = useState<string>('');
  
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    loadAgentData();
  }, [agentId]);

  const loadAgentData = () => {
    const data = db.getCurrentUser();
    if (data) {
      setAgentProfile(data.profile);
      setAgentWallet(data.wallet);
    }

    const allProfiles = db.getData<UserProfile>('playportal_profiles_v1');
    const matches = allProfiles.filter(p => p.referredByCode === data?.profile?.referralCode);
    setReferredUsers(matches);

    const allTxs = db.getData<Transaction>('playportal_transactions_v1');
    // Commissions ledger transactions
    setCommTransactions(allTxs.filter(tx => tx.userId === agentId && tx.type === 'commission'));
  };

  const copyRefLink = () => {
    if (!agentProfile) return;
    const invite = `${window.location.origin}?ref=${agentProfile.referralCode}`;
    navigator.clipboard.writeText(invite).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const amt = Number(claimAmount);
    if (!amt || amt < 100) {
      setFeedback({ type: 'error', msg: 'Minimum broker withdrawal is ৳100.00' });
      return;
    }

    if (!agentWallet || agentWallet.balance < amt) {
      setFeedback({ type: 'error', msg: 'Your unpaid commission wallet resources are insufficient.' });
      return;
    }

    if (!claimBankName || !claimBankNo) {
      setFeedback({ type: 'error', msg: 'Bank Name & Account number details are required.' });
      return;
    }

    const res = db.agentRequestWithdrawal(agentId, amt, {
      accountName: claimBankName,
      accountNumber: claimBankNo,
      usdtAddress: claimUsdt || undefined
    });

    if (res.success) {
      setFeedback({ type: 'success', msg: 'Broker commission withdrawal submitted! Audit pending.' });
      setClaimBankName('');
      setClaimBankNo('');
      setClaimUsdt('');
      loadAgentData();
      onBalanceChange();
    } else {
      setFeedback({ type: 'error', msg: res.error || 'Server error.' });
    }
  };

  if (!agentProfile || !agentWallet) {
    return <div className="text-center p-8 text-blue-300">Synchronizing Broker assets...</div>;
  }

  // Calculate stats summary
  const totalCommPaidOut = agentWallet.totalWithdraw;
  const referredTxs = db.getData<Transaction>('playportal_transactions_v1')
    .filter(t => referredUsers.some(u => u.id === t.userId) && t.type === 'deposit' && t.status === 'approved');
  const totalPlayerDeposits = referredTxs.reduce((sum, current) => sum + current.amount, 0);

  return (
    <div id="agent_dashboard_container" className="fixed inset-0 z-50 bg-[#060a17]/95 flex items-start sm:items-center justify-center p-2.5 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1229] border border-blue-900 bg-linear-to-b from-[#0e1938] to-[#070b18] w-full max-w-4xl rounded-2xl p-3.5 sm:p-5 shadow-[0_0_35px_rgba(234,179,8,0.15)] text-white relative my-auto">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b border-blue-950 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="p-2 bg-yellow-400/10 text-yellow-500 rounded-lg">
              <Sparkles size={20} className="animate-pulse" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-widest uppercase leading-tight">Golden Agent Broker Desk</h2>
              <p className="text-[10px] text-yellow-400 font-mono">PARTNER LEVEL: VIP COMMISSION COMMERCE</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto p-2 sm:p-1 sm:px-3 bg-blue-950 hover:bg-blue-900 text-blue-400 rounded-md border border-blue-900 text-xs transition-colors"
          >
            DISMISS CONSOLE
          </button>
        </div>

        {/* Info alerts */}
        {feedback && (
          <div className={`mb-4 p-3 rounded-lg text-xs flex gap-1.5 items-start font-mono ${
            feedback.type === 'success' 
              ? 'bg-green-950/80 border border-green-500/20 text-green-300' 
              : 'bg-red-950/80 border border-red-500/20 text-red-300'
          }`}>
            {feedback.type === 'success' ? <Check size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#060a17] p-3 rounded-lg border border-blue-950/40">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">Unpaid Commissions</span>
            <span className="text-base text-yellow-400 font-black font-mono break-all">৳{agentWallet.balance.toLocaleString()}</span>
          </div>

          <div className="bg-[#060a17] p-3 rounded-lg border border-blue-950/40">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">Total Referred Users</span>
            <span className="text-base text-blue-300 font-black font-mono">{referredUsers.length} players</span>
          </div>

          <div className="bg-[#060a17] p-3 rounded-lg border border-blue-950/40">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">Player Network Payments</span>
            <span className="text-base text-green-400 font-black font-mono break-all">৳{totalPlayerDeposits.toLocaleString()}</span>
          </div>

          <div className="bg-[#060a17] p-3 rounded-lg border border-blue-950/40">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">Withdrawn broker cash</span>
            <span className="text-base text-slate-300 font-black font-mono break-all">৳{totalCommPaidOut.toLocaleString()}</span>
          </div>
        </div>

        {/* Invitation Link copy box */}
        <div className="mb-5 bg-gradient-to-r from-blue-950/30 to-slate-950 border border-blue-950 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1">
              <TrendingUp size={14} /> SHARE broker LINK & EARN
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">Referral code: <span className="text-white font-mono font-bold">{agentProfile.referralCode}</span>. Earn 10% cash bonus on all payments completed by profiles registered using this code!</p>
          </div>

          <div className="flex flex-col min-[430px]:flex-row bg-[#060a17] rounded-lg border border-blue-900 overflow-hidden text-xs w-full md:w-auto shrink-0 font-mono">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}?ref=${agentProfile.referralCode}`}
              className="w-full min-w-0 bg-transparent px-3 py-2 text-slate-300 border-none focus:outline-hidden text-xs sm:max-w-sm"
            />
            <button
              onClick={copyRefLink}
              className="px-4 py-2 bg-yellow-400 text-slate-950 font-black flex items-center justify-center gap-1 hover:bg-yellow-300 shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? 'LINK COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Master details content layouts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* L: Payout submission */}
          <div className="md:col-span-5 bg-[#060a17] border border-blue-950 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-blue-950 pb-2">
              <Wallet2 size={15} /> SUBMIT BROKER Payout
            </h4>

            <form onSubmit={handleClaimSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Claim Amount (৳)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  min="100"
                  className="w-full bg-[#0b1229] border border-blue-900 rounded p-2.5 text-yellow-300 font-mono"
                />
                <span className="text-[9px] text-slate-500 mt-1 block">Maximum withdrawable: ৳{agentWallet.balance.toLocaleString()} | Min: ৳100</span>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Target Bank / Channel Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bank of the Philippine Islands"
                  value={claimBankName}
                  onChange={(e) => setClaimBankName(e.target.value)}
                  className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Broker Account / Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0517-8172-55"
                  value={claimBankNo}
                  onChange={(e) => setClaimBankNo(e.target.value)}
                  className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">USDT TRC-20 Key Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TR7NHqdjE41B..."
                  value={claimUsdt}
                  onChange={(e) => setClaimUsdt(e.target.value)}
                  className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-slate-300 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black tracking-wider uppercase"
              >
                REQUEST broker Payout
              </button>
            </form>
          </div>

          {/* R: Commission Logs & Downline Players */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Live conversion records */}
            <div className="bg-[#060a17] border border-blue-950 rounded-xl p-4">
              <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2.5 border-b border-blue-950 pb-2">📂 Commissions Ledger Logs</h4>
              
              <div className="space-y-2 max-h-44 overflow-y-auto font-mono text-[11px]">
                {commTransactions.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">No commission share payouts verified on ledger yet.</p>
                ) : (
                  commTransactions.map((tx) => (
                    <div key={tx.id} className="bg-[#0b1229] p-2 rounded border border-blue-950/60 flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-2">
                      <div className="min-w-0">
                        <span className="text-yellow-400 font-bold">+{tx.amount.toLocaleString()}.00 USD</span>
                        <p className="text-[9px] text-slate-500 break-words">{tx.notes}</p>
                      </div>
                      <span className="text-[9px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Downline referred players registry */}
            <div className="bg-[#060a17] border border-blue-950 rounded-xl p-4">
              <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2.5 border-b border-blue-950 pb-2">👥 Referred Downline Players</h4>
              
              <div className="space-y-2 max-h-44 overflow-y-auto text-xs font-mono">
                {referredUsers.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">Referred database empty. Share code to start conversion.</p>
                ) : (
                  referredUsers.map((p) => {
                    // Check their total deposit sum
                    const playerTxs = db.getData<Transaction>('playportal_transactions_v1')
                      .filter(t => t.userId === p.id && t.type === 'deposit' && t.status === 'approved');
                    const depositsAmt = playerTxs.reduce((sum, current) => sum + current.amount, 0);

                    return (
                      <div key={p.id} className="bg-[#0b1229] p-2 rounded border border-blue-950/60 flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-2">
                        <div className="min-w-0">
                          <span className="text-slate-200 font-bold">👤 @{p.username}</span>
                          <span className="text-[9px] text-slate-500 block">Date: {new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-left min-[430px]:text-right">
                          <span className="text-green-400 font-bold">৳{depositsAmt.toLocaleString()} deposited</span>
                          <span className="text-[9px] text-slate-500 block">Est comm: ৳{(depositsAmt * 0.1).toLocaleString()} BDT</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
