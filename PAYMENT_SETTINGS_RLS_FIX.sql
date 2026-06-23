-- Run this in Supabase SQL Editor once.
-- It creates the admin-controlled payment_settings table used by the
-- customer deposit payment popup.

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

ALTER TABLE public.payment_settings DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payment_settings TO anon, authenticated;

DROP POLICY IF EXISTS "Demo public read payment settings" ON public.payment_settings;
CREATE POLICY "Demo public read payment settings" ON public.payment_settings
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Demo admin insert payment settings" ON public.payment_settings;
CREATE POLICY "Demo admin insert payment settings" ON public.payment_settings
FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Demo admin update payment settings" ON public.payment_settings;
CREATE POLICY "Demo admin update payment settings" ON public.payment_settings
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Demo admin delete payment settings" ON public.payment_settings;
CREATE POLICY "Demo admin delete payment settings" ON public.payment_settings
FOR DELETE TO anon, authenticated
USING (true);
