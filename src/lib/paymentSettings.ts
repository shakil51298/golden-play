/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabaseClient } from '../db/supabaseClient';

export type PaymentChannel = 'bkash' | 'nagad';
export type PaymentProviderId = 'TKPAY' | '711TK' | 'BD99PAY' | 'HRPAY' | 'D7PAY';

export interface PaymentSetting {
  provider: PaymentProviderId;
  channel: PaymentChannel;
  walletNumber: string;
  title: string;
  serviceName: string;
  domain: string;
  warning: string;
  instructions: string;
  isActive: boolean;
}

export const paymentProviders: PaymentProviderId[] = ['TKPAY', '711TK', 'BD99PAY', 'HRPAY', 'D7PAY'];
export const paymentChannels: PaymentChannel[] = ['bkash', 'nagad'];

export const PAYMENT_SETTINGS_STORAGE_KEY = 'playportal_payment_settings_v1';
export const PAYMENT_SETTINGS_UPDATED_EVENT = 'playportal_payment_settings_updated';

const defaultWallets: Record<PaymentChannel, string> = {
  bkash: '01348089397',
  nagad: '01823903123',
};

const channelTitle: Record<PaymentChannel, string> = {
  bkash: 'BKASH Deposit',
  nagad: 'NAGAD Deposit',
};

const getDefaultSettings = (): PaymentSetting[] => (
  paymentProviders.flatMap(provider => paymentChannels.map(channel => ({
    provider,
    channel,
    walletNumber: defaultWallets[channel],
    title: channelTitle[channel],
    serviceName: `${provider} Pay Service`,
    domain: `${provider.toLowerCase()}.payment.local/pay`,
    warning: 'কম বা বেশি ক্যাশআউট করবেন না',
    instructions: `এই ${channel.toUpperCase()} নাম্বারে শুধুমাত্র ক্যাশআউট গ্রহণ করা হয়`,
    isActive: true,
  })))
);

const mergeWithDefaults = (settings: PaymentSetting[]): PaymentSetting[] => {
  const fallback = getDefaultSettings();
  return fallback.map(defaultItem => {
    const saved = settings.find(item => item.provider === defaultItem.provider && item.channel === defaultItem.channel);
    return saved ? { ...defaultItem, ...saved } : defaultItem;
  });
};

const emitPaymentSettingsUpdated = () => {
  window.dispatchEvent(new Event(PAYMENT_SETTINGS_UPDATED_EVENT));
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: PAYMENT_SETTINGS_STORAGE_KEY }));
  } catch {
    window.dispatchEvent(new Event(PAYMENT_SETTINGS_UPDATED_EVENT));
  }
  try {
    const channel = new BroadcastChannel(PAYMENT_SETTINGS_UPDATED_EVENT);
    channel.postMessage({ type: PAYMENT_SETTINGS_UPDATED_EVENT, updatedAt: Date.now() });
    channel.close();
  } catch {
    // BroadcastChannel is a progressive enhancement; storage/custom events still work.
  }
};

export const getPaymentSettings = (): PaymentSetting[] => {
  const fallback = getDefaultSettings();
  const raw = localStorage.getItem(PAYMENT_SETTINGS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as PaymentSetting[];
    return mergeWithDefaults(parsed);
  } catch {
    localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

export const savePaymentSettings = (settings: PaymentSetting[]) => {
  localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(mergeWithDefaults(settings)));
  emitPaymentSettingsUpdated();
};

const paymentSettingToRow = (item: PaymentSetting) => ({
  provider: item.provider,
  channel: item.channel,
  wallet_number: item.walletNumber,
  title: item.title,
  service_name: item.serviceName,
  domain: item.domain,
  warning: item.warning,
  instructions: item.instructions,
  is_active: item.isActive,
  updated_at: new Date().toISOString(),
});

const rowToPaymentSetting = (row: any): PaymentSetting => ({
  provider: row.provider,
  channel: row.channel,
  walletNumber: row.wallet_number,
  title: row.title,
  serviceName: row.service_name,
  domain: row.domain,
  warning: row.warning,
  instructions: row.instructions,
  isActive: row.is_active,
});

export const pullPaymentSettingsFromSupabase = async (): Promise<{ success: boolean; settings: PaymentSetting[]; error?: string }> => {
  const { data, error } = await supabaseClient
    .from('payment_settings')
    .select('*')
    .order('provider', { ascending: true })
    .order('channel', { ascending: true });

  if (error) {
    return { success: false, settings: getPaymentSettings(), error: error.message };
  }

  const settings = data && data.length > 0
    ? mergeWithDefaults(data.map(rowToPaymentSetting))
    : getPaymentSettings();

  savePaymentSettings(settings);
  return { success: true, settings };
};

export const pushPaymentSettingsToSupabase = async (settings: PaymentSetting[]): Promise<{ success: boolean; error?: string }> => {
  const mergedSettings = mergeWithDefaults(settings);
  savePaymentSettings(mergedSettings);

  const { error } = await supabaseClient
    .from('payment_settings')
    .upsert(mergedSettings.map(paymentSettingToRow), { onConflict: 'provider,channel' });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const getPaymentSetting = (provider: string, channel: string): PaymentSetting => {
  const settings = getPaymentSettings();
  return (
    settings.find(item => item.provider === provider && item.channel === channel && item.isActive) ||
    settings.find(item => item.provider === provider && item.channel === channel) ||
    getDefaultSettings()[0]
  );
};

export const refreshPaymentSetting = async (provider: string, channel: string): Promise<PaymentSetting> => {
  await pullPaymentSettingsFromSupabase();
  return getPaymentSetting(provider, channel);
};
