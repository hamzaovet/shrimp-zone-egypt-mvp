"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Target, Radio, Waves, Sparkles } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const radarOffers = [
  {
    id: "radar-1",
    name: "صينية 'أنا مش خرونج'",
    description: "10 جمبري مشوي، 10 مقلي، 10 باترفلاي، 300جم بلدي، كيلو أرز",
    price: 1765,
    angle: 0,
    distance: 140,
    icon: "🦐",
    details: "صينية القوة لمن يجرؤ فقط! تشكيلة ملكية من الجمبري بمختلف أنواعه تكفي العائلة والملوك."
  },
  {
    id: "radar-2",
    name: "صاروخ بهيج النووي",
    description: "مشكل سي فود بخلطة الملك السرية في رغيف جبار",
    price: 85,
    angle: 72,
    distance: 160,
    icon: "🚀",
    details: "انفجار من النكهات في كل قضمة! خلطة سرية وقوة نووية تشبع جوع الوحوش."
  },
  {
    id: "radar-3",
    name: "صينية 'طير إنت'",
    description: "4 بلطي، 4 سلطعون، 6 جمبري مشوي، 9 محار، أرز وشوربات",
    price: 1500,
    angle: 144,
    distance: 120,
    icon: "🦀",
    details: "تطير بك لعالم من الفسفور! وجبة متكاملة تجمع بين الأسماك والقشريات والشوربات الغنية."
  },
  {
    id: "radar-4",
    name: "صينية المبكبكة الكبيرة",
    description: "40 جمبري، كيلو مكرونة صوص أحمر حار، شوربة",
    price: 1200,
    angle: 216,
    distance: 150,
    icon: "🍝",
    details: "بحر من المكرونة والجمبري! لمحبي الصوص الأحمر الحار والكميات الإجرامية التي تشبع الجميع."
  },
  {
    id: "radar-5",
    name: "وجبة البلطية العايمة",
    description: "سمكة بلطي مقلي، 2 جمبري، أرز، سلطة، شوربة",
    price: 205,
    angle: 288,
    distance: 130,
    icon: "🐟",
    details: "الوجبة المثالية للفرد الواحد! سمكة بلطي طازجة مع لمسة من الجمبري والأرز المفلفل."
  },
];

export default function ExclusiveOffers() {
  const { addToCart, setDrawerOpen } = useCart();
  const [hoveredOffer, setHoveredOffer] = useState<typeof radarOffers[0] | null>(null);
  const [bubbles, setBubbles] = useState<{ id: number; left: string; size: string; delay: string; duration: string }[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Generate bubble particles
    const newBubbles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 15 + 5}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 10 + 5}s`,
    }));
    setBubbles(newBubbles);
  }, []);

  const handleAddToCart = (offer: typeof radarOffers[0]) => {
    addToCart({ id: offer.id, title: offer.name, price: offer.price });
    setDrawerOpen(true);
  };

  return (
    <section className="py-24 bg-[#050B1B] w-full relative overflow-hidden flex items-center justify-center min-h-[850px]">
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F] via-[#050B1B] to-[#01050A]" />
      
      {/* Bubble Particles */}
      {hasMounted && bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "-10%", opacity: [0, 0.5, 0] }}
          transition={{
            duration: parseFloat(bubble.duration),
            repeat: Infinity,
            delay: parseFloat(bubble.delay),
            ease: "linear",
          }}
          className="absolute bg-teal-500/20 rounded-full blur-[2px]"
          style={{ left: bubble.left, width: bubble.size, height: bubble.size }}
        />
      ))}

      {/* Deep Sea Overlay Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: "radial-gradient(circle, #2dd4bf 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="container mx-auto px-4 relative z-20 flex flex-col items-center">
        
        {/* Golden Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            رادار ملك الفسفور
          </h2>
          <div className="flex items-center justify-center gap-2 text-teal-400/80 font-bold tracking-[0.2em]">
            <Radio className="h-4 w-4 animate-pulse" />
            <span>PHOSPHOROUS SONAR ACTIVE</span>
          </div>
        </motion.div>

        {/* ── THE RADAR SYSTEM ── */}
        <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px]">
          
          {/* Radar Circles */}
          <div className="absolute inset-0 rounded-full border border-teal-500/10 scale-[1]" />
          <div className="absolute inset-0 rounded-full border border-teal-500/15 scale-[0.75]" />
          <div className="absolute inset-0 rounded-full border border-teal-500/20 scale-[0.5]" />
          <div className="absolute inset-0 rounded-full border border-teal-500/30 scale-[0.25]" />

          {/* Glowing Center Core */}
          <div className="absolute inset-[48%] rounded-full bg-teal-400 shadow-[0_0_30px_#2dd4bf] z-30" />
          <motion.div 
             animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
             className="absolute inset-[48%] rounded-full bg-teal-400/50 z-20" 
          />

          {/* Rotating Radar Scanner Blade */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 z-10 pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 w-[50%] h-[50%] origin-bottom-left bg-gradient-to-tr from-teal-500/30 to-transparent rounded-tr-full blur-sm" 
                 style={{ transform: "translateX(0)" }} />
          </motion.div>

          {/* ── Treasure Pins ── */}
          {hasMounted && radarOffers.map((offer) => {
            const rad = (offer.angle * Math.PI) / 180;
            const x = Math.cos(rad) * (window.innerWidth < 768 ? offer.distance * 0.7 : offer.distance);
            const y = Math.sin(rad) * (window.innerWidth < 768 ? offer.distance * 0.7 : offer.distance);

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.2 }}
                onMouseEnter={() => setHoveredOffer(offer)}
                onMouseLeave={() => setHoveredOffer(null)}
                className="absolute z-40 cursor-pointer group"
                style={{ 
                  left: `calc(50% + ${x}px)`, 
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Pin Head */}
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-900 border-2 border-primary shadow-[0_0_15px_rgba(255,87,34,0.5)] flex items-center justify-center text-xl md:text-2xl overflow-hidden relative">
                    <span className="relative z-10">{offer.icon}</span>
                    <motion.div 
                      animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-primary/30 rounded-full" 
                    />
                  </div>
                  {/* Label */}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-[10px] md:text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    {offer.name}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── REVEAL CARD OVERLAY ── */}
        <AnimatePresence>
          {hoveredOffer && (
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="fixed right-4 bottom-4 md:right-12 md:bottom-24 w-[320px] md:w-[450px] z-[100] bg-slate-900/95 backdrop-blur-2xl border-2 border-amber-500/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]"
            >
              <div className="relative p-6 md:p-8 flex flex-col gap-5">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Waves className="h-20 w-20 text-teal-400 rotate-12" />
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-2xl md:text-3xl font-black text-amber-400">{hoveredOffer.name}</h3>
                  <div className="text-teal-400 font-bold flex items-center gap-1">
                    <Radio className="h-4 w-4 animate-pulse" />
                    <span className="text-[10px] md:text-xs">تـم الرصـد</span>
                  </div>
                </div>

                <p className="text-gray-300 text-sm md:text-lg leading-relaxed font-medium">
                  {hoveredOffer.details}
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <Target className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
                    <span className="text-gray-400 text-xs md:text-sm leading-snug">المحتوى: {hoveredOffer.description}</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/20 to-transparent p-4 rounded-2xl border border-amber-500/10">
                    <div className="flex flex-col">
                      <span className="text-amber-200/60 text-[10px] md:text-xs uppercase tracking-wider">سعر العرض</span>
                      <span className="text-2xl md:text-4xl font-black text-white">{hoveredOffer.price.toLocaleString("ar-EG")} <span className="text-sm">ج.م</span></span>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToCart(hoveredOffer)}
                      className="bg-primary hover:bg-primary/90 text-white font-black px-6 py-4 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(255,87,34,0.4)] relative"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      أضف للكنز 🛒
                      <motion.div 
                        animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-white/20 rounded-xl" 
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Blur Backdrop when hovering */}
        <AnimatePresence>
          {hoveredOffer && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-[6px] z-[90] pointer-events-none"
            />
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
