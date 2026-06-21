import React from 'react';
import { Game } from '../types';

interface RecentWinner {
  id: string;
  username: string;
  gameId: string;
  gameTitle: string; // Internal title to match Game list
  gameTitleBn: string; // Bengali display title (as in image)
  amount: number;
}

interface RecentWinnersProps {
  games: Game[];
  onPlayGame: (game: Game) => void;
}

export default function RecentWinners({ games, onPlayGame }: RecentWinnersProps) {
  // Mock data inspired exactly by the user's reference image
  const winnersList: RecentWinner[] = [
    {
      id: 'w-1',
      username: '****212',
      gameId: 'g-cards-3',
      gameTitle: 'Andar Bahar',
      gameTitleBn: 'আন্দর বাহার',
      amount: 15360,
    },
    {
      id: 'w-2',
      username: '***n26',
      gameId: 'g-cards-4',
      gameTitle: '7 Up 7 Down',
      gameTitleBn: '7 Up 7 Down',
      amount: 12020,
    },
    {
      id: 'w-3',
      username: '********267',
      gameId: 'g-fish-3',
      gameTitle: 'Ocean King',
      gameTitleBn: 'ওশান কিং জ্যাকপট',
      amount: 3344,
    },
    {
      id: 'w-4',
      username: '*****a27',
      gameId: 'g-slots-5',
      gameTitle: 'Fortune King',
      gameTitleBn: 'ফরচুন কিং জ্যাকপট',
      amount: 1750,
    },
    {
      id: 'w-5',
      username: '********026',
      gameId: 'g-fish-3',
      gameTitle: 'Ocean King',
      gameTitleBn: 'ওশান কিং জ্যাকপট',
      amount: 663.6,
    },
    {
      id: 'w-6',
      username: '****714',
      gameId: 'g-cards-3',
      gameTitle: 'Andar Bahar',
      gameTitleBn: 'আন্দর বাহার',
      amount: 8850,
    },
    {
      id: 'w-7',
      username: '***x99',
      gameId: 'g-slots-5',
      gameTitle: 'Fortune King',
      gameTitleBn: 'ফরচুন কিং জ্যাকপট',
      amount: 19500,
    },
    {
      id: 'w-8',
      username: '*****p03',
      gameId: 'g-cards-4',
      gameTitle: '7 Up 7 Down',
      gameTitleBn: '7 Up 7 Down',
      amount: 4320,
    }
  ];

  const handleGameNameClick = (gameId: string) => {
    const found = games.find(g => g.id === gameId);
    if (found) {
      onPlayGame(found);
    }
  };

  // Duplicate items array to make a continuous seamless marquee scroll
  const scrollList = [...winnersList, ...winnersList, ...winnersList];

  return (
    <div 
      id="recent_winners_container"
      className="bg-[#173239] rounded-2xl border border-[#234d57] overflow-hidden flex flex-col md:flex-row shadow-[0_4px_24px_rgba(0,0,0,0.3)] select-none"
    >
      {/* Left Artwork Column: 1/3 Width on screen */}
      <div 
        id="recent_winners_art_col" 
        className="w-full md:w-[32%] bg-[#12272c] relative p-5 flex flex-col justify-end min-h-[140px] md:min-h-[220px] overflow-hidden border-b md:border-b-0 md:border-r border-[#234d57]/60"
      >
        {/* Background Image generated exactly for the app */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/recent_winners_art_1781859913413.jpg"
            alt="Caishen and Lucky Cat" 
            className="w-full h-full object-cover opacity-85 object-center mix-blend-lighten scale-102"
            referrerPolicy="no-referrer"
          />
          {/* Soft dark teal gradient overlay to meld text nicely */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12272c] via-transparent to-[#12272c]/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#12272c]/50 via-transparent to-transparent"></div>
        </div>

        {/* Text Area matched explicitly with the Bengali reference in the image */}
        <div className="relative z-10 space-y-1 mt-auto">
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-amber-500 tracking-tighter leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-sans">
            সাম্প্রতিক
          </h2>
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-500 tracking-tighter leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-sans">
            বিজয়ী
          </h2>
          <p className="text-[9px] font-mono tracking-widest text-[#699a9e] uppercase block mt-1.5 font-bold">
            ⚡ LIVE WINNERS FEED
          </p>
        </div>
      </div>

      {/* Right Column: Autoscrolling Winners Marquee Table */}
      <div 
        id="recent_winners_feed_col"
        className="flex-1 bg-[#152e35]/30 p-3 relative h-[180px] md:h-[220px] overflow-hidden"
      >
        {/* Continuous upward animation container */}
        <div className="h-full overflow-hidden relative">
          <div 
            id="winners_scroller_inner"
            className="space-y-2.5 animate-[scrollUp_24s_linear_infinite] hover:[animation-play-state:paused] active:[animation-play-state:paused]"
            style={{
              animationPlayState: 'running',
            }}
          >
            {scrollList.map((winner, idx) => (
              <div 
                key={`${winner.id}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#1d3c44] border border-[#2d5c66] hover:border-yellow-400/40 hover:bg-[#224750] transition-colors gap-3 cursor-pointer group"
                onClick={() => handleGameNameClick(winner.gameId)}
              >
                {/* Left side: shiny medal badge */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center relative bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
                    {/* Tiny Ribbon Layer */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-yellow-200 shadow-xs">
                      <span className="text-[7px] text-white font-black font-sans">★</span>
                    </div>
                    {/* Shiny star in center */}
                    <span className="text-sm select-none">🎖️</span>
                  </div>

                  {/* Username & clickable game name link */}
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-300 block font-mono">{winner.username}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGameNameClick(winner.gameId);
                      }}
                      className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors uppercase flex items-center gap-1 text-left font-sans cursor-pointer group-hover:underline"
                    >
                      <span>{winner.gameTitleBn}</span>
                      {/* glowing play button dot */}
                      <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] scale-90 group-hover:bg-red-500 shadow-sm leading-none shrink-0 font-bold">▶</span>
                    </button>
                  </div>
                </div>

                {/* Right side: Golden Coin & Amount */}
                <div className="bg-[#12272c] px-3.5 py-1.5 rounded-full border border-[#234d57]/60 flex items-center gap-1.5 shrink-0 min-w-[95px] justify-end shadow-inner">
                  <span className="text-sm select-none">🪙</span>
                  <span className="font-mono text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300">
                    ৳{winner.amount.toLocaleString(undefined, { minimumFractionDigits: winner.amount % 1 === 0 ? 0 : 1 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ambient top and bottom fade overlay covers to look premium */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#152e35] via-[#152e35]/40 to-transparent pointer-events-none z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#152e35] via-[#152e35]/40 to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Styled animation definition so Vite compiles correctly without external css modules */}
      <style>{`
        @keyframes scrollUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
}
