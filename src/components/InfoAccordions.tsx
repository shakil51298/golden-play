import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

export default function InfoAccordions() {
  const [openId, setOpenId] = useState<string | null>(null);

  const items: AccordionItem[] = [
    {
      id: 'item-1',
      title: 'আমাদের সম্পর্কে',
      content: 'Golden Play হলো একটি বিশ্বস্ত এবং নিরাপদ গেমিং প্ল্যাটফর্ম। এখানে রয়েছে আকর্ষণীয় স্লট গেমস, লাইভ ডিলার এবং ক্রীড়া খেলার চমৎকার অভিজ্ঞতা। আমাদের লক্ষ্য ব্যবহারকারীদের সর্বোচ্চ সেবা ও দ্রুত পেমেন্ট সুবিধা নিশ্চিত করা।'
    },
    {
      id: 'item-2',
      title: 'সাহায্য কেন্দ্র',
      content: 'যেকোনো সাহায্য বা জিজ্ঞাসার জন্য আমাদের ২৪/৭ কাস্টমার সাপোর্ট এবং হেল্পলাইন রয়েছে। আমানত বা উত্তোলনের কোনো সমস্যা হলে আমাদের কাস্টমার এজেন্টদের তাৎক্ষণিক মেসেজ বা টেলিগ্রাম চ্যানেলে যোগাযোগ করুন।'
    },
    {
      id: 'item-3',
      title: 'সাহায্য কেন্দ্র ', // With a space to keep id list unique
      content: 'সহজ ডিপোজিট বা উত্তোলন পদ্ধতি সম্পন্ন করার গাইডলাইন। যেকোনো বিকাশ, নগদ বা রকেট ট্রান্সফার সফলভাবে সম্পন্ন হওয়ার পর খুবই দ্রুততম সময়ের মধ্যে আপনার ম্যানুয়াল ব্যালেন্স আপডেট করে দেওয়া হয়।'
    },
    {
      id: 'item-4',
      title: 'গেমস',
      content: 'আমাদের প্ল্যাটফর্মে রয়েছে বিশ্বের ডজন খানেক স্বনামধন্য গেম প্রোভাইডারদের স্লট, ক্র্যাশ গেমস, লাইভ রুলেট, ব্ল্যাকজ্যাক, স্পোর্টসবুক এবং চমৎকার চমৎকার আন্দর বাহার গেম।'
    },
    {
      id: 'item-5',
      title: 'শর্তাবলী',
      content: 'Golden Play একটি বিনোদনমূলক সিমুলেটর প্ল্যাটফর্ম। কোনো খেলায় অংশ নেওয়ার পূর্বে অবশ্যই প্ল্যাটফর্মের নিয়মাবলী, বোনাস রোলওভার রুলস এবং অ্যাকাউন্ট সিকিউরিটি গাইডলাইন সমুহ দেখে নিন।'
    },
    {
      id: 'item-6',
      title: 'গোপনীয়তা ও নিরাপত্তা',
      content: 'আমরা আপনার ব্যক্তিগত তথ্য এবং প্লেয়ার আইডি ও পাসওয়ার্ড সম্পূর্ণ সুরক্ষিত রাখি। এনক্রিপ্টেড ডাটাবেজের মাধ্যমে সকল লেনদেন রেকর্ড করা হয়, যা শতভাগ নিরাপদ ও বিশ্বস্ত।'
    },
    {
      id: 'item-7',
      title: 'প্রশ্নোত্তর',
      content: 'সাধারণ সাজেশন্স সমুহ এবং প্রোমোশনাল বোনাস ক্লেইম নিয়ে যেকোনো প্রশ্নের উত্তর কাস্টমার গাইড বুকে বিস্তারিত পাওয়া যাবে। আপনি কাস্টমার কেয়ারেও চ্যাট করতে পারেন।'
    }
  ];

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div id="info_accordions_section" className="space-y-2 pt-4">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div 
            key={item.id}
            id={`accordion_item_${item.id}`}
            className="border border-[#1d333a] bg-[#14262b] rounded-lg overflow-hidden transition-all duration-300"
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-left text-slate-100 hover:text-yellow-405 transition-colors font-sans focus:outline-hidden cursor-pointer"
            >
              <span className="text-xs font-bold md:text-sm tracking-wide">
                {item.title}
              </span>
              <span className="text-white shrink-0 ml-4 font-black">
                {isOpen ? (
                  <Minus size={15} className="text-yellow-400 transition-transform duration-300 rotate-180" />
                ) : (
                  <Plus size={15} className="text-slate-200 transition-transform duration-300" />
                )}
              </span>
            </button>
            
            {isOpen && (
              <div 
                className="px-4 pb-4 pt-1 text-slate-300 text-[11px] leading-relaxed border-t border-[#1d333a]/50 font-sans transition-all duration-300"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
