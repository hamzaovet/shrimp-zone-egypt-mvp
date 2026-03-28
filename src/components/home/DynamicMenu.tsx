"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCountry } from "@/lib/CountryContext";
import { useCart } from "@/lib/CartContext";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStrictCategory } from "@/lib/menuUtils";

export default function DynamicMenu() {
  const { isHydrated } = useCountry();
  const { addToCart } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error("Failed to fetch menu");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error("Menu fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const [activeCategory, setActiveCategory] = useState("قسم الوجبات");

  // ── Robust Grouping Logic (Strict Fallback Pattern) ──
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const catName = getStrictCategory(item);
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }, [items]);

  const categories = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => {
      // Prioritize "الوجبات" and "العروض" if they exist
      if (a.includes("الوجبات")) return -1;
      if (b.includes("الوجبات")) return 1;
      return a.localeCompare(b);
    });
  }, [groupedItems]);

  if (!isHydrated) return null;

  return (
    <section className="py-20 bg-background w-full" id="menu">
      <div className="container mx-auto px-4">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20" />
            <p className="text-gray-400 font-black text-lg animate-pulse">جاري استكشاف أشهى المأكولات...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-white/5 backdrop-blur-md">
            <div className="text-7xl mb-8 animate-bounce">🍤</div>
            <h3 className="text-3xl font-black text-white mb-3">قائمة الطعام قيد التحديث</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-lg leading-relaxed">
              نعمل حالياً على إضافة أصناف ملكية جديدة. <br/>
              يرجى العودة خلال دقائق للاستمتاع بالمذاق الأصلي.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Horizontal Tabs Row */}
            <div className="relative sticky top-24 z-40 bg-background/80 backdrop-blur-xl py-6 border-b border-white/5">
              <div className="flex overflow-x-auto flex-nowrap gap-3 no-scrollbar pb-2 px-2 mask-fade-edges">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-8 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 active:scale-95 border ${
                      activeCategory === cat
                        ? "bg-[#F97316] text-white border-[#F97316] shadow-[0_10px_25px_rgba(249,115,22,0.3)]"
                        : "bg-white/5 text-gray-400 border-white/5 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Category Header (Visual context) */}
            <div className="flex items-center gap-6 opacity-60">
                <h2 className="text-2xl font-black text-white whitespace-nowrap">
                   {activeCategory}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                   {groupedItems[activeCategory]?.length || 0} صنف
                </span>
            </div>

            {/* Items Grid for Active Category */}
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {(groupedItems[activeCategory] || []).map((item: any) => (
                      <Card key={item._id || item.id} className="bg-secondary/20 border-white/5 overflow-hidden group rounded-[2.5rem] hover:border-primary/40 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(249,115,22,0.1)] flex flex-col h-full relative backdrop-blur-xl">
                        
                        {/* Image Container */}
                        <div className="relative h-72 w-full overflow-hidden">
                          {item.image ? (
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              fill 
                              className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-800 text-6xl bg-gradient-to-br from-white/5 to-transparent">🍤</div>
                          )}
                          
                          {/* Price Tag Overlay */}
                          <div className="absolute top-6 left-6">
                            <div className="bg-primary/90 backdrop-blur-md text-white font-black px-5 py-2.5 rounded-2xl text-lg shadow-2xl border border-white/10">
                              {item.price} <span className="text-xs opacity-80">EGP</span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className="p-8 pb-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3 text-right">
                             <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors duration-300">
                               {item.name}
                             </h3>
                             {item.description && (
                               <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                                 {item.description}
                               </p>
                             )}
                          </div>
                        </CardContent>

                        {/* Footer / Action */}
                        <CardFooter className="p-8 pt-0">
                          <Button 
                            onClick={() => addToCart({ id: item._id || item.id, title: item.name, price: item.price })}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black h-16 rounded-2xl transition-all duration-300 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 text-xl flex items-center justify-center gap-3 group/btn"
                          >
                            <span className="translate-y-[1px]">أضف للطلب</span>
                            <span className="text-sm opacity-60 group-hover/btn:translate-x-1 transition-transform">→</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
              </div>
            </div>

            {/* 🔥 Chef's Recommendations (Dynamic Section) */}
            <div className="max-w-7xl mx-auto px-4 mt-24">
               <h2 className="text-3xl text-center text-[#F97316] font-extrabold mb-12 flex items-center justify-center gap-4">
                 <span className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
                 🔥 ترشيحات الشيف
                 <span className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
               </h2>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                  {items
                    .filter(i => {
                       const n = i.name.toLowerCase();
                       return n.includes('صنية شرمب زون') || n.includes('بترفلاي') || n.includes('طاجن ديناميت') || n.includes('سالمون بكريمة الليمون');
                    })
                    .slice(0, 4)
                    .concat(items.filter(i => getStrictCategory(i).includes('الوجبات') || getStrictCategory(i).includes('الصواني')).slice(0, 4))
                    .slice(0, 4)
                    .map((item: any) => (
                       <Card key={item._id || item.id} className="bg-white/5 border-white/5 overflow-hidden group rounded-[2rem] hover:border-primary/40 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(249,115,22,0.1)] flex flex-col h-full relative backdrop-blur-xl scale-95 hover:scale-100 transition-transform">
                          <div className="relative h-56 w-full">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" sizes="25vw" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-800 text-5xl bg-white/5">🍤</div>
                            )}
                            <div className="absolute top-4 left-4">
                              <div className="bg-primary/90 text-white font-black px-4 py-2 rounded-xl text-sm shadow-xl">{item.price} <span className="text-xs opacity-80">EGP</span></div>
                            </div>
                          </div>
                          <CardContent className="p-6 pb-2">
                             <h3 className="text-lg font-black text-white text-center group-hover:text-primary transition-colors">{item.name}</h3>
                          </CardContent>
                          <CardFooter className="p-6 pt-2">
                            <Button onClick={() => addToCart({ id: item._id || item.id, title: item.name, price: item.price })} className="w-full bg-primary/20 hover:bg-primary text-primary hover:text-white font-bold h-10 rounded-lg transition-all text-xs">أضف للطلب 🔥</Button>
                          </CardFooter>
                       </Card>
                    ))}
               </div>
            </div>

            {/* Price Note */}
            <div className="pt-24 text-center">
              <div className="inline-flex items-center gap-4 px-10 py-6 rounded-3xl bg-white/[0.01] border border-white/5 backdrop-blur-2xl">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                <p className="text-gray-500 text-base md:text-lg font-bold">
                  جميع الأسعار شاملة ضريبة القيمة المضافة &nbsp;|&nbsp; تضاف خدمة ١٢٪ داخل المطعم
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
