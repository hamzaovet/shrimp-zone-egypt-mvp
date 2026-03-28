"use client";

import { useState } from "react";
import { Search, Fish, Ship, Waves, MapPin, PhoneCall, Facebook, Instagram, Music2 } from "lucide-react";
import { motion } from "framer-motion";
import { LOCATIONS } from "@/lib/data";

const categories = [
  { id: "trays", name: "الصواني", icon: Waves, color: "text-orange-400" },
  { id: "meals", name: "الوجبات", icon: Fish, color: "text-blue-400" },
  { id: "casseroles", name: "الطواجن", icon: Waves, color: "text-red-500" },
  { id: "sandwiches", name: "السندوتشات", icon: Ship, color: "text-yellow-400" },
];

export default function SonarHub() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute top-20 left-10 opacity-5 animate-pulse">
        <Waves className="h-64 w-64 text-primary" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-primary font-black text-sm tracking-widest uppercase">Sonar System Active</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              سونار البحث عن الأصناف والمينيو
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              اكتشف محيط النكهات الخاص بنا بكل سهولة
            </p>
          </div>

          {/* Search Hub */}
          <div className="bg-secondary/40 backdrop-blur-2xl border-2 border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_80px_rgba(3,105,161,0.1)]">
            
            {/* Search Bar */}
            <div className="relative max-w-3xl mx-auto mb-16 group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-background border-2 border-white/10 rounded-2xl p-2 focus-within:border-primary/50 transition-all">
                <Search className="h-6 w-6 text-gray-500 mr-4" />
                <input
                  type="text"
                  placeholder="...ابحث عن الأصناف (جمبري، مكرونة، صواني)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-white text-lg font-bold placeholder:text-gray-600 px-2 py-3"
                />
                <button className="bg-primary text-white font-black px-8 py-3 rounded-xl hover:bg-primary/90 transition-all">
                  بـحـث
                </button>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="flex flex-col items-center justify-center p-8 rounded-3xl bg-background border border-white/5 hover:border-primary/30 transition-all cursor-pointer group shadow-xl"
                  >
                    <div className={`p-5 rounded-2xl bg-secondary/50 mb-6 group-hover:bg-primary/10 transition-colors ${cat.color}`}>
                      <Icon className="h-10 w-10 text-current" />
                    </div>
                    <span className="text-white font-black text-center">{cat.name}</span>
                    <div className="mt-4 w-12 h-1 bg-primary/20 rounded-full group-hover:w-20 group-hover:bg-primary/50 transition-all" />
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Access Info Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5">
              {/* Hotline */}
              <div className="flex items-center gap-4">
                <div className="bg-primary p-3 rounded-2xl shadow-[0_0_20px_rgba(3,105,161,0.3)]">
                  <PhoneCall className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <span className="block text-gray-400 text-xs font-bold uppercase tracking-wider">Hotline</span>
                  <span className="text-2xl md:text-3xl font-black text-white">15911</span>
                </div>
              </div>

              {/* Socials */}
              <div className="flex items-center gap-4 bg-background/50 p-4 rounded-3xl border border-white/5">
                <a href="#" className="p-3 text-gray-400 hover:text-white transition-colors"><Facebook className="h-6 w-6" /></a>
                <a href="#" className="p-3 text-gray-400 hover:text-white transition-colors"><Instagram className="h-6 w-6" /></a>
                <a href="#" className="p-3 text-gray-400 hover:text-white transition-colors"><Music2 className="h-6 w-6" /></a>
              </div>

              {/* Latest Branch */}
              <div className="flex items-center gap-4 text-right">
                <div className="text-right">
                  <span className="block text-primary font-black text-xs uppercase mb-1">الفرع الجديد 🌟</span>
                  <span className="block text-white font-bold text-sm">{LOCATIONS.egypt[0].name}</span>
                </div>
                <div className="bg-secondary p-3 rounded-2xl border border-white/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
