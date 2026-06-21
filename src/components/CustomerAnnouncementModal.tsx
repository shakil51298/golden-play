import React, { useState } from 'react';
import { X, Megaphone, HelpCircle } from 'lucide-react';
import { PortalAnnouncement } from '../types';

interface CustomerAnnouncementModalProps {
  announcements: PortalAnnouncement[];
  onClose: () => void;
}

export default function CustomerAnnouncementModal({ announcements, onClose }: CustomerAnnouncementModalProps) {
  const [selectedId, setSelectedId] = useState<string>(
    announcements && announcements.length > 0 ? announcements[0].id : ''
  );

  const selectedItem = announcements.find((item) => item.id === selectedId);

  // Fallback default image: uses our newly generated tropical slot promo graphic
  const illustrationUrl = '/src/assets/images/promo_popup_graphic_1782019976151.jpg';

  if (!announcements || announcements.length === 0) return null;

  return (
    <div 
      id="customer_announcement_overlay" 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4"
    >
      {/* Outer Floating Headline Ribbon as shown in user's header screenshot */}
      <div className="flex items-center gap-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white p-2.5 px-6 rounded-full shadow-lg border border-red-500 mb-3 animate-bounce shrink-0">
        <Megaphone size={18} className="text-white animate-pulse shrink-0" />
        <span className="text-sm font-black uppercase tracking-wider font-sans select-none flex items-center gap-1.5 Bengali-Headline">
          ঘোষণা <span className="text-[10px] font-mono bg-yellow-400 text-red-950 px-1.5 py-0.5 rounded-full font-bold">PROMO</span>
        </span>
      </div>

      {/* Main Complex Modal Body */}
      <div 
        id="customer_announcement_modal" 
        className="bg-[#121f2d] border-2 border-[#1c324a] bg-gradient-to-br from-[#121f2d] to-[#0c1620] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[560px] relative text-slate-100"
      >
        
        {/* ============================================== */}
        {/* LEFT TAB SIDEBAR MENU                           */}
        {/* ============================================== */}
        <aside className="w-full md:w-[32%] bg-[#080e15] border-r border-[#1a2d3e] flex flex-col justify-between p-4 shrink-0">
          
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-[#1b3044] pb-2">
              <span className="text-[10px] text-slate-400 block font-mono">ACTIVE CAMPAIGNS</span>
              <h4 className="text-xs font-black text-[#60a5fa] uppercase tracking-wider">m71 Official News</h4>
            </div>

            {/* List of scrollable announcement headlines list */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {announcements.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-2.5 transition-all cursor-pointer text-xs relative border group select-none ${
                      isSelected 
                        ? 'bg-[#18304c] text-yellow-300 font-bold border-[#20456c] shadow' 
                        : 'text-slate-400 font-medium border-transparent hover:text-slate-200 hover:bg-[#0c1621]'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`shrink-0 w-2 h-2 rounded-full ${
                        isSelected 
                          ? 'bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-ping' 
                          : 'bg-slate-600'
                      }`} />
                      <span className="truncate pr-1">{item.tabTitle}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-tighter shrink-0 block uppercase ${
                        item.badge === 'HOT' ? 'bg-red-500 text-white' : 'bg-[#10b981] text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simple Left Pagination Footer matching the '< 1 >' in user's picture */}
          <div className="flex items-center justify-between pt-3 border-t border-[#142636] text-[11px] text-slate-500 font-mono mt-3">
            <button 
              type="button"
              disabled 
              className="text-[#60a5fa]/40 hover:text-white cursor-not-allowed select-none transition-colors"
            >
              &lt; Prev
            </button>
            <span className="font-bold text-[#60a5fa] bg-[#10233b] px-3 py-0.5 rounded border border-[#1c3859]">
              Page 1 / 1
            </span>
            <button 
              type="button"
              disabled 
              className="text-[#60a5fa]/40 hover:text-white cursor-not-allowed select-none transition-colors"
            >
              Next &gt;
            </button>
          </div>

        </aside>

        {/* ============================================== */}
        {/* RIGHT BOARD CARD DISPLAY                       */}
        {/* ============================================== */}
        <section className="flex-1 bg-gradient-to-b from-[#102030] to-[#070e17] p-6 pr-5 flex flex-col justify-between relative overflow-y-auto">
          
          {/* Top absolute Close X icon built specifically inside the card to keep layout pristine */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 bg-red-600/10 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/20 rounded-full p-2 transition-all cursor-pointer shadow-md"
            title="Close Banner Announcement"
          >
            <X size={18} />
          </button>

          {selectedItem ? (
            <div className="space-y-4 flex flex-col flex-1">
              
              {/* Card Meta details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 block font-bold tracking-widest font-mono uppercase">
                    GOLDEN PLAY OFFICIAL PROMO
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-white hover:text-yellow-100 transition-colors uppercase tracking-tight">
                  {selectedItem.mainTitle}
                </h3>
                {selectedItem.subtitle && (
                  <p className="text-xs text-[#60a5fa] font-semibold leading-normal">
                    {selectedItem.subtitle}
                  </p>
                )}
              </div>

              {/* Grid content split: Text details + Banner art side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
                
                {/* 1. Left Grid side: Info table structured exactly like the custom screenshot */}
                <div className="lg:col-span-7 flex flex-col h-full justify-between space-y-4">
                  
                  {/* Rich parameters Table listing benefits */}
                  <div className="space-y-2 mt-1">
                    {selectedItem.rewardLines && selectedItem.rewardLines.length > 0 ? (
                      selectedItem.rewardLines.map((line, idx) => (
                        <div 
                          key={idx} 
                          className="bg-[#0b1622] hover:bg-[#0e2133] border border-[#203a56]/50 p-3 rounded-xl flex justify-between items-center text-xs transition-transform transform hover:scale-[1.01]"
                        >
                          <span className="font-bold text-slate-300 font-sans">{line.label}</span>
                          <span className="font-mono text-yellow-405 font-extrabold text-right text-[#34d399] bg-[#064e3b]/30 px-2.5 py-0.5 rounded-md border border-[#065f46]/30">
                            {line.value}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="bg-[#0b1622] p-4 rounded-xl text-xs text-slate-400 italic">
                        No parameters config rows. Direct static message shown below.
                      </div>
                    )}
                  </div>

                  {/* Body textual Content details */}
                  <div className="bg-[#080d15]/80 p-3.5 rounded-xl border border-[#1b2d3f] text-[11px] text-slate-300 leading-relaxed space-y-1">
                    <p className="font-medium text-slate-400 font-sans text-[10px] uppercase block tracking-wider">
                      📝 Campaign Mechanics & Terms:
                    </p>
                    <p className="font-sans font-medium text-slate-200">
                      {selectedItem.content}
                    </p>
                  </div>

                </div>

                {/* 2. Right Grid side: Illustration graphic generated based on exact screenshot assets */}
                <div className="lg:col-span-5 h-full flex flex-col items-center justify-center">
                  <div className="w-full h-full min-h-[160px] bg-[#08101a] rounded-2xl border border-[#1f3853] p-1 overflow-hidden relative shadow-inner flex items-center justify-center group">
                    <img 
                      src={selectedItem.imageUrl || illustrationUrl} 
                      referrerPolicy="no-referrer"
                      alt="promo art graphic representation" 
                      className="w-full h-full object-cover rounded-xl transition-all duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback simple geometric rendering if graphic fails to resolve
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2.5">
                      <span className="text-[9px] text-yellow-400 font-black tracking-wider uppercase bg-black/40 px-2 py-0.5 rounded border border-yellow-500/15 w-max">
                        RIG VERIFIED VIP
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom footer button that can serve directly as support query or play click */}
              <div className="pt-2 border-t border-[#1b3045]/60 flex justify-end gap-2.5 items-center shrink-0">
                <span className="text-[9px] text-slate-500 font-mono">CODE: M71-BANNER-{selectedItem.id.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 cursor-pointer uppercase font-sans select-none"
                >
                  কন্টিনিউ করুন (Continue Playing)
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono">
              <HelpCircle size={40} className="mb-2 text-slate-600 animate-bounce" />
              <span>No campaign details loaded or active.</span>
            </div>
          )}

        </section>

      </div>
    </div>
  );
}
