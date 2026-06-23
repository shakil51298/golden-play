/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../db/dummySupabase';
import { syncService } from '../db/supabaseSync';
import { UserProfile, Wallet, Transaction, Promotion, Banner, PortalAnnouncement } from '../types';
import { Shield, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Check, X, Megaphone, Trash, Edit, RefreshCw, Layout, Database, Activity, LogOut, Settings, Coins } from 'lucide-react';
import SupabaseSyncWidget from './SupabaseSyncWidget';
import {
  getPaymentSettings,
  paymentChannels,
  paymentProviders,
  PAYMENT_SETTINGS_STORAGE_KEY,
  PAYMENT_SETTINGS_UPDATED_EVENT,
  PaymentChannel,
  PaymentProviderId,
  PaymentSetting,
  pullPaymentSettingsFromSupabase,
  pushPaymentSettingsToSupabase,
  savePaymentSettings,
} from '../lib/paymentSettings';

interface AdminPanelProps {
  onBalanceChange: () => void;
  onClose: () => void;
  onGoHome: () => void;
}

export default function AdminPanel({ onBalanceChange, onClose, onGoHome }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'marketing' | 'payments' | 'database' | 'controls'>('requests');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProviderId>('TKPAY');
  const [selectedPaymentChannel, setSelectedPaymentChannel] = useState<PaymentChannel>('bkash');
  const [paymentDraft, setPaymentDraft] = useState<PaymentSetting | null>(null);

  // Announcement states
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<string>('');

  // Rich Customer Popup Announcements (Bengal promo style) states
  const [popupAnnouncements, setPopupAnnouncements] = useState<PortalAnnouncement[]>([]);
  const [popupTabTitle, setPopupTabTitle] = useState<string>('');
  const [popupMainTitle, setPopupMainTitle] = useState<string>('');
  const [popupSubtitle, setPopupSubtitle] = useState<string>('');
  const [popupContent, setPopupContent] = useState<string>('');
  const [popupBadge, setPopupBadge] = useState<string>('');
  const [popupImageLink, setPopupImageLink] = useState<string>('');
  
  // Custom reward parameter rows
  const [rewardLabel1, setRewardLabel1] = useState<string>('');
  const [rewardValue1, setRewardValue1] = useState<string>('');
  const [rewardLabel2, setRewardLabel2] = useState<string>('');
  const [rewardValue2, setRewardValue2] = useState<string>('');
  const [rewardLabel3, setRewardLabel3] = useState<string>('');
  const [rewardValue3, setRewardValue3] = useState<string>('');
  const [rewardLabel4, setRewardLabel4] = useState<string>('');
  const [rewardValue4, setRewardValue4] = useState<string>('');

  // Game control outcomes states
  const [gameControlModels, setGameControlModels] = useState<any[]>([]);
  const [gameMappings, setGameMappings] = useState<{ [gameId: string]: string }>({});
  const [allGames, setAllGames] = useState<any[]>([]);

  // Banner Management states
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerTemplate, setBannerTemplate] = useState<'left-text-right-image' | 'left-image-right-text' | 'full-image'>('full-image');
  const [bannerTitle1, setBannerTitle1] = useState<string>('');
  const [bannerTitle2, setBannerTitle2] = useState<string>('');
  const [bannerSubtitle, setBannerSubtitle] = useState<string>('');
  const [bannerImgLink, setBannerImgLink] = useState<string>('');
  const [bannerBgColor, setBannerBgColor] = useState<string>('linear-gradient(135deg, #020b24 0%, #031c54 50%, #020b24 100%)');
  const [bannerPromo, setBannerPromo] = useState<string>('');
  const [bannerTitleFontSize, setBannerTitleFontSize] = useState<string>('balanced');
  const [bannerMechanics, setBannerMechanics] = useState<string>('');
  const [bannerMechanicsFontSize, setBannerMechanicsFontSize] = useState<number>(14);
  const [bannerFeedback, setBannerFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isBannerUploading, setIsBannerUploading] = useState<boolean>(false);
  const [isBannerSaving, setIsBannerSaving] = useState<boolean>(false);

  // Promo Form Fields
  const [promoTitle, setPromoTitle] = useState<string>('');
  const [promoDesc, setPromoDesc] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoBonus, setPromoBonus] = useState<string>('50');
  const [promoMinDep, setPromoMinDep] = useState<string>('100');
  const [promoType, setPromoType] = useState<'welcome' | 'rebate' | 'vip' | 'daily'>('welcome');

  const [feedback, setFeedback] = useState<string | null>(null);

  const showBannerFeedback = (type: 'success' | 'error' | 'info', message: string, autoClear = true) => {
    setBannerFeedback({ type, message });
    setFeedback(message);
    if (autoClear) {
      setTimeout(() => {
        setBannerFeedback(null);
        setFeedback(null);
      }, 4500);
    }
  };

  const getBannerPublishErrorMessage = (error?: string) => {
    const detail = error || 'Supabase sync failed.';
    if (detail.toLowerCase().includes('row-level security')) {
      return `Supabase blocked banner publishing with RLS. Run BANNER_RLS_FIX.sql in the Supabase SQL Editor, then publish again. Details: ${detail}`;
    }
    return detail;
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the selected image file.'));
      reader.onload = (evt) => {
        const result = evt.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Selected image did not produce a readable data URL.'));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const prepareBannerImage = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose a valid image file.');
    }

    const maxOriginalBytes = 8 * 1024 * 1024;
    if (file.size > maxOriginalBytes) {
      throw new Error('Image is too large. Please upload an image under 8MB.');
    }

    if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
      if (file.size > 900 * 1024) {
        throw new Error('GIF/SVG uploads must be under 900KB. Use JPG, PNG, or WEBP for larger banners.');
      }
      return readFileAsDataUrl(file);
    }

    const sourceUrl = await readFileAsDataUrl(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not decode the image. Try a JPG, PNG, or WEBP file.'));
      img.src = sourceUrl;
    });

    const maxWidth = 1400;
    const maxHeight = 420;
    const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Your browser could not prepare the image canvas.');
    }

    ctx.drawImage(image, 0, 0, width, height);
    let quality = 0.86;
    let compressed = canvas.toDataURL('image/jpeg', quality);
    while (compressed.length > 700 * 1024 && quality > 0.52) {
      quality -= 0.08;
      compressed = canvas.toDataURL('image/jpeg', quality);
    }

    if (compressed.length > 700 * 1024) {
      throw new Error('Image is still too large after compression. Please upload a smaller banner.');
    }

    return compressed;
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  useEffect(() => {
    const refreshPaymentSettings = () => setPaymentSettings(getPaymentSettings());
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

  const loadAdminData = () => {
    setTransactions(db.getData<Transaction>('playportal_transactions_v1'));
    setProfiles(db.getData<UserProfile>('playportal_profiles_v1'));
    setWallets(db.getData<Wallet>('playportal_wallets_v1'));
    setPromotions(db.getData<Promotion>('playportal_promotions_v1'));
    setAnnouncements(db.getAnnouncements());
    setBanners(db.getData<Banner>('playportal_banners_v1'));
    setPopupAnnouncements(db.getPopupAnnouncements());
    setGameControlModels(db.getGameControlModels());
    setGameMappings(db.getGameModelMappings());
    setAllGames(db.getData<any>('playportal_games_v1'));
    setPaymentSettings(getPaymentSettings());
    pullPaymentSettingsFromSupabase()
      .then((res) => {
        setPaymentSettings(res.settings);
        if (!res.success && activeTab === 'payments') {
          setFeedback(`Payment database not ready: ${res.error}. Run PAYMENT_SETTINGS_RLS_FIX.sql in Supabase.`);
          setTimeout(() => setFeedback(null), 6000);
        }
      })
      .catch((error) => {
        if (activeTab === 'payments') {
          setFeedback(`Payment database sync failed: ${error.message}`);
          setTimeout(() => setFeedback(null), 6000);
        }
      });
  };

  const selectedPaymentSetting = paymentSettings.find(item => (
    item.provider === selectedPaymentProvider && item.channel === selectedPaymentChannel
  ));

  useEffect(() => {
    setPaymentDraft(selectedPaymentSetting ? { ...selectedPaymentSetting } : null);
  }, [selectedPaymentProvider, selectedPaymentChannel, paymentSettings]);

  const updatePaymentDraft = (patch: Partial<PaymentSetting>) => {
    setPaymentDraft(prev => prev ? { ...prev, ...patch } : prev);
  };

  const publishWalletNumberLive = (walletNumber: string) => {
    const cleanWalletNumber = walletNumber.trim();
    if (!cleanWalletNumber) return;

    const next = getPaymentSettings().map(item => (
      item.channel === selectedPaymentChannel
        ? { ...item, walletNumber: cleanWalletNumber }
        : item
    ));

    savePaymentSettings(next);
    setPaymentSettings(next);
    pushPaymentSettingsToSupabase(next)
      .then((res) => {
        if (!res.success) {
          setFeedback(`Payment number saved locally, but Supabase blocked it: ${res.error}. Run PAYMENT_SETTINGS_RLS_FIX.sql.`);
          setTimeout(() => setFeedback(null), 6000);
        }
      })
      .catch((error) => {
        setFeedback(`Payment number saved locally, but Supabase sync failed: ${error.message}`);
        setTimeout(() => setFeedback(null), 6000);
      });
  };

  const handlePaymentWalletNumberChange = (walletNumber: string) => {
    updatePaymentDraft({ walletNumber });
    publishWalletNumberLive(walletNumber);
  };

  const publishPaymentDraft = async () => {
    if (!paymentDraft) {
      setFeedback('Select a payment provider before updating.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (!paymentDraft.walletNumber.trim()) {
      setFeedback('Wallet number is required before updating users.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const cleanWalletNumber = paymentDraft.walletNumber.trim();
    const next = getPaymentSettings().map(item => {
      if (item.provider === selectedPaymentProvider && item.channel === selectedPaymentChannel) {
        return { ...item, ...paymentDraft, walletNumber: cleanWalletNumber };
      }

      if (item.channel === selectedPaymentChannel) {
        return { ...item, walletNumber: cleanWalletNumber };
      }

      return item;
    });
    savePaymentSettings(next);
    setPaymentSettings(next);
    setPaymentDraft({ ...paymentDraft, walletNumber: cleanWalletNumber });
    const res = await pushPaymentSettingsToSupabase(next);
    if (!res.success) {
      setFeedback(`Payment saved locally, but Supabase blocked it: ${res.error}. Run PAYMENT_SETTINGS_RLS_FIX.sql in Supabase.`);
      setTimeout(() => setFeedback(null), 7000);
      return;
    }
    setFeedback(`${selectedPaymentChannel.toUpperCase()} payment settings updated in Supabase for all users.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleMapGameModel = (gameId: string, modelId: string) => {
    db.setGameModelMapping(gameId, modelId);
    setGameMappings(db.getGameModelMappings());
    setFeedback(`Successfully mapped ${gameId} to outcome model: ${modelId}`);
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleUpdateWinnersLimit = (modelId: string, maxWinners: number) => {
    const res = db.updateGameControlModel(modelId, { maxWinnersPerDay: maxWinners });
    if (res.success) {
      setGameControlModels(res.models);
      setFeedback(`Updated daily winners cap limit to ${maxWinners} for model ${modelId}!`);
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    }
  };

  const handleResetCurrentWinners = (modelId: string) => {
    const res = db.updateGameControlModel(modelId, { currentWinnersToday: 0 });
    if (res.success) {
      setGameControlModels(res.models);
      setFeedback(`Reset winners counter to 0 for model ${modelId}!`);
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    }
  };

  const handleAuditRequest = (txId: string, action: 'approve' | 'reject') => {
    const res = db.adminMutateTransaction(txId, action);
    if (res.success) {
      setFeedback(`Transaction ${txId} successfully ${action}ed!`);
      loadAdminData();
      onBalanceChange();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback(`Error: ${res.error}`);
    }
  };

  const handleRoleChange = (userId: string, newRole: 'user' | 'agent' | 'admin') => {
    const allProfiles = db.getData<UserProfile>('playportal_profiles_v1');
    const matched = allProfiles.find(p => p.id === userId);
    if (matched) {
      matched.role = newRole;
      db.setData('playportal_profiles_v1', allProfiles);
      loadAdminData();
      setFeedback(`User ${matched.username} is now elevated to ${newRole.toUpperCase()}.`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle || !promoCode) {
      setFeedback('Promotion title and alphanumeric promo code are required.');
      return;
    }

    db.addPromotion({
      title: promoTitle,
      description: promoDesc,
      imageUrl: 'bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 border-l-4 border-yellow-400',
      promoCode: promoCode.trim().toUpperCase(),
      bonusAmount: Number(promoBonus) || 0,
      minDepositRequired: Number(promoMinDep) || 0,
      type: promoType,
    });

    setPromoTitle('');
    setPromoDesc('');
    setPromoCode('');
    loadAdminData();
    setFeedback(`New Promotion code "${promoCode.trim().toUpperCase()}" created and live!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleTogglePromo = (id: string) => {
    db.togglePromotion(id);
    loadAdminData();
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) {
      setFeedback('Announcement text cannot be empty.');
      return;
    }
    const updated = [...announcements, newAnnouncement.trim()];
    db.setAnnouncements(updated);
    setAnnouncements(updated);
    setNewAnnouncement('');
    setFeedback('New announcement live!');
    setTimeout(() => setFeedback(null), 3000);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('playportal_announcements_updated'));
  };

  const handleDeleteAnnouncement = (index: number) => {
    const updated = announcements.filter((_, i) => i !== index);
    db.setAnnouncements(updated);
    setAnnouncements(updated);
    setFeedback('Announcement message removed.');
    setTimeout(() => setFeedback(null), 3000);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('playportal_announcements_updated'));
  };

  const handleCreatePopupAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupTabTitle || !popupMainTitle || !popupContent) {
      setFeedback('Tab Title, Main Header Title, and Bengali Content details are required.');
      return;
    }

    const rewardLines = [];
    if (rewardLabel1.trim() && rewardValue1.trim()) {
      rewardLines.push({ label: rewardLabel1.trim(), value: rewardValue1.trim() });
    }
    if (rewardLabel2.trim() && rewardValue2.trim()) {
      rewardLines.push({ label: rewardLabel2.trim(), value: rewardValue2.trim() });
    }
    if (rewardLabel3.trim() && rewardValue3.trim()) {
      rewardLines.push({ label: rewardLabel3.trim(), value: rewardValue3.trim() });
    }
    if (rewardLabel4.trim() && rewardValue4.trim()) {
      rewardLines.push({ label: rewardLabel4.trim(), value: rewardValue4.trim() });
    }

    db.addPopupAnnouncement({
      tabTitle: popupTabTitle.trim(),
      mainTitle: popupMainTitle.trim(),
      subtitle: popupSubtitle.trim() || undefined,
      content: popupContent.trim(),
      badge: popupBadge.trim() || undefined,
      imageUrl: popupImageLink.trim() || undefined,
      rewardLines: rewardLines.length > 0 ? rewardLines : undefined,
      isActive: true,
      order: popupAnnouncements.length + 1,
    });

    // Reset inputs
    setPopupTabTitle('');
    setPopupMainTitle('');
    setPopupSubtitle('');
    setPopupContent('');
    setPopupBadge('');
    setPopupImageLink('');
    setRewardLabel1('');
    setRewardValue1('');
    setRewardLabel2('');
    setRewardValue2('');
    setRewardLabel3('');
    setRewardValue3('');
    setRewardLabel4('');
    setRewardValue4('');

    loadAdminData();
    setFeedback('Created new Interactive Banner Announcement!');
    setTimeout(() => setFeedback(null), 3050);
  };

  const handleTogglePopupAnnouncement = (id: string, activeState: boolean) => {
    db.updatePopupAnnouncement(id, { isActive: !activeState });
    loadAdminData();
    setFeedback('Popup announcement display toggled!');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleDeletePopupAnnouncement = (id: string) => {
    db.deletePopupAnnouncement(id);
    loadAdminData();
    setFeedback('Popup announcement removed.');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleResetAnnouncements = () => {
    const defaults = [
      "🔥 ৳100 Welcome Bonus instantly credited to new registrants! Spin and win real BDT payouts now!",
      "⚡ Golden Play Broker System active: Recruit friends and earn 10% cash commission on every deposit!",
      "🎰 Jackpot Pool currently exceeding ৳150,000.00! Triple Crown matches pay mega jackpots!",
      "💳 Safe Deposit channels fully operational over GCash, Bank Transfer & USDT ERC-20 instantly!"
    ];
    db.setAnnouncements(defaults);
    setAnnouncements(defaults);
    setFeedback('Announcements reset to platform defaults.');
    setTimeout(() => setFeedback(null), 3000);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('playportal_announcements_updated'));
  };

  const handleStartEditBanner = (item: Banner) => {
    setEditingBannerId(item.id);
    setBannerTemplate('full-image');
    setBannerTitle1(item.titleLine1 || item.title || '');
    setBannerTitle2(item.titleLine2 || '');
    setBannerSubtitle(item.subtitle || '');
    setBannerImgLink(item.imageLink || (item.templateType === 'full-image' ? item.imageUrl : '') || '');
    setBannerBgColor(item.bgGradient || ((item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('linear-gradient')) ? item.imageUrl : 'linear-gradient(135deg, #020b24 0%, #031c54 50%, #020b24 100%)'));
    setBannerPromo(item.promoCode || '');
    setBannerTitleFontSize(item.titleFontSize || 'balanced');
    setBannerMechanics(item.offerMechanicsOneLine || '');
    setBannerMechanicsFontSize(item.mechanicsFontSize || 14);
    
    const element = document.getElementById('banner-preview-simulator');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelEditBanner = () => {
    setEditingBannerId(null);
    setBannerTitle1('');
    setBannerTitle2('');
    setBannerSubtitle('');
    setBannerImgLink('');
    setBannerPromo('');
    setBannerBgColor('linear-gradient(135deg, #020b24 0%, #031c54 50%, #020b24 100%)');
    setBannerTemplate('full-image');
    setBannerTitleFontSize('balanced');
    setBannerMechanics('');
    setBannerMechanicsFontSize(14);
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerFeedback(null);
    setIsBannerSaving(true);
    
    try {
      let t1 = bannerTitle1;
      let t2 = bannerTitle2;
      if (bannerTemplate === 'full-image') {
        if (!t1 && !t2) {
          t1 = 'Full-width Designed Banner';
        }
      } else {
        if (!t1 && !t2) {
          showBannerFeedback('error', 'You must enter at least one line of title text for the custom banner.');
          return;
        }
      }

      const imagePayload = bannerImgLink.trim();
      if (!imagePayload) {
        showBannerFeedback('error', 'Please upload an image file before publishing.');
        return;
      }

      const bannerPayload: Partial<Banner> = {
        title: `${t1} ${t2 || ''}`.trim(),
        subtitle: bannerTemplate === 'full-image' ? '' : bannerSubtitle,
        imageUrl: bannerTemplate === 'full-image' ? imagePayload : bannerBgColor,
        promoCode: bannerPromo.trim().toUpperCase() || undefined,
        isActive: true,
        templateType: bannerTemplate,
        titleLine1: t1,
        titleLine2: t2,
        imageLink: imagePayload,
        bgGradient: bannerTemplate === 'full-image' ? 'transparent' : bannerBgColor,
        titleFontSize: bannerTitleFontSize,
        offerMechanicsOneLine: bannerTemplate === 'full-image' ? undefined : (bannerMechanics.trim() || undefined),
        mechanicsFontSize: Number(bannerMechanicsFontSize) || 14,
      };

      const wasEditing = Boolean(editingBannerId);

      if (editingBannerId) {
        db.updateBanner(editingBannerId, bannerPayload);
        setEditingBannerId(null);
      } else {
        db.addBanner(bannerPayload);
      }

      setBannerTitle1('');
      setBannerTitle2('');
      setBannerSubtitle('');
      setBannerImgLink('');
      setBannerPromo('');
      setBannerBgColor('linear-gradient(135deg, #020b24 0%, #031c54 50%, #020b24 100%)');
      setBannerTemplate('full-image');
      setBannerTitleFontSize('balanced');
      setBannerMechanics('');
      setBannerMechanicsFontSize(14);
      
      loadAdminData();
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('playportal_banners_updated'));

      const syncResult = await syncService.pushBannersToSupabase();
      if (!syncResult.success) {
        showBannerFeedback('error', `Banner saved locally, but failed to publish for incognito/all users: ${getBannerPublishErrorMessage(syncResult.error)}`, false);
        return;
      }

      showBannerFeedback(
        'success',
        wasEditing
          ? 'Banner updated successfully and published for all users.'
          : 'Banner uploaded successfully and published for all users.',
      );
    } catch (err: any) {
      const message = err?.name === 'QuotaExceededError'
        ? 'Browser storage is full. Upload a smaller compressed banner or delete old banners first.'
        : (err?.message || 'Banner could not be saved. Please try again.');
      showBannerFeedback('error', message, false);
    } finally {
      setIsBannerSaving(false);
    }
  };

  const publishBannerListChange = async (successMessage: string) => {
    loadAdminData();
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('playportal_banners_updated'));

    const syncResult = await syncService.pushBannersToSupabase();
    if (!syncResult.success) {
      showBannerFeedback('error', `Banner change saved locally, but failed to update for all users: ${getBannerPublishErrorMessage(syncResult.error)}`, false);
      return;
    }

    showBannerFeedback('success', successMessage);
  };

  const handleToggleBanner = async (id: string) => {
    db.toggleBanner(id);
    await publishBannerListChange('Banner visibility updated for all users.');
  };

  const handleDeleteBanner = async (id: string) => {
    db.deleteBanner(id);
    await publishBannerListChange('Banner deleted and removed from public lobby.');
  };

  // Compute Platform Totals for stats card
  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  const pendingWithdraws = transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');
  const approvedDepositsSum = transactions
    .filter(t => t.type === 'deposit' && t.status === 'approved')
    .reduce((sum, current) => sum + current.amount, 0);
  const approvedWithdrawsSum = transactions
    .filter(t => t.type === 'withdraw' && t.status === 'approved')
    .reduce((sum, current) => sum + current.amount, 0);
  const adminMenuItems: {
    id: typeof activeTab;
    label: string;
    description: string;
    icon: string;
    count?: number;
    accent?: 'blue' | 'cyan' | 'rose';
  }[] = [
    {
      id: 'requests',
      label: 'Requests',
      description: 'Deposits and withdrawals',
      icon: '📋',
      count: pendingDeposits.length + pendingWithdraws.length,
      accent: 'blue',
    },
    {
      id: 'users',
      label: 'Users',
      description: 'Roles and balances',
      icon: '👥',
      accent: 'blue',
    },
    {
      id: 'marketing',
      label: 'Promo / Slides',
      description: 'Hero banners and offers',
      icon: '📣',
      accent: 'blue',
    },
    {
      id: 'payments',
      label: 'Payments',
      description: 'Provider wallet numbers',
      icon: '💳',
      accent: 'cyan',
    },
    {
      id: 'database',
      label: 'Supabase Cloud',
      description: 'Sync and migration tools',
      icon: '☁️',
      accent: 'cyan',
    },
    {
      id: 'controls',
      label: 'Game Rig Controls',
      description: 'Outcome model settings',
      icon: '🎯',
      accent: 'rose',
    },
  ];

  return (
    <div id="admin_panel_container" className="fixed inset-0 z-50 bg-[#060a17] flex flex-col font-sans text-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* ========================================= */}
      {/* ENTERPRISE ADMIN MAIN TOP NAVIGATION BAR  */}
      {/* ========================================= */}
      <header className="bg-[#091026] border-b border-blue-900/60 shadow-lg shrink-0 flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-3 sm:p-4 lg:px-6 gap-3 lg:gap-4 z-20">
        
        {/* Left Side: Brand Logo and Title */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-rose-400 rounded-xl shadow-inner shadow-red-500/5">
            <Shield size={24} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-xs sm:text-sm font-black tracking-widest uppercase text-slate-100 font-sans leading-tight">
                GOLDEN PLAY ADMIN DOMAIN
              </h1>
            </div>
            <p className="text-[9px] sm:text-[10px] text-blue-400 font-mono tracking-tight font-semibold leading-snug">
              ROLE COMPLIANCE: MASTER EXECUTIVE DESK
            </p>
          </div>
        </div>

        {/* Right Side: Security Code Sign-out Widget */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto lg:gap-4">
          <div className="text-right hidden xl:block">
            <span className="text-[9px] text-slate-500 block font-mono uppercase">System Node Connection</span>
            <span className="text-[11px] font-bold text-yellow-400/90 font-mono">STATUS: MASTER ACTIVE</span>
          </div>
          <button 
            type="button"
            onClick={onGoHome}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-yellow-500/40 rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-yellow-500/20 cursor-pointer"
          >
            <span>🏠</span>
            <span>HOME</span>
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-red-500/20 cursor-pointer"
          >
            <LogOut size={14} />
            <span>EXIT CONSOLE</span>
          </button>
        </div>

      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden bg-gradient-to-b from-[#060a17] via-[#050813] to-[#04060e]">
        <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-blue-950/70 bg-[#070d20] p-4">
          <div className="mb-4 rounded-xl border border-blue-950/60 bg-[#050917] p-3">
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Admin Menu</span>
            <span className="mt-1 block text-xs font-black uppercase tracking-wide text-yellow-400">Control Sections</span>
          </div>

          <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {adminMenuItems.map((item) => {
              const active = activeTab === item.id;
              const activeTone = item.accent === 'rose'
                ? 'border-rose-700 bg-rose-950/40 text-rose-200'
                : item.accent === 'cyan'
                  ? 'border-cyan-700 bg-cyan-950/30 text-cyan-200'
                  : 'border-yellow-400/60 bg-[#17244c] text-yellow-300';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group w-full rounded-xl border p-3 text-left transition-all ${
                    active
                      ? `${activeTone} shadow-lg`
                      : 'border-blue-950/50 bg-[#0a1228]/80 text-slate-400 hover:border-blue-800 hover:bg-blue-950/25 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 text-lg leading-none">{item.icon}</span>
                      <div className="min-w-0">
                        <span className="block text-xs font-black uppercase tracking-wide">{item.label}</span>
                        <span className="mt-0.5 block text-[10px] font-semibold text-slate-500 group-hover:text-slate-400">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    {typeof item.count === 'number' && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        active ? 'bg-yellow-400 text-slate-950' : 'bg-blue-950 text-blue-200'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-3">
            <span className="block text-[9px] font-mono uppercase text-slate-500">System Node Connection</span>
            <span className="mt-1 block text-[11px] font-bold text-emerald-300">STATUS: MASTER ACTIVE</span>
          </div>
        </aside>

        <div className="flex flex-1 min-w-0 flex-col overflow-hidden p-2.5 sm:p-4 md:p-6 lg:p-8">
          <nav className="mb-4 flex gap-2 overflow-x-auto rounded-xl border border-blue-950/70 bg-[#050917] p-2 md:hidden">
            {adminMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ${
                  activeTab === item.id
                    ? 'bg-yellow-400 text-slate-950'
                    : 'bg-blue-950/30 text-slate-300'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        
        <div className="w-full min-w-0 max-w-7xl mx-auto flex flex-col flex-1 overflow-hidden space-y-4 sm:space-y-6">

          {/* Feedback message overlay pop */}
          {feedback && (
            <div className="bg-yellow-500 text-[#0c1228] font-mono font-black text-[11px] sm:text-xs py-2.5 px-3 sm:px-4 rounded-xl text-center shadow-lg animate-pulse border-l-4 border-yellow-700 flex items-start sm:items-center justify-center gap-2 shrink-0">
              ⚡ <span>{feedback}</span>
            </div>
          )}

          {/* Bento Global System Stats Cards */}
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
            <div className="bg-[#091129]/65 p-3 sm:p-4 rounded-xl border border-blue-900/35 shadow-sm transition-all hover:bg-[#0c1633]/70">
              <span className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider font-sans mb-1">Approved Deposits (Gross)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl text-green-400 font-extrabold font-mono break-all">৳{approvedDepositsSum.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-mono">BDT</span>
              </div>
            </div>
            
            <div className="bg-[#091129]/65 p-3 sm:p-4 rounded-xl border border-blue-900/35 shadow-sm transition-all hover:bg-[#0c1633]/70">
              <span className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider font-sans mb-1">Approved Withdraws (Net)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl text-red-400 font-extrabold font-mono break-all">৳{approvedWithdrawsSum.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-mono">BDT</span>
              </div>
            </div>

            <div className="bg-[#091129]/65 p-3 sm:p-4 rounded-xl border border-blue-900/35 shadow-sm transition-all hover:bg-[#0c1633]/70">
              <span className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider font-sans mb-1">Total Users Listed</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl text-yellow-400 font-extrabold font-mono">{profiles.length}</span>
                <span className="text-[9px] text-slate-400 font-sans">registered</span>
              </div>
            </div>

            <div className="bg-[#091129]/65 p-3 sm:p-4 rounded-xl border border-blue-900/35 shadow-sm transition-all hover:bg-[#0c1633]/70">
              <span className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider font-sans mb-1">Pending Audit Requests</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl text-blue-300 font-extrabold font-mono">
                  {pendingDeposits.length + pendingWithdraws.length}
                </span>
                <span className="text-[9px] text-slate-400 font-sans">in pipeline</span>
              </div>
            </div>
          </div>

          {/* Subpanel Layout content */}
          <div className="flex-1 min-w-0 overflow-y-auto pr-0 md:pr-2 min-h-0 bg-[#070b1a]/40 border border-blue-950/40 rounded-2xl p-3 sm:p-4 md:p-6 shadow-inner">
          
          {/* A. Pending requests panel */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400 mb-2">ACTIVE AUDIT PIPELINE</h3>
                <p className="text-[11px] text-slate-400">Review receipts manually. Approving deposit adds cash to user and pays 10% Agent commission instantly. Approving withdrawal logs financial payout clearance.</p>
              </div>

              {pendingDeposits.length === 0 && pendingWithdraws.length === 0 ? (
                <div className="p-10 bg-[#060a17] border border-blue-950 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Pipeline empty. All user manual payments and withdrawals are fully audited!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Deposits Pending */}
                  {pendingDeposits.map((dep) => (
                    <div key={dep.id} className="bg-[#060a17] p-3.5 border border-yellow-500/20 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-green-950 text-green-300 font-bold font-mono uppercase text-[9px]">DEPOSIT REQ</span>
                          <span className="font-bold text-slate-200 font-mono">@{dep.username}</span>
                          <span className="text-slate-500 font-mono">{new Date(dep.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400">Channel: {dep.paymentMethod}</p>
                        {dep.paymentDetails?.accountName && <p className="text-[11px] text-slate-400">Sender: {dep.paymentDetails.accountName}</p>}
                        {dep.paymentDetails?.refNo && (
                          <p className="text-[11px] text-yellow-400">
                            Reference ID: <span className="underline font-mono select-all">{dep.paymentDetails.refNo}</span>
                          </p>
                        )}
                        {dep.agentId && <p className="text-[10px] text-teal-400">Broker Recruiter: agent77 (credits 10% auto payout)</p>}
                      </div>

                      <div className="text-left md:text-right flex flex-col min-[430px]:flex-row md:flex-col min-[430px]:items-center justify-between gap-2.5">
                        <span className="text-base text-green-400 font-black font-mono block">৳{dep.amount.toLocaleString()}</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleAuditRequest(dep.id, 'reject')}
                            className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
                          >
                            DENY
                          </button>
                          <button
                            onClick={() => handleAuditRequest(dep.id, 'approve')}
                            className="bg-green-600 hover:bg-green-500 text-slate-950 px-2.5 py-1 rounded text-[11px] font-black cursor-pointer shadow-md"
                          >
                            APPROVE DEPOSIT
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Withdraws Pending */}
                  {pendingWithdraws.map((wd) => (
                    <div key={wd.id} className="bg-[#060a17] p-3.5 border border-red-500/20 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-red-950 text-red-300 font-bold font-mono uppercase text-[9px]">WITHDRAW REQ</span>
                          <span className="font-bold text-slate-200 font-mono">@{wd.username}</span>
                          <span className="text-slate-500 font-mono">{new Date(wd.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400">Channel: {wd.paymentMethod}</p>
                        {wd.paymentDetails?.accountName && <p className="text-[11px] text-slate-400">Recipient Name: {wd.paymentDetails.accountName}</p>}
                        {wd.paymentDetails?.accountNumber && <p className="text-[11px] text-slate-400">A/C Mobile No: {wd.paymentDetails.accountNumber}</p>}
                        {wd.paymentDetails?.usdtAddress && <p className="text-[11px] text-yellow-400/90 font-mono break-all select-all">Address: {wd.paymentDetails.usdtAddress}</p>}
                      </div>

                      <div className="text-left md:text-right flex flex-col min-[430px]:flex-row md:flex-col min-[430px]:items-center justify-between gap-2.5 font-mono">
                        <span className="text-base text-red-400 font-black block">৳{wd.amount.toLocaleString()}</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleAuditRequest(wd.id, 'reject')}
                            className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
                          >
                            DENY
                          </button>
                          <button
                            onClick={() => handleAuditRequest(wd.id, 'approve')}
                            className="bg-red-650 hover:bg-red-500 text-white px-2.5 py-1 rounded border border-red-500/30 text-[11px] font-bold cursor-pointer shadow-md"
                          >
                            CLEAR RELEASE PAY
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* B. Users directory management */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400">USER ACCOUNTS LEDGER</h3>
              <div className="overflow-x-auto border border-blue-950 rounded-lg">
                <table className="w-full min-w-[720px] text-left text-xs bg-[#060a17]">
                  <thead className="bg-[#101935] text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-blue-950">
                    <tr>
                      <th className="p-3">User info</th>
                      <th className="p-3">Cash Balance</th>
                      <th className="p-3">Bonus Balance</th>
                      <th className="p-3">Affiliate Code</th>
                      <th className="p-3 text-center">Active Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-950/60 text-slate-300 font-mono">
                    {profiles.map((prof) => {
                      const wall = wallets.find(w => w.userId === prof.id);
                      return (
                        <tr key={prof.id}>
                          <td className="p-3">
                            <div className="font-bold text-slate-200 text-sm">@{prof.username}</div>
                            <span className="text-[10px] text-slate-500">{prof.phone}</span>
                          </td>
                          <td className="p-3 text-green-400 font-bold">৳{wall ? wall.balance.toLocaleString() : '0.00'}</td>
                          <td className="p-3 text-yellow-400">৳{wall ? wall.bonusBalance.toLocaleString() : '0.00'}</td>
                          <td className="p-3 text-blue-300 font-bold">{prof.referralCode}</td>
                          <td className="p-3 text-center">
                            <select
                              value={prof.role}
                              onChange={(e) => handleRoleChange(prof.id, e.target.value as any)}
                              className="bg-[#0b1229] border border-blue-900 rounded px-2.5 py-1 text-[11px] text-yellow-400 font-bold focus:outline-hidden"
                            >
                              <option value="user">👤 PLAYER</option>
                              <option value="agent">💎 BROKER AGENT</option>
                              <option value="admin">⚡ WEB MASTER ADMIN</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C. Create and manage lobby content */}
          {activeTab === 'marketing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              
              {/* Form Create Promo */}
              <div className="bg-[#060a17] border border-blue-950 rounded-lg p-4 space-y-4">
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">⚡ MULTIPLY ACTIVE PROMOTIONAL TACTICS</h4>
                <form onSubmit={handleCreatePromo} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Promo Banner Headline Title</label>
                    <input
                      type="text"
                      placeholder="100% Slot Rebate Kickoff"
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11.5px] text-yellow-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Bonus Code Key (Alphanumeric)</label>
                    <input
                      type="text"
                      placeholder="SLOTREBELX"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11.5px] text-yellow-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Promotional Description details</label>
                    <textarea
                      placeholder="Gives double credit points to use inside slots on next voucher check."
                      value={promoDesc}
                      onChange={(e) => setPromoDesc(e.target.value)}
                      className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11.5px] text-yellow-300 h-16 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">Bonus cash (৳)</label>
                      <input
                        type="number"
                        placeholder="100"
                        value={promoBonus}
                        onChange={(e) => setPromoBonus(e.target.value)}
                        className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11.5px] text-yellow-300"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">Min Deposit required (৳)</label>
                      <input
                        type="number"
                        placeholder="200"
                        value={promoMinDep}
                        onChange={(e) => setPromoMinDep(e.target.value)}
                        className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11.5px] text-yellow-300"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-md"
                  >
                    DEPLOY LIVE LOBBY PROMO
                  </button>
                </form>
              </div>

              {/* Promo List to Toggle */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">ACTIVE MARKETING OUTLETS</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="bg-[#060a17] p-3 border border-blue-950 rounded-lg text-xs space-y-1 relative">
                      <h5 className="font-bold text-slate-200">{promo.title}</h5>
                      <p className="text-[11px] text-blue-300 font-mono">Code: {promo.promoCode}</p>
                      <p className="text-[11px] text-slate-400">{promo.description}</p>
                      <div className="flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-2 pt-2 border-t border-blue-950/60">
                        <span className="text-[10px] text-slate-500">Status: {promo.isActive ? '🟢 Active' : '🔴 Inactive'}</span>
                        <button
                          type="button"
                          onClick={() => handleTogglePromo(promo.id)}
                          className={`py-1 px-2 text-[10px] rounded font-bold uppercase cursor-pointer ${
                            promo.isActive ? 'bg-red-950 text-red-300' : 'bg-green-950 text-green-300'
                          }`}
                        >
                          {promo.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizontal Divider and Banners Manager Section */}
              <div className="md:col-span-2 pt-6 border-t border-blue-950/80 mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Layout size={14} className="text-yellow-500" />
                      Lobby Hero Slider Banners
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">Upload and publish full-width hero banner graphics for the public lobby carousel.</p>
                  </div>
                </div>

                {/* --- REAL-TIME BANNER PREVIEW CONTAINER --- */}
                <div id="banner-preview-simulator" className="bg-[#04081c] border border-blue-900/40 p-3 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-2 w-2 relative flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-300 font-sans tracking-wider flex flex-wrap items-center gap-2">
                        <span>Real-time Layout Canvas (Live Simulator)</span>
                        {editingBannerId && (
                          <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded font-black tracking-widest animate-pulse shadow">
                            REALTIME LIVE EDITING IN PROGRESS
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-slate-400 uppercase bg-slate-940 px-2 py-0.5 rounded border border-blue-950/40">
                        Direct Full Upload Banner
                      </span>
                    </div>
                  </div>

                  {/* Render simulated widget exactly as seen in App.tsx */}
                  {(() => {
                    const getSimFontSizeClasses = (size: string) => {
                      if (size === 'medium') return 'text-[11px] md:text-[20px]';
                      if (size === 'large') return 'text-[12px] md:text-[26px]';
                      if (size === 'maximum') return 'text-[13px] md:text-[32px]';
                      return 'text-xs md:text-md'; // Default / balanced
                    };
                    const simFontSize = getSimFontSizeClasses(bannerTitleFontSize);

                    return (
                      <div 
                        style={bannerTemplate === 'full-image' ? {} : { background: bannerBgColor }} 
                        className="relative rounded-xl overflow-hidden shadow-2xl border border-blue-950 h-36 md:h-44 w-full select-none"
                      >
                        {bannerTemplate === 'full-image' ? (
                          <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
                            {bannerImgLink ? (
                              <img
                                src={bannerImgLink}
                                alt="Direct Full Image Preview"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-fill"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-blue-900/50 rounded-xl text-center text-slate-500 font-sans text-xs gap-1.5 p-4 bg-slate-950">
                                <span className="text-2xl animate-pulse">🌅</span>
                                <span className="font-bold text-slate-400">NO PREBUILT GRAPHIC UPLOADED</span>
                                <span className="text-[10px] text-slate-500 font-mono">Recommended Ratio: 1200 x 320 px (or 1200 x 360 px)</span>
                              </div>
                            )}

                            {bannerPromo && (
                              <div className="absolute bottom-3 left-4 md:bottom-4 md:left-6 z-15">
                                <span className="inline-block px-2.5 py-1 bg-yellow-400 text-slate-950 font-black text-[9px] md:text-xs uppercase rounded-lg tracking-wider shadow-lg">
                                  CODE: {bannerPromo.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Ambient light overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>

                            <div className="w-full h-full relative grid grid-cols-12 items-center px-6 md:px-12 overflow-hidden">
                          {bannerTemplate === 'left-text-right-image' ? (
                            <>
                              {/* Left text column */}
                              <div className="col-span-7 space-y-1 md:space-y-1.5 text-left z-10 py-2 pr-1">
                                <span className="inline-block px-1.5 py-0.5 bg-yellow-400 text-slate-950 text-[7px] md:text-[8px] font-mono font-black uppercase tracking-wider rounded">
                                  EXCLUSIVE OFFER
                                </span>
                                <div className="space-y-0.5">
                                  <h3 className={`font-black text-white uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none truncate ${simFontSize}`}>
                                    {bannerTitle1 || 'Line 1 Title Text'}
                                  </h3>
                                  <h3 className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-tight truncate ${simFontSize}`}>
                                    {bannerTitle2 || 'Line 2 Colored Bonus'}
                                  </h3>
                                </div>
                                <p className="text-[8px] md:text-[10.5px] text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1 font-medium text-opacity-80">
                                  {bannerSubtitle || 'Describe your promotion offer mechanics here...'}
                                </p>

                                {/* Custom Promotion Offer Mechanics Inline */}
                                {bannerMechanics && (
                                  <p 
                                    style={{ fontSize: `${bannerMechanicsFontSize}px` }}
                                    className="font-bold text-amber-300 leading-tight block select-none uppercase tracking-wide truncate max-w-full drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                                  >
                                    Offer Mechanics: {bannerMechanics}
                                  </p>
                                )}

                                {bannerPromo && (
                                  <div className="pt-0.5">
                                    <span className="inline-block px-2 py-0.5 bg-yellow-400 text-slate-950 font-black text-[8px] uppercase rounded tracking-wider shadow">
                                      CODE: {bannerPromo.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Right Image column */}
                              <div className="col-span-5 h-full relative flex items-center justify-center p-2 z-10">
                                {bannerImgLink ? (
                                  <img
                                    src={bannerImgLink}
                                    alt="Live preview"
                                    referrerPolicy="no-referrer"
                                    className="max-h-[95%] max-w-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
                                    onError={(e) => {
                                      // Fallback layout image
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-blue-900/40 rounded-lg p-2 bg-black/20 text-slate-500 font-mono text-[8px] text-center">
                                    <span className="animate-pulse">🖼️ IMAGE PLACEHOLDER</span>
                                    <span className="text-[7px] mt-0.5 opacity-60">Paste photo link above</span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Left Image column */}
                              <div className="col-span-5 h-full relative flex items-center justify-center p-2 z-10">
                                {bannerImgLink ? (
                                  <img
                                    src={bannerImgLink}
                                    alt="Live preview"
                                    referrerPolicy="no-referrer"
                                    className="max-h-[95%] max-w-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-blue-900/40 rounded-lg p-2 bg-black/20 text-slate-500 font-mono text-[8px] text-center">
                                    <span className="animate-pulse">🖼️ IMAGE PLACEHOLDER</span>
                                    <span className="text-[7px] mt-0.5 opacity-60">Paste photo link above</span>
                                  </div>
                                )}
                              </div>

                              {/* Right text column */}
                              <div className="col-span-7 space-y-1 md:space-y-1.5 text-right z-10 py-2 pl-1 flex flex-col items-end justify-center">
                                <span className="inline-block px-1.5 py-0.5 bg-yellow-400 text-slate-950 text-[7px] md:text-[8px] font-mono font-black uppercase tracking-wider rounded">
                                  EXCLUSIVE OFFER
                                </span>
                                <div className="space-y-0.5">
                                  <h3 className={`font-black text-white uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none truncate ${simFontSize}`}>
                                    {bannerTitle1 || 'Line 1 Title Text'}
                                  </h3>
                                  <h3 className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-tight truncate ${simFontSize}`}>
                                    {bannerTitle2 || 'Line 2 Colored Bonus'}
                                  </h3>
                                </div>
                                <p className="text-[8px] md:text-[10.5px] text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1 font-medium">
                                  {bannerSubtitle || 'Describe your promotion offer mechanics here...'}
                                </p>

                                {/* Custom Promotion Offer Mechanics Inline */}
                                {bannerMechanics && (
                                  <p 
                                    style={{ fontSize: `${bannerMechanicsFontSize}px` }}
                                    className="font-bold text-amber-300 leading-tight block select-none uppercase tracking-wide truncate max-w-full drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"
                                  >
                                    Offer Mechanics: {bannerMechanics}
                                  </p>
                                )}

                                {bannerPromo && (
                                  <div className="pt-0.5">
                                    <span className="inline-block px-2 py-0.5 bg-yellow-400 text-slate-950 font-black text-[8px] uppercase rounded tracking-wider shadow">
                                      CODE: {bannerPromo.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
                  })()}
                                {/* Banner Creator Form */}
                  <form onSubmit={handleCreateBanner} className="bg-[#060a17]/90 border border-blue-950 p-3 sm:p-4 rounded-xl space-y-4 font-sans">
                    <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-wide block">
                      {editingBannerId ? '✏️ EDIT PREBUILT BANNER' : '🌅 UPLOAD PREBUILT BANNER GRAPHIC'}
                    </span>

                    {bannerFeedback && (
                      <div
                        className={`rounded-lg border px-3 py-2 text-[11px] font-bold leading-relaxed ${
                          bannerFeedback.type === 'success'
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                            : bannerFeedback.type === 'error'
                              ? 'border-red-500/60 bg-red-950/50 text-red-200'
                              : 'border-blue-400/50 bg-blue-500/10 text-blue-200'
                        }`}
                      >
                        {bannerFeedback.type === 'success' ? '✅ ' : bannerFeedback.type === 'error' ? '⚠️ ' : 'ℹ️ '}
                        {bannerFeedback.message}
                      </div>
                    )}

                    {/* Highly prominent dimension requirements notice */}
                    <div className="bg-[#051c14] border border-emerald-950/60 p-3 rounded-lg text-emerald-300 text-[11px] leading-relaxed font-sans">
                      <div className="font-bold uppercase text-[9px] text-emerald-400 tracking-wider mb-0.5">📐 FULL STAGE DISPLAY DIMENSIONS:</div>
                      Your prebuilt graphic is shown across <strong className="text-white text-xs">100% of the wide container</strong>. To prevent pixelation or weird rendering, please design & upload your banner image keeping this precise ratio template standard in mind:
                      <ul className="list-disc pl-4 mt-1.5 space-y-0.5 text-slate-300">
                        <li>Standard Canvas Size: <strong className="text-yellow-400 font-mono text-xs">1200 x 320 px</strong></li>
                        <li>Secondary Option: <strong className="text-yellow-400 font-mono text-xs">1200 x 360 px</strong></li>
                        <li>Aspect Ratio Guideline: <strong className="text-white font-mono">3.3:1 to 4:1</strong> for widescreen layouts</li>
                      </ul>
                    </div>

                    {/* Interactive Direct Image Upload Zone */}
                    <div className="p-3 bg-[#040813] border border-blue-900/60 rounded-xl space-y-2">
                      <div className="flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-2">
                        <label className="text-[9.5px] uppercase text-emerald-400 block font-black flex items-center gap-1">
                          <span className="text-xs">📁</span> SELECT YOUR PREBUILT GRAPHIC FILE
                        </label>
                        <span className="text-[8px] font-mono bg-blue-950/80 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-900/30">
                          PNG, JPG, WEBP, GIF
                        </span>
                      </div>

                      <div className="border-2 border-dashed border-blue-900/50 hover:border-teal-500 bg-[#091024]/75 p-4 rounded-xl transition-all relative group flex flex-col items-center justify-center text-center cursor-pointer min-h-[100px]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsBannerUploading(true);
                            setBannerFeedback(null);
                            try {
                              showBannerFeedback('info', `Preparing ${file.name}...`, false);
                              const prepared = await prepareBannerImage(file);
                              setBannerImgLink(prepared);
                              showBannerFeedback('success', `Image uploaded and ready to publish. Optimized size: ${Math.round(prepared.length / 1024)} KB.`);
                            } catch (err: any) {
                              setBannerImgLink('');
                              showBannerFeedback('error', err?.message || 'Image upload failed. Please try another file.', false);
                            } finally {
                              setIsBannerUploading(false);
                              e.currentTarget.value = '';
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{isBannerUploading ? '⏳' : '🌅'}</span>
                        <p className="text-[11px] font-black text-slate-200">
                          {isBannerUploading ? 'Preparing image, please wait...' : 'Click to select or drag and drop your prebuilt banner here'}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1">
                          Recommended Canvas Width: <strong className="text-emerald-400 font-sans">1200px</strong>
                        </p>
                      </div>

                      {/* Display preview of currently selected/uploaded image */}
                      {bannerImgLink && (
                        <div className="mt-1.5 p-1.5 bg-slate-950/80 border border-blue-950/60 rounded-lg flex flex-col min-[430px]:flex-row min-[430px]:items-center gap-2.5 overflow-hidden">
                          <img 
                            src={bannerImgLink} 
                            alt="Upload preview" 
                            className="h-10 w-24 object-cover rounded border border-blue-900 bg-black shrink-0" 
                          />
                          <div className="overflow-hidden min-w-0 flex-1">
                            <span className="text-[8.5px] font-mono text-slate-300 block uppercase font-bold">Graphic payload ready to publish</span>
                            <span className="text-[8.5px] font-mono text-emerald-400 truncate block">
                              {(bannerImgLink && typeof bannerImgLink === 'string' && bannerImgLink.startsWith('data:')) ? `BASE64 LOCAL PAYLOAD (${Math.round(bannerImgLink.length / 1024)} KB)` : (bannerImgLink || '')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBannerImgLink('')}
                            className="p-1 text-red-400 hover:text-red-300 bg-red-950/20 rounded text-[9px] shrink-0 font-bold border border-transparent hover:border-red-900"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Promo code overlay */}
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1 font-bold">Campaign Promo Code Badge (Optional overlay reward code)</label>
                      <input
                        type="text"
                        placeholder="e.g. VIPBONUS, REBATE100 (Leaves badge blank if empty)"
                        value={bannerPromo}
                        onChange={(e) => setBannerPromo(e.target.value)}
                        className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11px] text-yellow-300 uppercase font-mono tracking-wider font-bold"
                      />
                    </div>

                    {editingBannerId ? (
                      <div className="grid grid-cols-1 min-[430px]:grid-cols-2 gap-2">
                        <button
                          type="submit"
                          disabled={isBannerUploading || isBannerSaving || !bannerImgLink}
                          className={`w-full py-2 font-black text-xs uppercase tracking-wider rounded-md transition-all ${
                            isBannerUploading || isBannerSaving || !bannerImgLink
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : 'bg-yellow-400 text-slate-950 hover:brightness-110 cursor-pointer'
                          }`}
                        >
                          {isBannerSaving ? 'SAVING...' : isBannerUploading ? 'UPLOADING...' : 'UPDATE BANNER'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditBanner}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-md cursor-pointer transition-all"
                        >
                          CANCEL EDIT
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={!bannerImgLink || isBannerUploading || isBannerSaving}
                        className={`w-full py-2 font-black text-xs uppercase tracking-wider rounded-md cursor-pointer transition-all ${
                          bannerImgLink && !isBannerUploading && !isBannerSaving
                            ? 'bg-yellow-400 text-slate-950 hover:brightness-110 shadow-lg' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        {isBannerSaving ? 'SAVING AND PUBLISHING...' : isBannerUploading ? 'UPLOADING IMAGE...' : bannerImgLink ? 'SAVE AND PUBLISH BANNER' : '🚫 PLEASE UPLOAD OR LOAD IMAGE TO PUBLISH'}
                      </button>
                    )}
                  </form>

                  {/* Banner Active List queue */}
                  <div className="bg-[#060a17] border border-blue-950 p-4 rounded-xl space-y-3 flex flex-col justify-between h-full font-sans">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wide block mb-3">📋 ACTIVE/INACTIVE HERO BANNERS DESK</span>
                      
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {banners.map((item) => (
                          <div key={item.id} className="bg-[#0c132a] border border-blue-950/80 p-2.5 rounded-lg text-xs space-y-1.5 relative group">
                              <div className="flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-start gap-2">
                              <div className="min-w-0">
                                <span className="inline-block mb-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[8px] font-black text-slate-950">
                                  Slide #{item.displayOrder || banners.findIndex((banner) => banner.id === item.id) + 1}
                                </span>
                                <h5 className="font-bold text-slate-200 line-clamp-1 leading-tight">
                                  {item.titleLine1 || item.title || 'Untitled Banner'}
                                </h5>
                                {item.titleLine2 && <p className="text-[10px] text-yellow-400/90 font-mono font-bold leading-normal">{item.titleLine2}</p>}
                                <p className="text-[8.5px] text-slate-500 font-mono leading-none mt-1">Full-width hero banner</p>
                              </div>

                              <div className="flex flex-wrap gap-1.5 items-center">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditBanner(item)}
                                  className={`p-1 bg-blue-950/40 hover:bg-blue-900/50 rounded border cursor-pointer transition-all ${
                                    editingBannerId === item.id ? 'border-yellow-400 text-yellow-500 font-extrabold shadow-sm' : 'border-blue-900/30 text-blue-400 hover:text-blue-300'
                                  }`}
                                  title="Edit Banner Content"
                                >
                                  <Edit size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBanner(item.id)}
                                  className={`px-1.5 py-0.5 text-[8.5px] rounded font-bold uppercase cursor-pointer ${
                                    item.isActive ? 'bg-green-950/80 text-green-300 border border-green-900/40' : 'bg-red-950/80 text-red-300 border border-red-900/40'
                                  }`}
                                  title={item.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                                >
                                  {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBanner(item.id)}
                                  className="text-red-400 hover:text-red-300 p-1 bg-red-950/35 hover:bg-red-900/50 rounded border border-red-900/30 cursor-pointer transition-all"
                                  title="Delete Permanent"
                                >
                                  <Trash size={11} />
                                </button>
                              </div>
                            </div>

                            <div
                              style={item.bgGradient ? { background: item.bgGradient } : ((item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('linear-gradient')) ? { background: item.imageUrl } : { backgroundImage: `url(${item.imageUrl || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' })}
                              className="w-full h-11 rounded border border-blue-950/90 relative flex items-center justify-between px-3 overflow-hidden select-none"
                            >
                              <div className="text-[8px] z-10 leading-none">
                                <span className="font-black text-slate-100 block truncate max-w-[120px]">{item.titleLine1 || item.title}</span>
                                <span className="font-bold text-yellow-350 mt-0.5 block truncate max-w-[120px]">{item.titleLine2 || item.subtitle}</span>
                              </div>
                              <div className="w-10 h-8 flex items-center justify-end z-10">
                                {item.imageLink ? (
                                  <img
                                    src={item.imageLink}
                                    alt="Preview"
                                    referrerPolicy="no-referrer"
                                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                  />
                                ) : (
                                  <span className="text-[7px] text-slate-500 font-mono">No Image</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-blue-950/40 text-[9px] text-slate-500 italic leading-snug">
                      💡 Tip: After publishing, banners alternate automatically inside the homepage carousel. Touch ACTIVE to toggle live displays.
                    </div>
                  </div>
                </div>
              </div>

              {/* Horizontal Divider and Announcement bar management */}
              <div className="md:col-span-2 pt-4 border-t border-blue-950/80 mt-2 space-y-3">
                <div className="flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Megaphone size={14} className="text-yellow-400" />
                      Lobby Announcement Bar Ticker
                    </h4>
                    <p className="text-[10px] text-slate-400">Add, remove, or reset sliding messages shown in the top header banner.</p>
                  </div>
                  <button
                    onClick={handleResetAnnouncements}
                    type="button"
                    className="px-2.5 py-1 bg-[#101935] hover:bg-blue-900 border border-blue-900 text-blue-300 rounded font-mono text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                  >
                    Reset to Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Announcement Form */}
                  <form onSubmit={handleAddAnnouncement} className="bg-[#060a17] border border-blue-950 p-3 rounded-lg flex flex-col min-[430px]:flex-row gap-2 min-[430px]:items-end">
                    <div className="w-full min-[430px]:flex-1">
                      <label className="text-[9px] uppercase text-slate-400 block mb-1 font-bold font-sans">New Sliding Announcement Text</label>
                      <input
                        type="text"
                        placeholder="e.g. 🔥 Direct Agent payout processing is online 24/7!"
                        value={newAnnouncement}
                        onChange={(e) => setNewAnnouncement(e.target.value)}
                        className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-xs text-yellow-300"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full min-[430px]:w-auto px-4 py-2 bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-md min-[430px]:h-[34px] transition-all hover:brightness-110 cursor-pointer"
                    >
                      ADD NEW
                    </button>
                  </form>

                  {/* Current Active Announcements list */}
                  <div className="p-3 bg-[#060a17] border border-blue-950 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                    <span className="text-[9px] uppercase text-slate-500 block font-bold font-sans">Active Messages queue</span>
                    {announcements.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic text-center py-2">No active announcements. System uses default welcome notice.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {announcements.map((ann, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2 bg-[#0c132a] p-2 rounded border border-blue-950/60 text-[11px] text-slate-300 font-mono">
                            <span className="flex-1 leading-snug">{ann}</span>
                            <button
                              onClick={() => handleDeleteAnnouncement(idx)}
                              className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                              type="button"
                              title="Delete Announcement"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Horizontal Divider and Customer Pop-up Announcements (ঘোষণা) Management */}
              <div className="md:col-span-2 pt-6 border-t border-blue-950/80 mt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-sm">📢</span>
                    Interactive Customer Pop-up Announcements (ঘোষণা)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Create, toggle, and view tabbed promotional Bengali modals displayed to users automatically upon registration, login, or workspace reload. Fully customizable parameters grid.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                  
                  {/* Left component: Create/Configure form */}
                  <div className="xl:col-span-7 bg-[#060a17] border border-blue-950/90 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] text-yellow-400 font-extrabold uppercase block tracking-wider border-b border-blue-950 pb-1">
                      🛠️ CREATE NEW MODAL CAMPAIGN
                    </span>

                    <form onSubmit={handleCreatePopupAnnouncement} className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Sidebar Tab Title (Bengali)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ৳১০০ ফ্রি উপহার"
                            value={popupTabTitle}
                            onChange={(e) => setPopupTabTitle(e.target.value)}
                            className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11px] text-yellow-300 font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Corner Promo Badge</label>
                          <select
                            value={popupBadge}
                            onChange={(e) => setPopupBadge(e.target.value)}
                            className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11px] text-yellow-300 font-mono"
                          >
                            <option value="">No Badge</option>
                            <option value="HOT">HOT</option>
                            <option value="NEW">NEW</option>
                            <option value="FREE">FREE</option>
                            <option value="GIFT">GIFT</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Main Header Title (Bengali)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. নতুন মেম্বারদের প্রথম ডিপোজিট বোনাস!"
                            value={popupMainTitle}
                            onChange={(e) => setPopupMainTitle(e.target.value)}
                            className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11px] text-yellow-300 font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Subtitle Line (Bengali)</label>
                          <input
                            type="text"
                            placeholder="e.g. ডিপোজিট করলেই সাথে সাথে ডাবল ব্যালেন্স"
                            value={popupSubtitle}
                            onChange={(e) => setPopupSubtitle(e.target.value)}
                            className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11px] text-yellow-300 font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Campaign Image Asset URL</label>
                          <input
                            type="text"
                            placeholder="e.g. /src/assets/images/... (or blank for default)"
                            value={popupImageLink}
                            onChange={(e) => setPopupImageLink(e.target.value)}
                            className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11px] text-yellow-400 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Bengali Mechanics/Content Text</label>
                          <textarea
                            required
                            placeholder="e.g. এই অফারটি শুধুমাত্র প্রথমবার রিচার্জ করার জন্য প্রযোজ্য।"
                            value={popupContent}
                            onChange={(e) => setPopupContent(e.target.value)}
                            className="w-full bg-[#0b1229] border border-blue-900 rounded p-2 text-[11px] text-yellow-300 h-10 resize-none font-sans"
                          />
                        </div>
                      </div>

                      {/* Customized parameters row grid builders */}
                      <div className="border-t border-blue-950/65 pt-2">
                        <span className="text-[9px] uppercase text-slate-400 font-extrabold block mb-2 font-mono">
                          📊 Reward Parameter Matrix Rows (Optional, maps to Bengali screenshot grid columns)
                        </span>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 min-[430px]:grid-cols-12 gap-2">
                            <input
                              type="text"
                              placeholder="Row 1 Label (e.g. সর্বনিম্ন ডিপোজিট)"
                              value={rewardLabel1}
                              onChange={(e) => setRewardLabel1(e.target.value)}
                              className="min-[430px]:col-span-7 bg-[#070b16] border border-blue-950 p-1.5 rounded text-[10.5px] text-slate-300 font-sans"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g. ৳৫০০)"
                              value={rewardValue1}
                              onChange={(e) => setRewardValue1(e.target.value)}
                              className="min-[430px]:col-span-5 bg-[#070b16] border border-blue-950 p-1.5 rounded text-[10.5px] text-teal-300 min-[430px]:text-center font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-1 min-[430px]:grid-cols-12 gap-2">
                            <input
                              type="text"
                              placeholder="Row 2 Label (e.g. বোনাস শতকরা)"
                              value={rewardLabel2}
                              onChange={(e) => setRewardLabel2(e.target.value)}
                              className="min-[430px]:col-span-7 bg-[#070b16] border border-blue-950 p-1.5 rounded text-[10.5px] text-slate-300 font-sans"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g. ১০০%)"
                              value={rewardValue2}
                              onChange={(e) => setRewardValue2(e.target.value)}
                              className="min-[430px]:col-span-5 bg-[#070b16] border border-blue-950 p-1.5 rounded text-[10.5px] text-teal-300 min-[430px]:text-center font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-1 min-[430px]:grid-cols-12 gap-2">
                            <input
                              type="text"
                              placeholder="Row 3 Label (e.g. সর্বোচ্চ বোনাস ক্যাশ)"
                              value={rewardLabel3}
                              onChange={(e) => setRewardLabel3(e.target.value)}
                              className="min-[430px]:col-span-7 bg-[#070b16] border border-blue-950 p-1.5 rounded text-[10.5px] text-slate-300 font-sans"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g. ৳৫,০০০)"
                              value={rewardValue3}
                              onChange={(e) => setRewardValue3(e.target.value)}
                              className="min-[430px]:col-span-5 bg-[#070b16] border border-blue-950 p-1.5 rounded text-[10.5px] text-teal-300 min-[430px]:text-center font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-1 min-[430px]:grid-cols-12 gap-2">
                            <input
                              type="text"
                              placeholder="Row 4 Label (e.g. বাজি ধরার শর্ত)"
                              value={rewardLabel4}
                              onChange={(e) => setRewardLabel4(e.target.value)}
                              className="min-[430px]:col-span-7 bg-[#070b16] border border-blue-950 p-1.5 rounded text-[10.5px] text-slate-300 font-sans"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g. ১৫ গুন বাজি)"
                              value={rewardValue4}
                              onChange={(e) => setRewardValue4(e.target.value)}
                              className="min-[430px]:col-span-5 bg-[#070b16] border border-blue-950 p-1.5 rounded text-[10.5px] text-teal-300 min-[430px]:text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 font-black text-slate-950 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          ➕ SAVE POP-UP ANNOUNCEMENT
                        </button>
                      </div>

                    </form>
                  </div>

                  {/* Right component: List of campaigns config with toggle status */}
                  <div className="xl:col-span-5 space-y-3 flex flex-col justify-between">
                    
                    <div className="bg-[#050812] border border-blue-950 rounded-xl p-3.5 space-y-3 flex-1 overflow-hidden flex flex-col">
                      <span className="text-[10px] text-yellow-400 font-black uppercase tracking-wider border-b border-blue-950/70 pb-1.5 block font-sans">
                        📋 CURRENT ACTIVE POP-UP CONSTRUCTIONS
                      </span>

                      <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 max-h-[310px]">
                        {popupAnnouncements.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 font-sans italic text-xs">
                            No popup announcement cards custom-configured. Default Bengali system ones will be used.
                          </div>
                        ) : (
                          popupAnnouncements.map((item) => (
                            <div 
                              key={item.id}
                              className="border border-blue-950/80 bg-[#070c17] p-2.5 rounded-lg flex flex-col justify-between gap-2 shadow"
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-slate-200 truncate">{item.tabTitle}</span>
                                    {item.badge && (
                                      <span className="text-[7.5px] px-1 bg-red-950 text-red-300 rounded border border-red-900/40 uppercase font-bold">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9.5px] text-slate-400 block truncate mt-0.5">{item.mainTitle}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleTogglePopupAnnouncement(item.id, item.isActive)}
                                    type="button"
                                    className={`text-[8.5px] px-1.5 py-0.5 rounded font-black cursor-pointer select-none border tracking-wider transition-all ${
                                      item.isActive
                                        ? 'bg-teal-950 text-teal-400 border-teal-800'
                                        : 'bg-slate-900 text-slate-500 border-slate-800'
                                    }`}
                                    title="Toggle display status on customer logins"
                                  >
                                    {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                                  </button>

                                  <button
                                    onClick={() => handleDeletePopupAnnouncement(item.id)}
                                    type="button"
                                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 rounded cursor-pointer shrink-0 transition-colors"
                                    title="Delete Campaign"
                                  >
                                    <Trash size={11} />
                                  </button>
                                </div>
                              </div>

                              {/* Mini info capsule parameters preview */}
                              <div className="bg-[#040810] p-1.5 rounded text-[8.5px] text-slate-500 font-mono space-y-0.5 border border-blue-950 px-2 flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-1">
                                <span>REWARD TABLE TYPE:</span>
                                <span className="text-slate-300 font-sans font-bold">
                                  {item.rewardLines ? `${item.rewardLines.length} Param Rows` : 'Direct static content'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>

                    <div className="bg-[#0b1b22]/30 border border-[#1b3d3f]/40 p-3 rounded-lg text-[10px] text-teal-300/95 leading-normal flex items-start gap-2">
                      <span className="text-sm shrink-0">🌟</span>
                      <span>
                        <strong>Admin Tip:</strong> When a user logs in, reloads, or checks the sidebar resources, all <strong>ACTIVE</strong> campaigns above are compiled together into a single tabbed dialog showcasing corresponding Bengali metrics.
                      </span>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
              <section className="rounded-xl border border-blue-950 bg-[#091129] p-4">
                <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-400">Payment Providers</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase text-slate-500">Provider</label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentProviders.map(provider => (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => setSelectedPaymentProvider(provider)}
                          className={`rounded-lg border px-3 py-2 text-xs font-black ${
                            selectedPaymentProvider === provider
                              ? 'border-yellow-400 bg-yellow-400 text-slate-950'
                              : 'border-blue-950 bg-[#050917] text-slate-300 hover:border-blue-700'
                          }`}
                        >
                          {provider}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase text-slate-500">Wallet Channel</label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentChannels.map(channel => (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => setSelectedPaymentChannel(channel)}
                          className={`rounded-lg border px-3 py-2 text-xs font-black uppercase ${
                            selectedPaymentChannel === channel
                              ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                              : 'border-blue-950 bg-[#050917] text-slate-300 hover:border-blue-700'
                          }`}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-blue-950 bg-[#091129] p-4">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400">Payment Page Control</h3>
                    <p className="text-xs text-slate-400">Controls what users see after clicking “জমার জন্য আবেদন করুন”.</p>
                  </div>
                  <span className="rounded-full border border-blue-900 bg-[#050917] px-3 py-1 text-[10px] font-black text-cyan-300">
                    {selectedPaymentProvider} / {selectedPaymentChannel.toUpperCase()}
                  </span>
                </div>

                {paymentDraft ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Wallet Number</span>
                      <input
                        value={paymentDraft.walletNumber}
                        onChange={(event) => handlePaymentWalletNumberChange(event.target.value)}
                        className="w-full rounded-lg border border-blue-950 bg-[#050917] px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Payment Title</span>
                      <input
                        value={paymentDraft.title}
                        onChange={(event) => updatePaymentDraft({ title: event.target.value })}
                        className="w-full rounded-lg border border-blue-950 bg-[#050917] px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Service Name</span>
                      <input
                        value={paymentDraft.serviceName}
                        onChange={(event) => updatePaymentDraft({ serviceName: event.target.value })}
                        className="w-full rounded-lg border border-blue-950 bg-[#050917] px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Payment URL / Domain</span>
                      <input
                        value={paymentDraft.domain}
                        onChange={(event) => updatePaymentDraft({ domain: event.target.value })}
                        className="w-full rounded-lg border border-blue-950 bg-[#050917] px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-400"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Top Warning</span>
                      <input
                        value={paymentDraft.warning}
                        onChange={(event) => updatePaymentDraft({ warning: event.target.value })}
                        className="w-full rounded-lg border border-blue-950 bg-[#050917] px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-400"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Wallet Instruction Text</span>
                      <textarea
                        value={paymentDraft.instructions}
                        onChange={(event) => updatePaymentDraft({ instructions: event.target.value })}
                        className="min-h-20 w-full rounded-lg border border-blue-950 bg-[#050917] px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-400"
                      />
                    </label>
                    <label className="flex items-center gap-3 rounded-lg border border-blue-950 bg-[#050917] p-3 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={paymentDraft.isActive}
                        onChange={(event) => updatePaymentDraft({ isActive: event.target.checked })}
                      />
                      <span className="text-xs font-black text-slate-200">Active for users</span>
                    </label>
                    <div className="flex flex-col gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-bold text-yellow-100">
                        Wallet number publishes live while typing. Press UPDATE to publish the full payment-page settings.
                      </p>
                      <button
                        type="button"
                        onClick={publishPaymentDraft}
                        className="rounded-lg bg-yellow-400 px-5 py-2.5 text-xs font-black uppercase text-slate-950 shadow-lg hover:bg-yellow-300"
                      >
                        UPDATE PAYMENT NUMBER TO USERS
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm font-bold text-red-300">
                    Payment settings not loaded. Reopen the admin panel.
                  </p>
                )}
              </section>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-4">
              <SupabaseSyncWidget />
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-6">
              {/* Introduction & Header */}
              <div className="bg-gradient-to-r from-red-950/45 to-rose-950/20 p-4 rounded-xl border border-red-900/60">
                <div className="flex flex-col min-[430px]:flex-row min-[430px]:items-center gap-2 mb-1.5">
                  <div className="p-1 px-2 bg-red-500/20 rounded border border-red-500/30 text-rose-300 text-[10px] font-mono uppercase font-bold tracking-wider">RIG MODE LIVE</div>
                  <h3 className="text-base font-black text-rose-300 uppercase tracking-tight">DYNAMIC GAME OUTCOME & POOL CONTROL</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Absolute Administrative Domain. Configure system-level profit margin presets, winner thresholds, and live payout overrides. You can restrict overall daily winner maximum ceilings dynamically, forcing remaining players to trigger losses, or unlock massive retention promotions.
                </p>
              </div>

              {/* 1. Mapped Games Spreadsheet */}
              <div className="bg-[#040815] p-4 rounded-xl border border-[#0d1633] space-y-3.5">
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">🎮 LIVE GAME MATRIX AND ASSIGNED MODELS</h4>
                  <p className="text-[10px] text-slate-400">Map any listed active game to one of our dynamic logic models in real-time. Changes are applied instantly to playing slots and minefields.</p>
                </div>

                <div className="border border-blue-950/60 rounded-xl overflow-x-auto bg-[#070d20]">
                  <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#09112a] border-b border-blue-950 text-slate-400 text-[10px] uppercase font-mono">
                        <th className="p-3">Game Name / ID</th>
                        <th className="p-3">Current Binding Model</th>
                        <th className="p-3 text-right">Switch Active Rig Mapping</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-950/55">
                      {allGames.map((game) => {
                        const boundModelId = gameMappings[game.id] || 'model-rng';
                        const activeModel = gameControlModels.find(m => m.id === boundModelId);

                        return (
                          <tr key={game.id} className="hover:bg-[#0c1532]/25 transition-all">
                            <td className="p-3 font-mono font-bold">
                              <div className="text-slate-200">{game.name || game.title || 'In-house Slot Machine'}</div>
                              <div className="text-[9px] text-slate-500 font-mono">{game.id}</div>
                            </td>
                            <td className="p-3">
                              {activeModel ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span className={`inline-block w-2 h-2 rounded-full ${
                                      activeModel.type === 'rng' ? 'bg-green-400' :
                                      activeModel.type === 'winner_cap' ? 'bg-yellow-400 animate-pulse' :
                                      activeModel.type === 'force_loss' ? 'bg-red-500' : 'bg-cyan-400'
                                    }`} />
                                    <span className="text-slate-200">{activeModel.name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 leading-tight italic max-w-sm">{activeModel.description}</div>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">No model attached</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <select
                                value={boundModelId}
                                onChange={(e) => handleMapGameModel(game.id, e.target.value)}
                                className="bg-[#060a17] border border-blue-900 rounded p-1.5 text-xs text-yellow-300 focus:outline-none focus:border-yellow-400"
                              >
                                {gameControlModels.map(model => (
                                  <option key={model.id} value={model.id}>
                                    {model.name} [{model.type.toUpperCase()}]
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Models Parameter Controls Panel */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">🎯 AVAILABLE OUTCOME RIGGING MODELS</h4>
                  <p className="text-[10px] text-slate-400">Configure global properties of each system outcome algorithm below.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameControlModels.map((model) => (
                    <div key={model.id} className="bg-[#05091a] p-3.5 rounded-xl border border-blue-950/70 space-y-3 hover:border-blue-900/60 transition-all flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                              model.type === 'rng' ? 'bg-green-400' :
                              model.type === 'winner_cap' ? 'bg-yellow-400 animate-pulse' :
                              model.type === 'force_loss' ? 'bg-red-500' : 'bg-cyan-400'
                            }`} />
                            {model.name}
                          </h5>
                          <span className="text-[9px] font-mono text-slate-400 uppercase bg-blue-950/70 px-1.5 py-0.5 rounded border border-blue-900/30">
                            {model.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed italic">{model.description}</p>
                      </div>

                      {/* Config Area for Model parameters */}
                      <div className="pt-2 border-t border-blue-950/50 mt-2 space-y-2">
                        {model.type === 'winner_cap' ? (
                          <div className="space-y-2">
                            <div className="flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-1 text-[11px]">
                              <span className="text-slate-400 font-sans">Daily Winners Maximum Ceiling:</span>
                              <span className="font-mono text-yellow-400 font-bold">{model.maxWinnersPerDay} users</span>
                            </div>
                            
                            <div className="flex flex-col min-[430px]:flex-row gap-2">
                              <input
                                type="number"
                                min="1"
                                max="1000"
                                defaultValue={model.maxWinnersPerDay}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    handleUpdateWinnersLimit(model.id, val);
                                  }
                                }}
                                className="w-full min-[430px]:w-24 bg-[#060a17] border border-blue-900 rounded p-1 text-center font-mono text-xs text-yellow-300"
                              />
                              <button
                                type="button"
                                onClick={() => handleResetCurrentWinners(model.id)}
                                className="flex-1 py-1 px-2 text-[10px] bg-red-600/20 hover:bg-red-600/35 text-red-300 border border-red-900/50 rounded font-bold uppercase transition-all"
                              >
                                Force Reset Counter ({model.currentWinnersToday} today)
                              </button>
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              Winner Tracker Counter: <span className="text-yellow-400 font-bold">{model.currentWinnersToday}</span> of <span className="text-slate-300 font-bold">{model.maxWinnersPerDay}</span> wins triggered globally today. Resets automatically at UTC midnight.
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic leading-snug py-1">
                            No adjustable parameters required for standard static routing models.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
