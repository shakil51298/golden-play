import React, { useState, useEffect } from 'react';
import { syncService, SyncStatus } from '../db/supabaseSync';
import { Database, CloudLightning, RefreshCw, CheckCircle, AlertOctagon, HelpCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function SupabaseSyncWidget() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSqlInstructions, setShowSqlInstructions] = useState<boolean>(false);

  useEffect(() => {
    const unsub = syncService.subscribe((status) => {
      setSyncStatus(status);
      setIsSyncing(status.status === 'syncing');
    });
    return unsub;
  }, []);

  const handlePush = async () => {
    setIsSyncing(true);
    const res = await syncService.pushToSupabase();
    setIsSyncing(false);
  };

  const handlePull = async () => {
    if (confirm('সতর্কতা: Supabase থেকে ডাটা আনলে আপনার ব্রাউজারের বর্তমান লোকাল ডাটা ওভাররাইট হয়ে যাবে। আপনি কি নিশ্চিত?')) {
      setIsSyncing(true);
      const res = await syncService.pullFromSupabase();
      setIsSyncing(false);
    }
  };

  return (
    <div id="supabase_db_sync_widget" className="bg-[#0b1424] border border-[#16335a] rounded-xl p-4 space-y-4 shadow-lg text-slate-250">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-[#16335a] pb-3">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-[13px] font-bold text-slate-100 tracking-wide">
              Supabase ক্লাউড ডাটাবেজ
            </h3>
            <span className="text-[9px] text-cyan-400/80 font-mono tracking-wider block">
              PROJECT REFS: jxafvuqtqphpkmkqqyhf
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wide font-mono">CONNECTED</span>
        </div>
      </div>

      {/* Sync Status Alerts */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#12223a]/50 p-2 rounded-lg border border-[#1b3d69]/30">
            <span className="text-[9px] text-slate-400 block mb-0.5">সর্বশেষ ব্যাকআপ</span>
            <span className="text-[11px] font-bold text-slate-100 font-mono">
              {syncStatus.lastSyncedAt || 'কখনও হয়নি'}
            </span>
          </div>
          <div className="bg-[#12223a]/50 p-2 rounded-lg border border-[#1b3d69]/30">
            <span className="text-[9px] text-slate-400 block mb-0.5">কানেকশন মোড</span>
            <span className="text-[11px] font-bold text-cyan-400">রিয়েল-টাইম (Auto)</span>
          </div>
        </div>

        {/* Dynamic status flags */}
        {syncStatus.status === 'success' && (
          <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[11px] p-2 rounded-lg flex items-start gap-2">
            <CheckCircle size={14} className="shrink-0 mt-0.5" />
            <span>সফলভাবে ডাটাবেজের সাথে সিঙ্ক সম্পন্ন হয়েছে! আপনার সকল প্রোফাইল এবং ট্রানজেকশন ক্লাউডে সেভ রয়েছে।</span>
          </div>
        )}

        {syncStatus.status === 'error' && (
          <div className="bg-red-950/20 border border-red-500/20 text-red-400 text-[11px] p-2 rounded-lg flex flex-col gap-1">
            <div className="flex items-start gap-2">
              <AlertOctagon size={14} className="shrink-0 mt-0.5" />
              <span>ত্রুটি: {syncStatus.errorMessage || 'নেটওয়ার্ক সংযোগ বিঘ্নিত হয়েছে।'}</span>
            </div>
            <button 
              onClick={() => setShowSqlInstructions(!showSqlInstructions)}
              className="text-[10px] text-yellow-405 font-bold hover:underline transition-all mt-1 pl-6 text-left"
            >
              🛠️ এই প্রবলেম কিভাবে সলভ করবেন? (এখানে ক্লিক করুন)
            </button>
          </div>
        )}
      </div>

      {/* Action triggers */}
      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={isSyncing}
          onClick={handlePush}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md disabled:cursor-not-allowed transform active:scale-98"
        >
          {isSyncing ? (
            <RefreshCw size={13} className="animate-spin text-white" />
          ) : (
            <ArrowUpRight size={13} className="text-cyan-200" />
          )}
          <span>ডাটা ক্লাউডে পাঠান</span>
        </button>

        <button
          type="button"
          disabled={isSyncing}
          onClick={handlePull}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-900 border border-[#1b3d69]/50 hover:bg-slate-850 disabled:bg-slate-950 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed transform active:scale-98"
        >
          {isSyncing ? (
            <RefreshCw size={13} className="animate-spin text-slate-400" />
          ) : (
            <ArrowDownLeft size={13} className="text-yellow-400" />
          )}
          <span>ডাটা ডাউনলোড করুন</span>
        </button>
      </div>

      {/* How to use & SQL panel */}
      {showSqlInstructions && (
        <div className="bg-[#121c2c] border border-yellow-500/20 rounded-lg p-3 text-[11px] space-y-2 text-slate-300 transition-all duration-300">
          <span className="font-bold text-yellow-400 block">💡 প্রথম ব্যবহারের গাইডলাইন:</span>
          <p className="leading-relaxed">
            যদি আপনার Supabase-এ টেবিল স্ট্রাকচার বা ডাটাবেজ স্কিমা তৈরি করা না থাকে, তবে সিঙ্কিং এর সময় এরর দেখাতে পারে। নিচের সহজ মাত্র ৩টি ধাপ সম্পন্ন করুন:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed font-sans">
            <li>আপনার Supabase পোর্টালের ড্যাশবোর্ডে লগইন করুন।</li>
            <li>বাম দিকের মেনু থেকে <strong className="text-slate-100">SQL Editor</strong> অপশনে ক্লিক করুন এবং একটি <span className="text-yellow-400 font-mono">"New Query"</span> খুলুন।</li>
            <li>আপনার রুট ফোল্ডারে থাকা <strong className="text-slate-100 italic">SUPABASE_SCHEMA.sql</strong> ফাইলের কন্টেন্টগুলোকে কপি করে সেখানে পেস্ট করুন এবং <strong className="text-green-400">Run</strong> বাটনে চাপ দিন।</li>
          </ol>
          <div className="bg-[#070b13] p-1.5 rounded text-[10px] text-yellow-500/80 font-mono border border-slate-900 overflow-x-auto">
            profiles, wallets, transactions, notifications টেবিলসমূহ তৈরি হবে।
          </div>
        </div>
      )}

      {/* Database Schema Status Trackers */}
      <div className="bg-[#090f19] p-2 rounded-lg border border-[#16335a]/50 text-[10px] space-y-1 font-sans">
        <span className="text-slate-400 block font-bold mb-1">প্রোটোকল স্কিমা ট্র্যাকার (PostgreSQL):</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
          <div className="flex items-center justify-between">
            <span>● Profiles (ইউজার মেটা)</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>● Wallets (ব্যালেন্স এন্ড ট্র্যাকিং)</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>● Transactions (লেজার জমা)</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>● Notifications (ইনবক্স নোটিফিকেশন)</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
