-- ==========================================
-- SUPABASE / POSTGRES SEED & MIGRATION SCHEMA
-- ==========================================
-- This file configures the complete backend relational schema for the
-- Golden Play gaming portal website. Run this directly inside your Supabase 
-- SQL Editor.

-- Enable UUID generation support extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Holds user meta, role parameters, and referral links)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(14) UNIQUE NOT NULL,
    phone VARCHAR(24) UNIQUE,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(24) DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
    avatar_url VARCHAR(255) DEFAULT '🦊',
    referral_code VARCHAR(12) UNIQUE NOT NULL,
    referred_by_code VARCHAR(12),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. WALLETS TABLE (Tracks real withdrawable cash stakes and promotional bonuses)
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
    bonus_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (bonus_balance >= 0),
    total_deposit NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    total_withdraw NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    total_wagered NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. TRANSACTIONS LEDGER TABLE (Manual-approval deposits, withdrawals, and payouts)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username VARCHAR(64) NOT NULL,
    type VARCHAR(24) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'bet_win', 'bet_loss', 'commission', 'bonus')),
    status VARCHAR(24) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(128),
    payment_details JSONB, -- Custom field structure for bank names, ref numbers, account details
    notes TEXT,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Connect referred users deposits to Agents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. GAMES REGISTER TABLE (Lobby catalog metadata)
CREATE TABLE IF NOT EXISTS public.games (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL CHECK (category IN ('sports', 'slots', 'live', 'fishing', 'cards', 'popular')),
    provider VARCHAR(128) NOT NULL,
    image_url TEXT NOT NULL,
    is_popular BOOLEAN DEFAULT false NOT NULL,
    plays_count INTEGER DEFAULT 0 NOT NULL,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. BANNERS TABLE (Home carousel sliders)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    image_url TEXT NOT NULL, -- Holds gradient strings or image urls
    promo_code VARCHAR(32),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. PROMOTIONS TABLE (Lobby promotions and bonus tiers)
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_style TEXT NOT NULL,
    promo_code VARCHAR(32) UNIQUE NOT NULL,
    bonus_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    min_deposit_required NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    type VARCHAR(48) DEFAULT 'welcome' CHECK (type IN ('welcome', 'rebate', 'vip', 'daily')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. PAYMENT SETTINGS TABLE (Admin-controlled deposit payment pages)
CREATE TABLE IF NOT EXISTS public.payment_settings (
    provider VARCHAR(24) NOT NULL,
    channel VARCHAR(24) NOT NULL,
    wallet_number VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    service_name VARCHAR(128) NOT NULL,
    domain TEXT NOT NULL,
    warning TEXT NOT NULL,
    instructions TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (provider, channel),
    CHECK (provider IN ('TKPAY', '711TK', 'BD99PAY', 'HRPAY', 'D7PAY')),
    CHECK (channel IN ('bkash', 'nagad'))
);

INSERT INTO public.payment_settings (
    provider,
    channel,
    wallet_number,
    title,
    service_name,
    domain,
    warning,
    instructions,
    is_active
)
SELECT
    provider,
    channel,
    CASE WHEN channel = 'bkash' THEN '01348089397' ELSE '01823903123' END,
    CASE WHEN channel = 'bkash' THEN 'BKASH Deposit' ELSE 'NAGAD Deposit' END,
    provider || ' Pay Service',
    lower(provider) || '.payment.local/pay',
    'কম বা বেশি ক্যাশআউট করবেন না',
    'এই ' || upper(channel) || ' নাম্বারে শুধুমাত্র ক্যাশআউট গ্রহণ করা হয়',
    true
FROM
    unnest(ARRAY['TKPAY', '711TK', 'BD99PAY', 'HRPAY', 'D7PAY']) AS provider,
    unnest(ARRAY['bkash', 'nagad']) AS channel
ON CONFLICT (provider, channel) DO NOTHING;

-- 7. REFERRALS LINKAGES NETWORK
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commission_earned NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(referrer_id, referee_id)
);

-- 8. NOTIFICATIONS INBOX TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(64) NOT NULL, -- Either 'all' or actual profile UUID string
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- ==========================================
-- ROW TIER SECURITY & SCHEMATIC TRIGGERS
-- ==========================================

-- Trigger: Automatically generate public Profile and a pre-funded $100 Wallet 
-- when a new user registers through Supabase auth.users system!
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    gen_referral_code VARCHAR(12);
    matched_referred_by_code VARCHAR(12);
BEGIN
    -- 1. Create original uppercase random referral code (e.g. PLAY72)
    gen_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- 2. If metadata includes referrer code, record it
    matched_referred_by_code := COALESCE(new.raw_user_meta_data->>'referredByCode', NULL);

    -- 3. Insert profile details
    INSERT INTO public.profiles (id, username, phone, email, role, avatar_url, referral_code, referred_by_code)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', 'player_unnamed'),
        COALESCE(new.phone, NULL),
        COALESCE(new.email, NULL),
        'user',
        '🦊',
        gen_referral_code,
        matched_referred_by_code
    );

    -- 4. Insert default pre-funded playing wallet
    INSERT INTO public.wallets (user_id, balance, bonus_balance, total_deposit, total_withdraw, total_wagered)
    VALUES (
        new.id,
        100.00, -- Give default registered sign-on demo stakes
        15.00,
        0.00,
        0.00,
        0.00
    );

    -- 5. Send initial welcome notification on wallet create
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
        new.id::text,
        '🎉 Registered Welcome Payout Active!',
        'Your registration bonus balance of $100.00 playing stakes is ready! Spin slot machine crowns or table cards to cashout.'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users registers
CREATE OR REPLACE TRIGGER on_supabase_user_registered
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ==========================================
-- OPTIMIZING INDEXES FOR HIGH-LOAD ACCESS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_transactions_userId ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON public.notifications(user_id);


-- ==========================================
-- DISABLING ROW LEVEL SECURITY (RLS) FOR SANDBOX DEV SYNC
-- ==========================================
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_settings DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- FALLBACK PERMISSIVE RLS POLICIES FOR SECURE DB ENVIRONMENTS
-- ==========================================

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access on profiles" ON public.profiles;
CREATE POLICY "Allow public insert access on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access on profiles" ON public.profiles;
CREATE POLICY "Allow public update access on profiles" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete access on profiles" ON public.profiles;
CREATE POLICY "Allow public delete access on profiles" ON public.profiles FOR DELETE USING (true);

-- WALLETS POLICIES
DROP POLICY IF EXISTS "Allow public read access on wallets" ON public.wallets;
CREATE POLICY "Allow public read access on wallets" ON public.wallets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access on wallets" ON public.wallets;
CREATE POLICY "Allow public insert access on wallets" ON public.wallets FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access on wallets" ON public.wallets;
CREATE POLICY "Allow public update access on wallets" ON public.wallets FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete access on wallets" ON public.wallets;
CREATE POLICY "Allow public delete access on wallets" ON public.wallets FOR DELETE USING (true);

-- TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Allow public read access on transactions" ON public.transactions;
CREATE POLICY "Allow public read access on transactions" ON public.transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access on transactions" ON public.transactions;
CREATE POLICY "Allow public insert access on transactions" ON public.transactions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access on transactions" ON public.transactions;
CREATE POLICY "Allow public update access on transactions" ON public.transactions FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete access on transactions" ON public.transactions;
CREATE POLICY "Allow public delete access on transactions" ON public.transactions FOR DELETE USING (true);

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Allow public read access on notifications" ON public.notifications;
CREATE POLICY "Allow public read access on notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access on notifications" ON public.notifications;
CREATE POLICY "Allow public insert access on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access on notifications" ON public.notifications;
CREATE POLICY "Allow public update access on notifications" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete access on notifications" ON public.notifications;
CREATE POLICY "Allow public delete access on notifications" ON public.notifications FOR DELETE USING (true);

-- BANNERS POLICIES
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.banners TO anon, authenticated;
DROP POLICY IF EXISTS "Demo public read banners" ON public.banners;
CREATE POLICY "Demo public read banners" ON public.banners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Demo admin publish banners" ON public.banners;
CREATE POLICY "Demo admin publish banners" ON public.banners FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Demo admin update banners" ON public.banners;
CREATE POLICY "Demo admin update banners" ON public.banners FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Demo admin delete banners" ON public.banners;
CREATE POLICY "Demo admin delete banners" ON public.banners FOR DELETE TO anon, authenticated USING (true);

-- PAYMENT SETTINGS POLICIES
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payment_settings TO anon, authenticated;
DROP POLICY IF EXISTS "Demo public read payment settings" ON public.payment_settings;
CREATE POLICY "Demo public read payment settings" ON public.payment_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Demo admin insert payment settings" ON public.payment_settings;
CREATE POLICY "Demo admin insert payment settings" ON public.payment_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Demo admin update payment settings" ON public.payment_settings;
CREATE POLICY "Demo admin update payment settings" ON public.payment_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Demo admin delete payment settings" ON public.payment_settings;
CREATE POLICY "Demo admin delete payment settings" ON public.payment_settings FOR DELETE TO anon, authenticated USING (true);
