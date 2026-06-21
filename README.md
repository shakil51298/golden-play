# Mobilized Premium Gaming Portal Demo Platform

An immersive, high-fidelity, mobile-first casino lobby and broker portal representing premium Golden Play aesthetics. Formatted in a glowing dark blue grid accented with bright neon yellows, custom hover status animations, detailed wallet management sheets, interactive slots gameplay, and complete role-based workflows for players, recruiters, and administrators.

---

## Technical Architecture & Core Features

1. **Top-Tier Neon Styling**: Custom-tuned CSS gradients (`deep space midnight blue` through `bright neon amber-yellow highlights`), gold glowing game selector borders, and a fixed bottom mobile navigation rail mimicking real casino apps.
2. **Interactive Slots Game Simulator**: A built-in, spinning mini-game matching three gold crowns, lucky sevens, or diamonds. Spin rounds directly query your mock database and add or deduct cash values instantly!
3. **Role-Based Workflows**:
   - **Player Dashboard**: Quick deposit requests (using mock G-Cash numbers, bank transfer IBANs, or USDT hashes), withdrawal dispatch, referral link copies, and private alert logs.
   - **Agent Broker Desk**: Displays referred players, tracks direct player deposits, and manages the flat 10% cash commission earned from active downline members. Let's agent broker claim commissions anytime.
   - **Master Administrative Panel**: Stats panel showing total platform volume. Review and instantly approve pending deposits or release withdrawals to credit users or recruit agents dynamically!
4. **Alphanumeric Promo Code Engine**: Toggleable promotions that invite users of specific categories (Daily Rebate vs. Slots Double Welcome offers).
5. **No-Latency Persistent Storage**: Leverages a complete LocalStorage table replication system (`profiles`, `wallets`, `transactions`, `banners`, `promotions`, `notifications`). All status logs and balance sums are preserved across page updates!
6. **Supabase Blueprint File**: Complete PostgreSQL triggers to auto-generate public profiles and pre-fund $100.00 registers are detailed inside the root file `/SUPABASE_SCHEMA.sql` to ease future cloud deployment.

---

## 🔑 Quick-Login Testing Accounts

To make evaluation of various role-routing capabilities completely frictionless, we built a **Bypass Bypass bar** inside the auth view. Alternatively, you can log in using these preset phone credentials:

| User Role | Login Credential (Phone or ID) | Test Password | Role Features |
| :--- | :--- | :--- | :--- |
| **Standard Player** | `player1` or `+63911122233` | `player123` | Plays slots, claims welcome codes, deposits manually, tracks history |
| **Recruiter Broker** | `agent77` or `+63912345678` | `agent123` | Shares referral link, monitors downline, claims commission payouts |
| **Master Admin** | `admin` or `+18885551212` | `admin123` | Audits financial requests, toggle banners/promos, views registry |

---

## 🛠️ Step-by-Step Porting instructions to Next.js & Supabase

To connect this front-end code to a real Next.js server with active Supabase instances:

### 1. Database Setup
1. Log into your account on the [Supabase Dashboard](https://supabase.com).
2. Create a new project, navigate to the **SQL Editor** on the left menu, paste all contents of the `/SUPABASE_SCHEMA.sql` file, and click **Run**.
3. This creates all requested tables, performance indices, and database triggers that securely populate profiles on new sign-ups.

### 2. Connect React Client via SDK
1. Install the Supabase Javascript Client in your project:
   ```bash
   npm install @supabase/supabase-js
   ```
2. Create a `/src/lib/supabaseClient.ts` instance file:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

### 3. Replace Local DB Actions with Supabase API
Instead of saving arrays to `localStorage` (inside `src/db/dummySupabase.ts`), fetch row-entries directly from Supabase:
- **Fetch Active User Profile**:
  ```typescript
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();
  ```
- **Approve Deposit Request (Admin)**:
  ```typescript
  // 1. Mark transaction as approved
  await supabase
    .from('transactions')
    .update({ status: 'approved' })
    .eq('id', txId);

  // 2. Increment wallet balance
  await supabase.rpc('increment_wallet_balance', { 
    target_user_id: userId, 
    add_amount: amount 
  });
  ```

---

## 🚀 Local Project Execution

To run and view this development environment locally:

1. Install local dependencies:
   ```bash
   npm install
   ```
2. Launch the Vite dev server manually:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` inside your web browser.
# golden-play
