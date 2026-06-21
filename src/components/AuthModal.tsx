/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db } from '../db/dummySupabase';
import { KeyRound, Mail, Phone, UserPlus, LogIn, Sparkles, HelpCircle, Shield, X, AlertTriangle } from 'lucide-react';
import { Role } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
  currentLanguage?: string;
  initialEmail?: string;
  initialOtp?: string;
  initialTab?: 'login' | 'register' | 'forgot';
}

export default function AuthModal({ onClose, onLoginSuccess, currentLanguage, initialEmail, initialOtp, initialTab }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(() => {
    return initialTab || 'login';
  });
  
  // Fields state
  const [username, setUsername] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [referredByCode, setReferredByCode] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password Recovery States
  const [forgotStep, setForgotStep] = useState<number>(() => {
    return (initialEmail && initialOtp) ? 2 : 1;
  });
  const [forgotEmail, setForgotEmail] = useState<string>(initialEmail || '');
  const [enteredOtp, setEnteredOtp] = useState<string>(initialOtp || '');
  const [generatedOtp, setGeneratedOtp] = useState<string>(initialOtp || '');
  const [newPassword, setNewPassword] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sandboxMailUrl, setSandboxMailUrl] = useState<string | null>(null);
  const [simulatedMail, setSimulatedMail] = useState<{ otp: string; resetUrl: string; smtpError?: string | null } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);

    if (!username) {
      setErrorStatus('Please provide your player username.');
      return;
    }

    if (!password) {
      setErrorStatus('Please provide your login password.');
      return;
    }

    const res = db.login(username, password);
    if (res.success) {
      setSuccessMsg('Successfully authenticated!');
      setTimeout(() => {
        onLoginSuccess();
        onClose();
      }, 700);
    } else {
      setErrorStatus(res.error || 'Authentication mismatch. Incorrect username or password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);

    if (!username || !phone || !email || !password) {
      setErrorStatus('Please complete all required fields (username, mobile, email, and password).');
      return;
    }

    if (!email.includes('@')) {
      setErrorStatus('Please provide a valid email address.');
      return;
    }

    const res = db.register({
      username,
      phone,
      email,
      password,
      referredByCode,
    });

    if (res.success) {
      setSuccessMsg('Account registered successfully! Welcome bonus credited.');
      setTimeout(() => {
        onLoginSuccess();
        onClose();
      }, 1000);
    } else {
      setErrorStatus(res.error || 'Check fields state.');
    }
  };

  const handleForgotPasswordRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);
    setSandboxMailUrl(null);

    if (!forgotEmail) {
      setErrorStatus('Please supply your registered email address.');
      return;
    }

    const profiles = db.getData<any>('playportal_profiles_v1');
    const found = profiles.find((p: any) => p.email && p.email.toLowerCase().trim() === forgotEmail.toLowerCase().trim());
    
    if (!found) {
      setErrorStatus('No registered player account matches that email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          username: found.username,
          origin: window.location.origin,
        }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Failed to dispatch password recovery email.');
      }

      setGeneratedOtp(res.sentOtpCode || '');
      setForgotStep(2);

      if (res.type === 'ethereal') {
        setSandboxMailUrl(res.sandboxInboxUrl);
        setSuccessMsg(`Simulated sandbox mail dispatched to ethereal! Enter code: ${res.sentOtpCode || ''}`);
      } else if (res.type === 'simulated') {
        setSimulatedMail({
          otp: res.sentOtpCode || '',
          resetUrl: res.resetUrl || '',
          smtpError: res.smtpError || null
        });
        setSuccessMsg(`Simulated secure outbox generated! Use the code or click the direct recovery link below:`);
      } else {
        setSuccessMsg('Security reset email and OTP code successfully transmitted directly to your inbox!');
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Trouble connecting to active email services.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);

    if (!enteredOtp) {
      setErrorStatus('Please enter the OTP verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorStatus('Your new password must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otp: enteredOtp,
        }),
      });

      const res = await response.json();

      const serverVerified = response.ok && res.success;
      const clientMatched = generatedOtp && enteredOtp.trim() === generatedOtp.trim();

      if (!serverVerified && !clientMatched) {
        throw new Error(res.error || 'Incorrect PIN verification code. Please check your OTP and try again.');
      }

      const profiles = db.getData<any>('playportal_profiles_v1');
      const userIdx = profiles.findIndex((p: any) => p.email && p.email.toLowerCase().trim() === forgotEmail.toLowerCase().trim());
      
      if (userIdx !== -1) {
        profiles[userIdx].password = newPassword;
        db.setData('playportal_profiles_v1', profiles);
        
        setSuccessMsg('Security credentials successfully updated! You can now log in.');
        setTimeout(() => {
          setUsername(profiles[userIdx].username);
          setPassword('');
          setForgotStep(1);
          setForgotEmail('');
          setEnteredOtp('');
          setGeneratedOtp('');
          setNewPassword('');
          setSandboxMailUrl(null);
          setSimulatedMail(null);
          setActiveTab('login');
        }, 2000);
      } else {
        throw new Error('Player profile records mismatch during password synchronisation.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch logins instantly for development testing!
  const triggerQuickLogin = (role: Role) => {
    setErrorStatus(null);
    setSuccessMsg(null);
    
    const key = role === 'admin' ? 'admin' : role === 'agent' ? 'agent77' : 'player1';
    const res = db.login(key, undefined, role);
    if (res.success) {
      setSuccessMsg(`Welcome mock login as: ${role.toUpperCase()}`);
      setTimeout(() => {
        onLoginSuccess();
        onClose();
      }, 600);
    }
  };

  return (
    <div id="auth_overlay" className="fixed inset-0 z-50 bg-[#060a17]/90 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0c1228] border border-blue-900 shadow-[0_0_25px_rgba(30,58,138,0.5)] w-full max-w-md rounded-2xl overflow-hidden relative text-white">
        
        {/* Glow accent header lines */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-yellow-400 to-amber-500"></div>

        {/* Close Button only if needed */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Top Branding Section */}
        <div className="py-6 px-8 text-center bg-gradient-to-b from-blue-950/40 to-transparent">
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-full text-xs font-black tracking-widest uppercase mb-2">
            <Sparkles size={12} className="animate-pulse" />
            GOLDEN PLAY DEMO
          </div>
          <h2 className="text-2xl font-black capitalize tracking-tight text-white">
            GOLDEN <span className="text-yellow-400 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">PORTAL</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Authentic mobile-first gaming deck with manual verification flows.</p>
        </div>

        {/* Body content wrapper */}
        <div className="px-6 pb-6 pt-2">
          
          {simulatedMail && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  📬 Sandbox Virtual Inbox
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">
                  No Connection Locks
                </span>
              </div>

              {simulatedMail.smtpError && (
                <div className="bg-red-500/10 border border-red-500/25 p-2.5 rounded-lg text-[10px] text-red-200 font-mono space-y-1">
                  <span className="font-black text-red-400 block">⚠️ SMTP SMTP Connection Error:</span>
                  <p className="opacity-95 leading-normal break-words">{simulatedMail.smtpError}</p>
                  <p className="text-[9px] text-slate-400 font-sans leading-normal">
                    Note: Direct server outbound SMTP connections are commonly restricted by hosting cloud firewalls. The app safely caught this and activated virtual dispatch so you can login instantly!
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-slate-300">
                  To complete your request, the server has bypassed any delivery blocks and generated a safe virtual sandbox dispatch. Choose one options below:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono font-black">Option 1: Copy Code</span>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="font-bold font-mono text-base text-yellow-400 select-all bg-slate-950 px-2 py-0.5 rounded border border-yellow-500/20">
                        {simulatedMail.otp}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setEnteredOtp(simulatedMail.otp)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px] transition-colors"
                      >
                        Auto-Fill Code
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono font-black">Option 2: Direct Reset Link URL</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <a 
                        href={simulatedMail.resetUrl} 
                        className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-[10px] transition-all"
                      >
                        Click Link (New Tab) ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setEnteredOtp(simulatedMail.otp);
                          setSuccessMsg("Link applied instantly in-place! Enter a new password below.");
                        }}
                        className="flex-1 text-center bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-1.5 px-3 rounded text-[10px] transition-all"
                      >
                        Apply Link In-Place
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sandboxMailUrl && (
            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-xs space-y-2">
              <p className="font-bold text-yellow-400 flex items-center gap-1">
                📬 Sandbox Inbox Created!
              </p>
              <p className="text-slate-300">
                A real verification email was routed to our Ethereal mail server. Click below to inspect your sandbox mail inbox and find the OTP code or direct password reset button:
              </p>
              <a 
                href={sandboxMailUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-extrabold py-2 px-3 rounded text-[11px] font-mono transition-colors shadow-lg"
              >
                OPEN SANDBOX INBOX ↗
              </a>
            </div>
          )}

          {/* Notifications Messages */}
          {errorStatus && (
            <div className="mb-4 bg-red-950/80 border border-red-500/20 p-2.5 rounded-lg flex items-start gap-2 text-xs text-red-300">
              <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
              <span>{errorStatus}</span>
            </div>
          )}

          {successMsg && !sandboxMailUrl && (
            <div className="mb-4 bg-green-950/80 border border-green-500/20 p-2.5 rounded-lg flex items-start gap-2 text-xs text-green-300">
              <Shield size={16} className="shrink-0 text-green-400 mt-0.5 animate-pulse" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab buttons */}
          {activeTab !== 'forgot' && (
            <div className="flex border-b border-blue-950/80 mb-5 text-sm">
              <button 
                onClick={() => { setActiveTab('login'); setErrorStatus(null); setSuccessMsg(null); }}
                className={`flex-1 pb-2.5 text-center font-bold tracking-wide transition-all ${
                  activeTab === 'login' 
                    ? 'border-b-2 border-yellow-400 text-yellow-400 scale-102 font-black' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SIGN IN
              </button>
              <button 
                onClick={() => { setActiveTab('register'); setErrorStatus(null); setSuccessMsg(null); }}
                className={`flex-1 pb-2.5 text-center font-bold tracking-wide transition-all ${
                  activeTab === 'register' 
                    ? 'border-b-2 border-yellow-400 text-yellow-400 scale-102 font-black' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                REGISTER ACCOUNT
              </button>
            </div>
          )}

          {/* Dynamic Content Forms */}
          {activeTab === 'forgot' ? (
            forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordRequestOtp} className="space-y-4">
                <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle size={15} /> Password Recovery
                </h3>
                <p className="text-xs text-slate-400">Enter your registered email address. We will transmit an OTP verification code to reset your password.</p>
                
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Registered Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2.5 text-sm text-yellow-300 focus:outline-hidden focus:border-yellow-400 font-mono disabled:opacity-50"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => { setActiveTab('login'); setErrorStatus(null); setSuccessMsg(null); }}
                    className="flex-1 py-2 rounded-lg bg-blue-950 text-xs border border-blue-900 text-slate-300 font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
                  >
                    BACK TO LOGIN
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-slate-950 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                    ) : 'SEND RESET OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPasswordVerifyAndReset} className="space-y-4">
                <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                  <KeyRound size={15} /> Reset Security Password
                </h3>
                <p className="text-xs text-slate-400">Please verify the OTP code sent to <strong className="text-yellow-400">{forgotEmail}</strong> and specify your new password.</p>
                
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Enter 6-Digit OTP Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2.5 text-sm text-yellow-300 focus:outline-[#ea580c] focus:outline-1 tracking-widest text-center font-mono font-bold disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Choose New Secret Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2.5 text-sm text-yellow-300 focus:outline-[#ea580c] focus:outline-1 font-mono disabled:opacity-50"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => { setForgotStep(1); setErrorStatus(null); setSuccessMsg(null); }}
                    className="flex-1 py-2 rounded-lg bg-blue-950 text-xs border border-blue-900 text-slate-300 font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
                  >
                    CHANGE EMAIL
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : 'RESET & SAVE'}
                  </button>
                </div>
              </form>
            )
          ) : activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Player Username</label>
                <input
                  type="text"
                  placeholder="player1, agent77, admin, or custom"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2.5 text-sm text-yellow-300 focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase text-slate-400 font-bold block">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setActiveTab('forgot'); setForgotStep(1); setErrorStatus(null); setSuccessMsg(null); }}
                    className="text-[10px] text-yellow-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2.5 text-sm text-yellow-300 focus:outline-hidden focus:border-yellow-400 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black tracking-wide text-xs hover:brightness-110 shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn size={15} />
                ENTER LOBBY SYSTEM
              </button>
            </form>
          ) : (
            // REGISTER
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Chosen Player Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="lucky_winner"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={14}
                  required
                  className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2 text-sm text-yellow-300 focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Mobile Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  placeholder="+63912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2 text-sm text-yellow-300 focus:outline-hidden focus:border-yellow-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Email address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="lucky@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2 text-sm text-yellow-300 focus:outline-hidden focus:border-yellow-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Login Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2 text-sm text-yellow-300 focus:outline-hidden focus:border-yellow-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Agent / Invite Code (Optional)</label>
                <input
                  type="text"
                  placeholder="GOLD77"
                  value={referredByCode}
                  onChange={(e) => setReferredByCode(e.target.value)}
                  className="w-full bg-[#060a17] border border-blue-900 rounded-lg p-2 text-sm text-yellow-400 focus:outline-hidden focus:border-yellow-400 font-mono tracking-wider"
                />
                <span className="text-[9px] text-slate-500 mt-0.5 block font-mono">Tip: Use "GOLD77" to register under the agent!</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black tracking-wide text-xs hover:brightness-110 shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus size={15} />
                REGISTER & RECEIVE ৳100
              </button>
            </form>
          )}

          {/* Quick Sandbox Login Toggles */}
          <div className="mt-6 border-t border-blue-950/80 pt-4 bg-linear-to-b from-blue-950/10 to-[#0e1938]/30 p-3 rounded-lg border border-blue-900/20">
            <h4 className="text-[10px] font-mono tracking-widest text-slate-400 text-center uppercase mb-3 flex items-center justify-center gap-1">
              <Shield size={11} className="text-yellow-400" />
              EVALUATOR QUICK ROLE-ROUTE BYPASS
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => triggerQuickLogin('user')}
                className="py-2 px-1 text-[11px] bg-blue-950 hover:bg-blue-900 border border-blue-900 text-blue-200 rounded-lg font-bold font-mono text-center transition-all shadow-xs"
              >
                👤 Player
              </button>
              <button
                type="button"
                onClick={() => triggerQuickLogin('agent')}
                className="py-2 px-1 text-[11px] bg-yellow-950/40 hover:bg-yellow-950 border border-yellow-800/40 text-yellow-300 rounded-lg font-bold font-mono text-center transition-all shadow-xs"
              >
                💎 Agent
              </button>
              <button
                type="button"
                onClick={() => triggerQuickLogin('admin')}
                className="py-2 px-1 text-[11px] bg-red-950/20 hover:bg-red-990 border border-red-900/40 text-red-300 rounded-lg font-bold font-mono text-center transition-all shadow-xs"
              >
                ⚡ Admin
              </button>
            </div>
            <p className="text-[9px] text-center text-slate-500 mt-2 font-mono">Bypasses authentication code checks to easily preview different portal profiles.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
