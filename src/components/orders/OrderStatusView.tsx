"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Truck, ChefHat, ShoppingBag, ArrowRight } from "lucide-react";

export default function OrderStatusView({ orderId: propOrderId }: { orderId?: string }) {
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(propOrderId || null);

  // 1. استعادة الـ ID من الذاكرة لو العميل رجع من الرئيسية
  useEffect(() => {
    if (!activeOrderId) {
      const savedOrderId = localStorage.getItem("current_shrimpzone_order");
      if (savedOrderId) setActiveOrderId(savedOrderId);
      else setIsLoading(false);
    } else {
      localStorage.setItem("current_shrimpzone_order", activeOrderId);
    }
  }, [activeOrderId]);

  // 2. الـ Polling (النبض) - تحديث كل 5 ثواني
  useEffect(() => {
    const idToFetch = activeOrderId; 
    if (!idToFetch) return;

    const fetchLiveStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${idToFetch}/status?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (res.ok) {
          const liveData = await res.json();
          console.log(`[POLLING] Status Update:`, liveData.status);
          setOrderData(liveData); 
        }
      } catch (err) {
        console.error("Polling error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveStatus();
    const intervalId = setInterval(fetchLiveStatus, 5000);
    return () => clearInterval(intervalId);
  }, [activeOrderId]); 

  // 3. دالة ترجمة الحالات (التي تربط الـ POS بالشاشة)
  const getActiveStep = (status: string) => {
    const s = status?.toLowerCase() || '';
    
    // المرحلة 0: تم استلام الطلب
    if (s === 'pending' || s === 'جديد') return 0;
    
    // المرحلة 1: جاري التحضير (المطبخ)
    if (s === 'preparing' || s === 'جاري التحضير') return 1;
    
    // المرحلة 2: خرج للتوصيل (بمجرد ما يبقى جاهز أو يتحرك الطيار)
    if (['ready', 'جاهز', 'جاهز للاستلام', 'out_for_delivery', 'dispatched', 'on_the_way', 'shipped', 'توصيل', 'خرج للتوصيل'].includes(s)) {
      return 2;
    }
    
    // المرحلة 3: تم التسليم (بمجرد ما الكاشير يدوس تحصيل وإغلاق أو الحالة تبقى مكتملة)
    if (['delivered', 'completed', 'مكتمل', 'تم التسليم', 'paid', 'مدفوع'].includes(s)) {
      return 3;
    }
    
    return 0; 
  };

  const currentStepIndex = getActiveStep(orderData?.status);

  const steps = [
    { id: "placed", label: "تم استلام الطلب", icon: ShoppingBag },
    { id: "preparing", label: "جاري التحضير في المطبخ", icon: ChefHat },
    { id: "delivery", label: "خرج للتوصيل", icon: Truck },
    { id: "delivered", label: "تم التسليم بنجاح", icon: CheckCircle2 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activeOrderId && !orderData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-[#0a0a0a] p-10 text-center">
        <p className="text-gray-400 mb-6">لا يوجد طلب نشط حالياً لمتابعته</p>
        <Link href="/" className="px-8 py-3 bg-[#FF5722] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20">
          اطلب الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-8 px-5 max-w-md mx-auto min-h-screen bg-[#0a0a0a]">
      {/* الهيدر */}
      <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <h2 className="text-3xl font-black text-white mb-2">تتبع طلبك</h2>
        <p className="text-gray-400 text-sm">رقم الطلب: <span className="text-[#FF5722] font-bold">#{activeOrderId?.slice(-6).toUpperCase()}</span></p>
      </div>

      {/* الخطوات (الـ Stepper) */}
      <div className="relative space-y-12 before:absolute before:inset-0 before:left-[21px] before:w-0.5 before:bg-white/5 before:h-[calc(100%-48px)]">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentStepIndex > idx;
          const isActive = currentStepIndex === idx;

          return (
            <div key={step.id} className="flex gap-6 items-start relative animate-in fade-in slide-in-from-right-4 duration-500">
              <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-700 ring-4 ${
                isCompleted ? "bg-[#FF5722] text-white ring-orange-500/20" : 
                isActive ? "bg-[#FF5722] text-white ring-orange-500/40 scale-125 shadow-[0_0_25px_rgba(255,87,34,0.5)]" : 
                "bg-slate-800 text-gray-500 ring-transparent opacity-50"
              }`}>
                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
              </div>

              <div className="flex-1 pt-1.5">
                <h3 className={`font-bold text-lg transition-colors duration-500 ${isCompleted || isActive ? "text-white" : "text-gray-600"}`}>
                  {step.label}
                </h3>
                {isActive && (
                  <p className="text-[#FF5722] text-[11px] font-bold animate-pulse mt-1">
                    {idx === 0 && "استلمنا طلبك وبنراجعه دلوقتي.. ✨"}
                    {idx === 1 && "الملك بيحضرلك طلبك دلوقتي.. استعد! 🔥"}
                    {idx === 2 && "الطيار طار بالأكل وجيلك في الطريق! 🛵"}
                    {idx === 3 && "بالهنا والشفا يا ملك! نورتنا ❤️"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* صندوق الوقت المتوقع */}
      <div className="mt-16 bg-white/5 border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#FF5722]/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
        <Clock className="h-10 w-10 text-[#FF5722] mx-auto mb-4 animate-bounce" />
        <h4 className="text-white font-bold mb-2">الوقت المتوقع للتوصيل</h4>
        <p className="text-4xl font-black text-[#FF5722]">25 - 35 دقيقة</p>
      </div>

      {/* الأزرار */}
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/" className="w-full py-5 bg-white/5 text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 border border-white/5 active:scale-95 transition-all">
           <ArrowRight className="h-5 w-5" /> العودة للرئيسية
        </Link>
        <button 
          onClick={() => { localStorage.removeItem("current_shrimpzone_order"); window.location.href='/'; }}
          className="w-full py-4 text-gray-600 text-[10px] font-bold border border-white/5 rounded-2xl hover:text-white transition-all tracking-widest uppercase">
          إنهاء جلسة التتبع الحالية
        </button>
      </div>
    </div>
  );
}