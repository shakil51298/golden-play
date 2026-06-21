import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db/dummySupabase';
import { MessageCircle, Headphones, Send, User, ChevronDown, CheckCheck, Loader2 } from 'lucide-react';

interface SupportChatWidgetProps {
  onClose: () => void;
  username?: string;
  currentLanguage?: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export default function SupportChatWidget({ onClose, username = 'Player', currentLanguage }: SupportChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial automated greeting
    setMessages([
      {
        id: 'msg-init-1',
        sender: 'bot',
        text: `Hello ${username}! Welcome to Golden Play Customer Support Desk. 💖`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'msg-init-2',
        sender: 'bot',
        text: "I am your automated Golden-Agent support buddy. How can I help you today? You can choose one of the quick topics below, or type your custom concern!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, [username]);

  useEffect(() => {
    // Auto scroll chat to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTopicClick = (topicKey: string, topicLabel: string) => {
    // User message
    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: topicLabel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Bot reply calculation
    setTimeout(() => {
      let botText = '';
      if (topicKey === 'deposit') {
        botText = "💳 **GCASH / BANK DEPOSIT GUIDELINES:** \nTo deposit, head to your **Wallet Panel**, click **Deposit**, choose GCash, enter your deposit amount, and copy our reference account. \nOnce sent, submit the transaction Ref-No with your player account. Our staff audits and credits inside 1-3 minutes!";
      } else if (topicKey === 'withdraw') {
        botText = "💸 **WITHDRAWAL LEDGERS:** \nYou can submit a withdrawal request at any time from your Wallet. All pending balances are held securely. Once approved by our team, cash transitions directly into your GCash account or bank. No extra fees are charged!";
      } else if (topicKey === 'agent') {
        botText = "💎 **WANT TO BECOME AN AGENT?** \nAgents can recruit and manage sub-players to earn up to **45% lifetime revenue commissions**! To register as an Agent, sign in as a player and navigate to the **Affiliate Center** or submit an application within the Agent Desk. Our administrative team will update your account permissions!";
      } else if (topicKey === 'payouts') {
        botText = "🎰 **SLOT MACHINES PAYOUT RATES:** \nGolden Play operates high-RTP slots (average 97.4%). All payout triggers utilize local deterministic seed formulas. Jackpot triggers contribute to the progressive ticker pool!";
      } else {
        botText = "Thank you for reaching out. Please make sure to register / sign-in with your unique phone number so our manual agent ledger can review and link your game logs safely.";
      }

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    setInputVal('');

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Process conversational text keywords
    setTimeout(() => {
      let replyText = '';
      const lower = userText.toLowerCase();

      if (lower.includes('deposit') || lower.includes('pay') || lower.includes('gcash') || lower.includes('recharge')) {
        replyText = "💳 We support local GCash, BKash, Agent Ledgers, and USDT. All deposit submissions require you to paste the official cash-out Ref-No so our automated audits can match it instantly.";
      } else if (lower.includes('withdraw') || lower.includes('payout') || lower.includes('cashout') || lower.includes('money')) {
        replyText = "💸 Withdrawal orders are handled manually by local master-agents 24 hours a day. Usually processing takes only 5 to 15 minutes! Please double check your cash out wallet numbers before applying.";
      } else if (lower.includes('agent') || lower.includes('affiliate') || lower.includes('refer') || lower.includes('commission')) {
        replyText = "💎 Golden Play offers an immersive Broker Dashboard! You can earn 10% instant commissions on cash deposits made by your direct recruits. Navigate to 'Affiliate' in the bottom menu or explore 'Refer Earn' from the side panel.";
      } else if (lower.includes('cheat') || lower.includes('hack') || lower.includes('win') || lower.includes('free')) {
        replyText = "🎰 All slots operate with strict mathematical integrity. Claim your automatic ৳100 Welcome registration bonus, and use the daily VIP allowance check-in to boost your risk-free wagering credits!";
      } else if (lower.includes('bengali') || lower.includes('bangla') || lower.includes('ভাষা')) {
        replyText = "🇧🇩 প্রিয় গ্রাহক, গোল্ডেন প্লে-তে আপনাকে স্বাগতম! আমাদের সাইটে ডিপোজিট করতে ওয়ালেটে যান ও ডিপোজিট সাবমিট করুন। যেকোনো সমস্যায় আমাদের চ্যাটে জানান।";
      } else {
        replyText = "I have recorded your query: \"" + userText + "\". \nOur administration is active in our Telegram group and GCash agent ledger nodes. We will resolve your concern right away! Please make sure your registered phone number is verified.";
      }

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1400);
  };

  return (
    <div id="customer-support-chat-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#182628] to-[#0a1112] border border-[#2b4c50] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
        
        {/* Support Chat Header */}
        <div className="p-4 bg-gradient-to-r from-[#17383c] to-[#112a2c] border-b border-[#2b4c50]/60 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-400 text-slate-950 rounded-lg">
              <Headphones size={16} className="animate-pulse" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest leading-none">Golden Play Operator</h4>
              <div className="flex items-center gap-1 mt-1 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-ping"></span>
                <span className="text-[9px] font-mono text-cyan-300">24/7 Agent Connected</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-black/40 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center text-[10px] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Message Feeds Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin bg-black/20">
          
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div 
                key={msg.id}
                className={`flex gap-2 text-xs ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-6 h-6 rounded-full bg-[#203f44] text-cyan-300 border border-[#2d565b] flex items-center justify-center text-[10px] shrink-0 font-bold">
                    GP
                  </div>
                )}
                
                <div className="max-w-[78%] space-y-1">
                  <div className={`p-2.5 rounded-xl whitespace-pre-line leading-relaxed text-[11px] shadow-sm ${
                    isBot 
                      ? 'bg-slate-900 border border-[#1b3f44]/40 text-slate-200 rounded-tl-none' 
                      : 'bg-[#214d52] border border-[#2c656b] text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                  
                  <div className={`text-[8.5px] font-mono text-slate-500 flex items-center gap-1 ${
                    isBot ? 'justify-start' : 'justify-end'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {!isBot && <CheckCheck size={10} className="text-[#3fc0cc]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2 items-center text-xs justify-start">
              <div className="w-6 h-6 rounded-full bg-[#203f44] text-cyan-300 border border-[#2d565b] flex items-center justify-center text-[10px] font-bold">
                GP
              </div>
              <div className="bg-slate-900 border border-[#1b3f44]/40 p-2 rounded-xl rounded-tl-none text-[10.5px] text-zinc-400 flex items-center gap-1.5 font-mono">
                <Loader2 size={10} className="animate-spin text-[#3fc0cc]" /> Agent is typing responses...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Click Topic Suggestions list */}
        <div className="p-2 border-t border-[#2b4c50]/20 bg-[#0e1718] shrink-0 space-y-1">
          <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider block px-1">Choose Quick Help Topic:</span>
          
          <div className="flex flex-wrap gap-1">
            {[
              { key: 'deposit', label: '💳 GCash Deposit' },
              { key: 'withdraw', label: '💸 Manual Cashout' },
              { key: 'agent', label: '💎 Earn Lifetime 45%' },
              { key: 'payouts', label: '🎰 Slot Machines Luck' },
            ].map(topic => (
              <button
                key={topic.key}
                onClick={() => handleTopicClick(topic.key, topic.label)}
                className="py-1 px-2 rounded-md bg-slate-950 hover:bg-[#132d30] border border-[#234246] hover:border-cyan-300/40 text-[9.5px] font-bold text-slate-300 hover:text-white cursor-pointer transition-all"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat input box form */}
        <form 
          onSubmit={handleSendMessage}
          className="p-2 bg-slate-950 border-t border-[#2b4c50]/40 flex gap-1.5 items-center shrink-0"
        >
          <input
            type="text"
            placeholder="Write message to operator..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-grow p-2 text-xs bg-[#0b1213] border border-[#234246] focus:border-cyan-400 rounded-lg text-slate-250 placeholder:text-slate-650 focus:outline-hidden"
          />
          <button
            type="submit"
            className="w-8 h-8 rounded-lg bg-[#275d63] hover:bg-[#347c84] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <Send size={14} />
          </button>
        </form>

      </div>
    </div>
  );
}
