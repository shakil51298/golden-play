import React from 'react';

interface ProviderBadge {
  name: string;
  color: string;
  bg: string;
  borderColor: string;
  logoText: string;
  subText?: string;
}

export default function GameProviders() {
  const providers: ProviderBadge[] = [
    // Row 1
    { name: 'JILI', color: 'text-amber-400', bg: 'bg-amber-950/20', borderColor: 'border-amber-900/30', logoText: '🎰 JILI', subText: 'GAMES' },
    { name: 'SPRIBE', color: 'text-red-500', bg: 'bg-red-950/20', borderColor: 'border-red-900/30', logoText: '🛩️ SPRIBE' },
    { name: 'PG SOFT', color: 'text-teal-400', bg: 'bg-teal-950/20', borderColor: 'border-teal-900/30', logoText: '🎮 PG SOFT', subText: 'POCKET GAMES' },
    { name: 'PRAGMATIC PLAY', color: 'text-amber-500', bg: 'bg-amber-955/20', borderColor: 'border-amber-900/30', logoText: '🪐 PRAGMATIC', subText: 'PLAY' },
    { name: 'JDB', color: 'text-yellow-400', bg: 'bg-yellow-950/10', borderColor: 'border-yellow-900/20', logoText: '🔥 JDB' },
    { name: 'CQ9', color: 'text-orange-400', bg: 'bg-orange-950/20', borderColor: 'border-orange-900/30', logoText: '🎯 CQ9', subText: 'GAMING' },
    { name: 'FC FA CHAI', color: 'text-pink-400', bg: 'bg-pink-950/20', borderColor: 'border-pink-950/40', logoText: '🏮 FA CHAI', subText: 'FC GERMANY' },
    { name: 'BNG', color: 'text-emerald-400', bg: 'bg-emerald-950/20', borderColor: 'border-emerald-900/30', logoText: '🌀 BNG', subText: 'BOOONGO' },
    { name: 'BT GAMING', color: 'text-yellow-500', bg: 'bg-yellow-950/20', borderColor: 'border-yellow-900/30', logoText: '⚡ BT', subText: 'GAMING' },
    { name: 'MICROGAMING', color: 'text-sky-400', bg: 'bg-sky-950/20', borderColor: 'border-sky-900/30', logoText: '💧 MICRO', subText: 'GAMING' },
    
    // Row 2
    { name: 'PLAYTECH', color: 'text-blue-400', bg: 'bg-blue-950/20', borderColor: 'border-blue-900/30', logoText: '💠 playtech' },
    { name: 'AMEBA', color: 'text-indigo-400', bg: 'bg-indigo-950/20', borderColor: 'border-indigo-900/30', logoText: '🧬 AMEBA' },
    { name: 'WAZDAN', color: 'text-slate-300', bg: 'bg-slate-900/40', borderColor: 'border-slate-800/30', logoText: '⛓️ WAZDAN' },
    { name: 'CALETA', color: 'text-cyan-400', bg: 'bg-cyan-950/20', borderColor: 'border-cyan-900/30', logoText: '🎨 caleta' },
    { name: 'NETENT', color: 'text-green-500', bg: 'bg-green-950/20', borderColor: 'border-green-905/30', logoText: '🟢 NETENT', subText: 'BETTER GAMING' },
    { name: 'BOOMING GAMES', color: 'text-red-400', bg: 'bg-red-955/20', borderColor: 'border-red-900/40', logoText: '💣 BOOMING', subText: 'GAMES' },
    { name: 'MEGA ENTERTAINMENT', color: 'text-orange-505', bg: 'bg-orange-950/30', borderColor: 'border-orange-900/30', logoText: '💥 MEGA', subText: 'ENT' },
    { name: 'KING MIDAS', color: 'text-yellow-300', bg: 'bg-yellow-950/30', borderColor: 'border-yellow-800/40', logoText: '👑 MIDAS' },
    { name: 'ASKME SLOT', color: 'text-green-400', bg: 'bg-green-950/20', borderColor: 'border-green-900/30', logoText: '💬 askme', subText: 'SLOT' },
    { name: 'FTG', color: 'text-purple-400', bg: 'bg-purple-950/20', borderColor: 'border-purple-900/30', logoText: '⚡ FTG' },
    { name: 'KA GAMING', color: 'text-red-400', bg: 'bg-red-900/10', borderColor: 'border-red-900/20', logoText: '💮 KA GAMING' },
    { name: 'RICH88', color: 'text-pink-500', bg: 'bg-pink-950/20', borderColor: 'border-pink-900/30', logoText: '💎 R88', subText: 'RICH88' },
    { name: 'MEGAWIN', color: 'text-emerald-555', bg: 'bg-emerald-950/20', borderColor: 'border-emerald-900/30', logoText: '🎰 MEGAWIN' },

    // Row 3
    { name: 'PLAYSTAR', color: 'text-violet-400', bg: 'bg-violet-950/20', borderColor: 'border-violet-905/30', logoText: '🌟 PLAYSTAR' },
    { name: 'YELLOW BAT', color: 'text-yellow-400', bg: 'bg-yellow-950/20', borderColor: 'border-yellow-900/30', logoText: '🦇 YELLOW BAT' },
    { name: 'FIRST PERSON', color: 'text-slate-400', bg: 'bg-slate-900/30', borderColor: 'border-slate-800/30', logoText: '👤 1ST PERSON' },
    { name: 'BIG TIME GAMING', color: 'text-rose-500', bg: 'bg-rose-955/25', borderColor: 'border-rose-900/30', logoText: '🎪 BIG TIME' },
    { name: 'NOLIMIT CITY', color: 'text-yellow-500', bg: 'bg-yellow-950/20', borderColor: 'border-yellow-905/30', logoText: '☣️ NOLIMIT', subText: 'C I T Y' },
    { name: 'RED TIGER', color: 'text-red-600', bg: 'bg-red-950/30', borderColor: 'border-red-900/40', logoText: '🐯 RED TIGER' },
    { name: 'MASCOT GAMING', color: 'text-slate-300', bg: 'bg-slate-900/30', borderColor: 'border-slate-800/30', logoText: '🎭 MASCOT' },
    { name: 'GEMINI', color: 'text-cyan-400', bg: 'bg-cyan-950/20', borderColor: 'border-cyan-900/30', logoText: '♊ GEMINI' },
    { name: 'AVATAR UX', color: 'text-sky-305', bg: 'bg-sky-955/20', borderColor: 'border-sky-900/30', logoText: '👾 AVATARUX' },
    { name: 'RELAX GAMING', color: 'text-orange-400', bg: 'bg-orange-955/20', borderColor: 'border-orange-900/30', logoText: '☕ RELAX', subText: 'GAMING' },
    { name: 'HACKSAW GAMING', color: 'text-zinc-200', bg: 'bg-zinc-950/40', borderColor: 'border-zinc-800/40', logoText: '🪓 HACKSAW' },
    { name: 'SW GAMING', color: 'text-teal-500', bg: 'bg-teal-950/20', borderColor: 'border-teal-900/30', logoText: '🏹 SW' },
    { name: 'NAGA GAMES', color: 'text-orange-500', bg: 'bg-orange-950/25', borderColor: 'border-orange-900/40', logoText: '🐉 NAGA', subText: 'GAMES' },

    // Row 4
    { name: 'YGGDRASIL', color: 'text-amber-500', bg: 'bg-amber-950/15', borderColor: 'border-amber-900/20', logoText: '🌳 YGGDRASIL' },
    { name: 'FASTSPIN', color: 'text-red-500', bg: 'bg-red-950/10', borderColor: 'border-red-950/30', logoText: '🏎️ FASTSPIN' },
    { name: 'NEXTSPIN', color: 'text-cyan-500', bg: 'bg-cyan-950/15', borderColor: 'border-cyan-900/30', logoText: '🌀 NEXTSPIN' },
    { name: 'LIVE22', color: 'text-blue-400', bg: 'bg-blue-955/20', borderColor: 'border-blue-900/30', logoText: '🎡 LIVE22' },
    { name: 'OCTOPLAY', color: 'text-purple-400', bg: 'bg-purple-950/20', borderColor: 'border-purple-900/30', logoText: '🐙 OCTOPLAY' },
    { name: 'AMIGO GAMING', color: 'text-amber-400', bg: 'bg-amber-950/20', borderColor: 'border-amber-900/40', logoText: '🌵 AMIGO', subText: 'GAMING' },
    { name: 'VICTORY ARK', color: 'text-violet-500', bg: 'bg-violet-955/20', borderColor: 'border-violet-900/30', logoText: '⛵ VICTORY' },
    { name: 'EAZY GAMING', color: 'text-yellow-405', bg: 'bg-yellow-950/10', borderColor: 'border-yellow-900/20', logoText: '🎲 EAZY', subText: 'GAMING' },
    { name: 'PASCAL GAMING', color: 'text-teal-400', bg: 'bg-teal-950/20', borderColor: 'border-teal-900/30', logoText: '📐 PASCAL' },
    { name: 'RICH GAME', color: 'text-blue-500', bg: 'bg-blue-950/15', borderColor: 'border-blue-900/20', logoText: '💎 RICH GAME' },
    { name: 'MAHA GAMING', color: 'text-amber-500', bg: 'bg-amber-950/30', borderColor: 'border-amber-900/40', logoText: '🏛️ MAHA', subText: 'GAMING' },
    { name: 'BAISON GAMES', color: 'text-red-500', bg: 'bg-red-955/15', borderColor: 'border-red-900/30', logoText: '🦬 BAISON' },
    { name: 'EVOPLAY', color: 'text-cyan-405', bg: 'bg-cyan-955/20', borderColor: 'border-cyan-900/30', logoText: '🧬 EVOPLAY' },

    // Row 5
    { name: 'TPG', color: 'text-blue-400', bg: 'bg-blue-950/20', borderColor: 'border-blue-900/35', logoText: '🎯 TPG' },
    { name: '2J GAMING', color: 'text-orange-400', bg: 'bg-orange-950/20', borderColor: 'border-orange-900/30', logoText: '✌️ 2J.COM' },
    { name: 'TURBO GAMES', color: 'text-red-500', bg: 'bg-red-955/20', borderColor: 'border-red-900/30', logoText: '🚀 TURBO', subText: 'GAMES' },
    { name: 'UPG', color: 'text-yellow-500', bg: 'bg-yellow-950/20', borderColor: 'border-yellow-905/30', logoText: '🥇 UPG' },
    { name: 'AVIATOR', color: 'text-red-600', bg: 'bg-red-950/30', borderColor: 'border-red-900/30', logoText: '✈️ Aviator' },
    { name: 'WINSLOT', color: 'text-pink-400', bg: 'bg-pink-950/15', borderColor: 'border-pink-905/20', logoText: '🎰 WinSlot' },
    { name: 'IN OUT', color: 'text-yellow-400', bg: 'bg-yellow-950/20', borderColor: 'border-yellow-900/30', logoText: '🔌 INOUT' },
    { name: 'SMARTSOFT GAMING', color: 'text-rose-500', bg: 'bg-rose-955/20', borderColor: 'border-rose-900/30', logoText: '🧠 SMARTSOFT' },
    { name: 'JOKER', color: 'text-yellow-500', bg: 'bg-yellow-950/30', borderColor: 'border-yellow-800/40', logoText: '🃏 JOKER' },
    { name: 'SPADEGAMING', color: 'text-red-500', bg: 'bg-red-950/20', borderColor: 'border-red-900/35', logoText: '♠️ Spade' },
    { name: 'GAMEPLAY INTERACTIVE', color: 'text-sky-300', bg: 'bg-sky-955/15', borderColor: 'border-sky-900/30', logoText: '🌐 GAMEPLAY' },
    { name: 'EVOLUTION', color: 'text-yellow-400', bg: 'bg-yellow-950/30', borderColor: 'border-yellow-850/40', logoText: '👑 Evolution' },
    { name: 'SA GAMING', color: 'text-amber-500', bg: 'bg-amber-955/20', borderColor: 'border-amber-900/30', logoText: '⚜️ SA GAMING' }
  ];

  return (
    <div id="game_providers_section" className="w-full min-w-0 space-y-3.5 pt-5 border-t border-[#1d333a]/30">
      <div className="flex items-center gap-2 border-b border-[#1d333a]/40 pb-2">
        <span className="text-base">🎮</span>
        <h3 className="text-[13px] font-black uppercase text-slate-250 tracking-wider font-sans">
          গেম প্রদানকারী
        </h3>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
        {providers.map((p, idx) => (
          <div 
            key={`${p.name}-${idx}`}
            className={`min-w-0 flex flex-col items-center justify-center p-2 rounded-lg border ${p.borderColor} ${p.bg} hover:border-yellow-400/40 hover:scale-[1.02] active:scale-98 transition-all min-h-[54px] text-center select-none cursor-pointer group`}
          >
            <span className={`max-w-full truncate text-[11px] sm:text-[12px] font-black tracking-tight ${p.color} transition-colors group-hover:text-yellow-300 leading-none`}>
              {p.logoText}
            </span>
            {p.subText && (
              <span className="text-[7.5px] uppercase text-slate-500 block leading-none tracking-widest font-mono mt-0.5 group-hover:text-white transition-colors">
                {p.subText}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
