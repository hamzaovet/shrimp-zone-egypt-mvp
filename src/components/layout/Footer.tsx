import { PhoneCall, Music2 } from "lucide-react";
import { LOCATIONS } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="bg-[#0a0c10] border-t border-white/5 pt-20 pb-12 w-full relative overflow-hidden">
      {/* Decorative Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full -z-10" />

      <div className="container mx-auto px-4 relative">
        
        {/* ── Central Hotline Hub ── */}
        <div className="flex flex-col items-center mb-24">
          <div className="bg-white/[0.02] border border-white/10 rounded-[3rem] px-12 py-8 flex flex-col items-center gap-2 backdrop-blur-xl shadow-2xl relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <PhoneCall className="h-8 w-8 text-primary mb-2" />
            <span className="text-gray-400 text-xs font-black uppercase tracking-[0.3em]">Official Hotline</span>
            <span className="text-5xl md:text-7xl font-black text-white tracking-widest transition-transform group-hover:scale-110 duration-700" dir="ltr">
              15911
            </span>
          </div>
        </div>

        {/* ── Egypt Branches Selection ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-24 opacity-80">
          {LOCATIONS.egypt.map((loc, idx) => (
            <div key={idx} className="flex flex-col gap-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all cursor-default">
              <span className="text-white font-bold text-lg">{loc.name}</span>
              <span className="text-gray-300 text-base leading-relaxed">{loc.address.split(':')[1] || loc.address}</span>
            </div>
          ))}
        </div>

        {/* ── Specific Signature (NIXARA & Dr. Hamza) ── */}
        <div className="flex flex-col items-center justify-center gap-3 mt-10 border-t border-gray-800 pt-6 pb-4">
          <p className="text-gray-300 text-lg">
            Powered by <a href="https://nexara-platform.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:underline cursor-pointer">Nexara FMW</a>
          </p>
          <p className="text-gray-300 text-lg">
            Managed by <a href="https://wa.me/201551190990" target="_blank" rel="noopener noreferrer" className="text-[#F97316] font-bold hover:underline cursor-pointer">Dr. Hamza</a>
          </p>
        </div>

      </div>
    </footer>
  );
}
