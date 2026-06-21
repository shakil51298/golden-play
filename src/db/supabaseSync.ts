import { supabaseClient } from './supabaseClient';
import { UserProfile, Wallet, Transaction, PortalNotification, Banner, Promotion } from '../types';

// Convert simulation IDs to valid UUIDs to satisfy Postgres database schema constraints
export function coerceUuid(id: string): string {
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return id;
  }
  if (id === 'usr-player1') return '11111111-1111-1111-1111-111111111111';
  if (id === 'usr-agent1') return '22222222-2222-2222-2222-222222222222';
  if (id === 'usr-admin1') return '33333333-3333-3333-3333-333333333333';

  // Seeded hash UUID generator
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hex = Math.abs(hash).toString(16).padEnd(12, '9').substring(0, 12);
  return `00000000-0000-4000-a000-${hex}`;
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  status: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage: string | null;
}

export class SupabaseSyncService {
  private static instance: SupabaseSyncService;
  private isConfigured: boolean = false;

  private status: SyncStatus = {
    lastSyncedAt: localStorage.getItem('playportal_supabase_last_sync'),
    status: 'idle',
    errorMessage: null
  };

  private listeners: ((status: SyncStatus) => void)[] = [];

  private constructor() {
    this.isConfigured = true;
  }

  public static getInstance(): SupabaseSyncService {
    if (!SupabaseSyncService.instance) {
      SupabaseSyncService.instance = new SupabaseSyncService();
    }
    return SupabaseSyncService.instance;
  }

  public subscribe(cb: (status: SyncStatus) => void): () => void {
    this.listeners.push(cb);
    cb(this.status);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private updateStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    if (patch.lastSyncedAt) {
      localStorage.setItem('playportal_supabase_last_sync', patch.lastSyncedAt);
    }
    this.listeners.forEach(l => l(this.status));
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  private mapSupabaseBanner(b: any): Banner {
    let subtitleText = b.subtitle || '';
    let templateType: 'left-text-right-image' | 'left-image-right-text' | 'full-image' = 'full-image';
    let titleLine1 = '';
    let titleLine2 = '';
    let titleFontSize = 'balanced';
    let offerMechanicsOneLine = '';
    let mechanicsFontSize = 14;
    let bgGradient = '';
    let displayOrder = Number.MAX_SAFE_INTEGER;

    if (b.subtitle && b.subtitle.startsWith('{')) {
      try {
        const metadata = JSON.parse(b.subtitle);
        subtitleText = metadata.s || '';
        templateType = metadata.t || 'full-image';
        titleLine1 = metadata.l1 || '';
        titleLine2 = metadata.l2 || '';
        titleFontSize = metadata.fs || 'balanced';
        offerMechanicsOneLine = metadata.m || '';
        mechanicsFontSize = metadata.mfs || 14;
        bgGradient = metadata.bg || '';
        displayOrder = Number(metadata.o || Number.MAX_SAFE_INTEGER);
      } catch (e) {
        console.error('Failed to parse banner metadata JSON:', e);
      }
    }

    return {
      id: b.id,
      title: b.title,
      subtitle: subtitleText,
      imageUrl: templateType === 'full-image' ? b.image_url : (bgGradient || 'linear-gradient(135deg, #070e28 0%, #0c2054 50%, #08173d 100%)'),
      imageLink: b.image_url || undefined,
      promoCode: b.promo_code || undefined,
      isActive: b.is_active,
      templateType,
      titleLine1,
      titleLine2,
      titleFontSize,
      offerMechanicsOneLine,
      mechanicsFontSize,
      bgGradient,
      displayOrder,
      createdAt: b.created_at,
    };
  }

  private sortBannersForCarousel(banners: Banner[]): Banner[] {
    return [...banners].sort((a, b) => {
      const orderA = Number.isFinite(a.displayOrder) ? Number(a.displayOrder) : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(b.displayOrder) ? Number(b.displayOrder) : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
  }

  /**
   * Fetches public lobby content only. Use this for logged-out/incognito users
   * because private tables can fail before a full sync reaches banners.
   */
  public async pullPublicContentFromSupabase(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: bData, error: bError } = await supabaseClient
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (bError) throw new Error(`Banners Retrieve Failed: ${bError.message}`);

      localStorage.setItem(
        'playportal_banners_v1',
        JSON.stringify(this.sortBannersForCarousel((bData || []).map((b) => this.mapSupabaseBanner(b))))
      );

      const { data: promoData, error: promoError } = await supabaseClient
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (promoError) throw new Error(`Promotions Retrieve Failed: ${promoError.message}`);

      if (promoData && promoData.length > 0) {
        const localPromotions: Promotion[] = promoData.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: p.image_style,
          promoCode: p.promo_code,
          bonusAmount: Number(p.bonus_amount),
          minDepositRequired: Number(p.min_deposit_required),
          isActive: p.is_active,
          type: p.type as any
        }));
        localStorage.setItem('playportal_promotions_v1', JSON.stringify(localPromotions));
      }

      return { success: true };
    } catch (e: any) {
      console.error('Public Supabase Content Pull Error:', e);
      return { success: false, error: e.message || 'Could not fetch public lobby content.' };
    }
  }

  private mapLocalBannersForSupabase(banners: Banner[]) {
    return banners.map((b, index) => {
      const displayOrder = b.displayOrder || index + 1;
      const metadata = {
        s: b.subtitle || '',
        t: b.templateType || 'full-image',
        l1: b.titleLine1 || '',
        l2: b.titleLine2 || '',
        fs: b.titleFontSize || 'balanced',
        m: b.offerMechanicsOneLine || '',
        mfs: b.mechanicsFontSize || 14,
        bg: b.bgGradient || '',
        o: displayOrder,
      };
      const imageUrlInDb = b.templateType === 'full-image'
        ? (b.imageLink || b.imageUrl || '')
        : (b.imageLink || '');

      return {
        id: b.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? b.id : coerceUuid(b.id),
        title: b.title || '',
        subtitle: JSON.stringify(metadata),
        image_url: imageUrlInDb,
        promo_code: b.promoCode || null,
        is_active: b.isActive,
        created_at: b.createdAt || new Date(Date.now() + index * 1000).toISOString()
      };
    });
  }

  public async pushBannersToSupabase(): Promise<{ success: boolean; error?: string }> {
    this.updateStatus({ status: 'syncing', errorMessage: null });

    try {
      const localBannersRaw = localStorage.getItem('playportal_banners_v1');
      const banners: Banner[] = localBannersRaw ? JSON.parse(localBannersRaw) : [];
      const mappedBanners = this.mapLocalBannersForSupabase(banners);

      if (mappedBanners.length > 0) {
        const { error: bError } = await supabaseClient
          .from('banners')
          .upsert(mappedBanners, { onConflict: 'id' });

        if (bError) throw new Error(`Banners Sync Failed: ${bError.message}`);
      }

      const localBannerIds = new Set(mappedBanners.map((banner) => banner.id));
      const { data: remoteBanners, error: remoteBannerError } = await supabaseClient
        .from('banners')
        .select('id');

      if (remoteBannerError) throw new Error(`Banners Cleanup Failed: ${remoteBannerError.message}`);

      const staleRemoteBanners = (remoteBanners || []).filter((banner) => !localBannerIds.has(banner.id));
      for (const staleBanner of staleRemoteBanners) {
        const { error: staleUpdateError } = await supabaseClient
          .from('banners')
          .update({ is_active: false })
          .eq('id', staleBanner.id);

        if (staleUpdateError) throw new Error(`Banners Cleanup Failed: ${staleUpdateError.message}`);
      }

      const nowStr = new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
      this.updateStatus({ status: 'success', lastSyncedAt: nowStr, errorMessage: null });
      return { success: true };
    } catch (e: any) {
      console.error('Supabase Banner Sync Error:', e);
      this.updateStatus({ status: 'error', errorMessage: e.message || 'Could not publish banners to Supabase.' });
      return { success: false, error: e.message };
    }
  }

  /**
   * Pushes all local storage tables to Supabase. Handles tables gracefully even
   * if some tables do not exist in Supabase yet (by logging and warning instead of crashing)
   */
  public async pushToSupabase(): Promise<{ success: boolean; error?: string }> {
    this.updateStatus({ status: 'syncing', errorMessage: null });

    try {
      // 1. Get and map Profiles
      const localProfilesRaw = localStorage.getItem('playportal_profiles_v1');
      const profiles: UserProfile[] = localProfilesRaw ? JSON.parse(localProfilesRaw) : [];

      if (profiles.length > 0) {
        const mappedProfiles = profiles.map(p => ({
          id: coerceUuid(p.id),
          username: p.username,
          phone: p.phone,
          email: p.email,
          role: p.role,
          avatar_url: p.avatarUrl || '🦊',
          referral_code: p.referralCode,
          referred_by_code: p.referredByCode || null,
          created_at: p.createdAt || new Date().toISOString()
        }));

        const { error: pError } = await supabaseClient
          .from('profiles')
          .upsert(mappedProfiles, { onConflict: 'id' });

        if (pError) throw new Error(`Profiles Sync Failed: ${pError.message}`);
      }

      // 2. Get and map Wallets
      const localWalletsRaw = localStorage.getItem('playportal_wallets_v1');
      const wallets: Wallet[] = localWalletsRaw ? JSON.parse(localWalletsRaw) : [];

      if (wallets.length > 0) {
        const mappedWallets = wallets.map(w => ({
          user_id: coerceUuid(w.userId),
          balance: w.balance,
          bonus_balance: w.bonusBalance,
          total_deposit: w.totalDeposit,
          total_withdraw: w.totalWithdraw,
          total_wagered: w.totalWagered,
          updated_at: new Date().toISOString()
        }));

        const { error: wError } = await supabaseClient
          .from('wallets')
          .upsert(mappedWallets, { onConflict: 'user_id' });

        if (wError) throw new Error(`Wallets Sync Failed: ${wError.message}`);
      }

      // 3. Get and map Transactions
      const localTxsRaw = localStorage.getItem('playportal_transactions_v1');
      const txs: Transaction[] = localTxsRaw ? JSON.parse(localTxsRaw) : [];

      if (txs.length > 0) {
        const mappedTxs = txs.map(t => ({
          id: coerceUuid(t.id),
          user_id: coerceUuid(t.userId),
          username: t.username,
          type: t.type,
          status: t.status,
          amount: t.amount,
          payment_method: t.paymentMethod || null,
          payment_details: t.paymentDetails || {},
          notes: t.notes || null,
          agent_id: t.agentId ? coerceUuid(t.agentId) : null,
          created_at: t.createdAt || new Date().toISOString()
        }));

        const { error: tError } = await supabaseClient
          .from('transactions')
          .upsert(mappedTxs, { onConflict: 'id' });

        if (tError) throw new Error(`Transactions Sync Failed: ${tError.message}`);
      }

      // 4. Get and map Notifications
      const localNotifsRaw = localStorage.getItem('playportal_notifications_v1');
      const notifs: PortalNotification[] = localNotifsRaw ? JSON.parse(localNotifsRaw) : [];

      if (notifs.length > 0) {
        const mappedNotifs = notifs.map(n => ({
          id: coerceUuid(n.id),
          user_id: n.userId === 'all' ? 'all' : coerceUuid(n.userId),
          title: n.title,
          message: n.message,
          is_read: n.isRead || false,
          created_at: n.createdAt || new Date().toISOString()
        }));

        const { error: nError } = await supabaseClient
          .from('notifications')
          .upsert(mappedNotifs, { onConflict: 'id' });

        if (nError) throw new Error(`Notifications Sync Failed: ${nError.message}`);
      }

      // 5. Get and map Banners
      const localBannersRaw = localStorage.getItem('playportal_banners_v1');
      const banners: Banner[] = localBannersRaw ? JSON.parse(localBannersRaw) : [];
      const mappedBanners = this.mapLocalBannersForSupabase(banners);

      if (mappedBanners.length > 0) {
        const { error: bError } = await supabaseClient
          .from('banners')
          .upsert(mappedBanners, { onConflict: 'id' });

        if (bError) throw new Error(`Banners Sync Failed: ${bError.message}`);
      }

      const localBannerIds = new Set(mappedBanners.map((banner) => banner.id));
      const { data: remoteBanners, error: remoteBannerError } = await supabaseClient
        .from('banners')
        .select('id');

      if (remoteBannerError) throw new Error(`Banners Cleanup Failed: ${remoteBannerError.message}`);

      const staleRemoteBanners = (remoteBanners || []).filter((banner) => !localBannerIds.has(banner.id));
      for (const staleBanner of staleRemoteBanners) {
        const { error: staleUpdateError } = await supabaseClient
          .from('banners')
          .update({ is_active: false })
          .eq('id', staleBanner.id);

        if (staleUpdateError) throw new Error(`Banners Cleanup Failed: ${staleUpdateError.message}`);
      }

      // 6. Get and map Promotions
      const localPromotionsRaw = localStorage.getItem('playportal_promotions_v1');
      const promotions: Promotion[] = localPromotionsRaw ? JSON.parse(localPromotionsRaw) : [];

      if (promotions.length > 0) {
        const mappedPromotions = promotions.map(p => ({
          id: p.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? p.id : coerceUuid(p.id),
          title: p.title || '',
          description: p.description || '',
          image_style: p.imageUrl || '',
          promo_code: p.promoCode,
          bonus_amount: p.bonusAmount,
          min_deposit_required: p.minDepositRequired,
          is_active: p.isActive,
          type: p.type,
          created_at: new Date().toISOString()
        }));

        const { error: promoError } = await supabaseClient
          .from('promotions')
          .upsert(mappedPromotions, { onConflict: 'id' });

        if (promoError) throw new Error(`Promotions Sync Failed: ${promoError.message}`);
      }

      const nowStr = new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
      this.updateStatus({ status: 'success', lastSyncedAt: nowStr, errorMessage: null });
      return { success: true };
    } catch (e: any) {
      console.error('Supabase Sync Push Error:', e);
      this.updateStatus({ status: 'error', errorMessage: e.message || 'Unknown network error occurred.' });
      return { success: false, error: e.message };
    }
  }

  /**
   * Pulls data from live Supabase tables to override/sync local storage data.
   */
  public async pullFromSupabase(): Promise<{ success: boolean; error?: string }> {
    this.updateStatus({ status: 'syncing', errorMessage: null });

    try {
      // 1. Recover profiles
      const { data: pData, error: pError } = await supabaseClient
        .from('profiles')
        .select('*');

      if (pError) throw new Error(`Profiles Retrieve Failed: ${pError.message}`);

      if (pData && pData.length > 0) {
        // Map back to localStorage schema format
        const localProfiles: UserProfile[] = pData.map(p => ({
          id: p.id,
          username: p.username,
          phone: p.phone,
          email: p.email,
          role: p.role as any,
          avatarUrl: p.avatar_url,
          referralCode: p.referral_code,
          referredByCode: p.referred_by_code || undefined,
          createdAt: p.created_at || new Date().toISOString()
        }));
        localStorage.setItem('playportal_profiles_v1', JSON.stringify(localProfiles));
      }

      // 2. Recover wallets
      const { data: wData, error: wError } = await supabaseClient
        .from('wallets')
        .select('*');

      if (wError) throw new Error(`Wallets Retrieve Failed: ${wError.message}`);

      if (wData && wData.length > 0) {
        const localWallets: Wallet[] = wData.map(w => ({
          userId: w.user_id,
          balance: Number(w.balance),
          bonusBalance: Number(w.bonus_balance),
          totalDeposit: Number(w.total_deposit),
          totalWithdraw: Number(w.total_withdraw),
          totalWagered: Number(w.total_wagered)
        }));
        localStorage.setItem('playportal_wallets_v1', JSON.stringify(localWallets));
      }

      // 3. Recover transactions
      const { data: tData, error: tError } = await supabaseClient
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (tError) throw new Error(`Transactions Retrieve Failed: ${tError.message}`);

      if (tData && tData.length > 0) {
        const localTxs: Transaction[] = tData.map(t => ({
          id: t.id,
          userId: t.user_id,
          username: t.username,
          type: t.type as any,
          status: t.status as any,
          amount: Number(t.amount),
          paymentMethod: t.payment_method || undefined,
          paymentDetails: t.payment_details || {},
          notes: t.notes || undefined,
          agentId: t.agent_id || undefined,
          createdAt: t.created_at
        }));
        localStorage.setItem('playportal_transactions_v1', JSON.stringify(localTxs));
      }

      // 4. Recover notifications
      const { data: nData, error: nError } = await supabaseClient
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (nError) throw new Error(`Notifications Retrieve Failed: ${nError.message}`);

      if (nData && nData.length > 0) {
        const localNotifs: PortalNotification[] = nData.map(n => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          isRead: n.is_read,
          createdAt: n.created_at
        }));
        localStorage.setItem('playportal_notifications_v1', JSON.stringify(localNotifs));
      }

      // 5. Recover banners
      const { data: bData, error: bError } = await supabaseClient
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (bError) throw new Error(`Banners Retrieve Failed: ${bError.message}`);

      if (bData && bData.length > 0) {
        const localBanners: Banner[] = this.sortBannersForCarousel(bData.map((b) => this.mapSupabaseBanner(b)));
        localStorage.setItem('playportal_banners_v1', JSON.stringify(localBanners));
      }

      // 6. Recover promotions
      const { data: promoData, error: promoError } = await supabaseClient
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (promoError) throw new Error(`Promotions Retrieve Failed: ${promoError.message}`);

      if (promoData && promoData.length > 0) {
        const localPromotions: Promotion[] = promoData.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: p.image_style,
          promoCode: p.promo_code,
          bonusAmount: Number(p.bonus_amount),
          minDepositRequired: Number(p.min_deposit_required),
          isActive: p.is_active,
          type: p.type as any
        }));
        localStorage.setItem('playportal_promotions_v1', JSON.stringify(localPromotions));
      }

      const nowStr = new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
      this.updateStatus({ status: 'success', lastSyncedAt: nowStr, errorMessage: null });
      return { success: true };
    } catch (e: any) {
      console.error('Supabase Pull Retrieve Error:', e);
      this.updateStatus({ status: 'error', errorMessage: e.message || 'Could not fetch data from Supabase backend.' });
      return { success: false, error: e.message };
    }
  }
}

export const syncService = SupabaseSyncService.getInstance();
