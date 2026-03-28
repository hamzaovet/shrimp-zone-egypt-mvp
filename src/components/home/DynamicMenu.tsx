"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCountry } from "@/lib/CountryContext";
import { useCart } from "@/lib/CartContext";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DynamicMenu() {
  const { isHydrated } = useCountry();
  const { addToCart } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menu');
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Egypt only — filter by مصر
  const countryItems = useMemo(() => items.filter(i => i.country === 'مصر'), [items]);
  const availableCategories = useMemo(() => {
    const names = countryItems.map(i => typeof i.category === 'object' ? i.category?.name : i.category);
    return Array.from(new Set(names)).filter(Boolean);
  }, [countryItems]);

  useEffect(() => {
    if (!loading && availableCategories.length > 0) {
      if (!availableCategories.includes(activeCategory)) {
        setActiveCategory(availableCategories[0] as string);
      }
    }
  }, [availableCategories, activeCategory, loading]); 

  if (!isHydrated) return null;

  const currentCategoryItems = countryItems.filter(i => {
    const catName = typeof i.category === 'object' ? i.category?.name : i.category;
    return catName === activeCategory;
  });

  return (
    <section className="py-16 bg-background w-full">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-black text-white text-center mb-10">قائمة الطعام</h2>
        
        {loading ? (
          <div className="text-center py-20 text-gray-400">جاري تحميل المنيو...</div>
        ) : availableCategories.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-secondary/20 rounded-2xl border border-white/5">
            المنيو قيد التحديث حالياً. يرجى التحقق لاحقاً.
          </div>
        ) : (
          <>
            <div className="flex overflow-x-auto gap-3 pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {availableCategories.map((cat, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCategory(cat as string)}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    activeCategory === cat
                      ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] scale-105'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {cat as string}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 min-h-[400px]">
              {currentCategoryItems.map((item) => (
                <Card key={item._id || item.id} className="bg-secondary/40 border-white/10 overflow-hidden group rounded-xl hover:border-white/20 transition-colors">
                  <div className="relative h-48 w-full overflow-hidden bg-white/5 rounded-t-lg">
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.name || item.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl">🍤</div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h3 className="text-xl font-bold text-white leading-tight">{item.name || item.title}</h3>
                      <span className="text-primary font-black bg-primary/10 px-3 py-1 rounded-full text-sm whitespace-nowrap">
                        {item.price} EGP
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </CardContent>
                  <CardFooter className="p-5 pt-0">
                    <Button 
                      onClick={() => addToCart({ id: item._id || item.id, title: item.name || item.title, price: item.price })}
                      className="w-full bg-[#FF5722] hover:bg-[#FF5722]/80 text-white font-bold transition-all duration-300 rounded-xl hover:scale-[1.02] shadow-md"
                    >
                      أضف للسلة
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500 font-medium bg-secondary/30 inline-block px-6 py-3 rounded-full border border-white/5">
                الأسعار شاملة ضريبة القيمة المضافة. يضاف 12% خدمة داخل الصالة.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
