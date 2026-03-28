import { PhoneCall, MapPin, Facebook, Instagram, Music2 } from "lucide-react";
import { LOCATIONS } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-white/10 pt-16 pb-24 md:pb-16 w-full">
      <div className="container mx-auto px-4">

        {/* ── Hotline Hero Box ── */}
        <div className="relative mb-12">
          {/* glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl -z-10" />
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/10 via-background to-primary/5 px-6 py-10 shadow-[0_0_60px_rgba(255,87,34,0.15)]">
            <PhoneCall className="h-10 w-10 text-primary animate-pulse" />
            <span className="text-4xl md:text-6xl font-black text-white tracking-wider" dir="ltr">
              15911
            </span>
            <div className="text-center space-y-2">
              <p className="text-gray-300 text-base md:text-lg font-medium">
                اتصل الآن &nbsp;|&nbsp; Call Now
              </p>
              <p className="text-primary font-bold text-sm md:text-base" dir="ltr">
                01203111170 - 01286888176
              </p>
            </div>
          </div>
        </div>

        {/* ── Social Hub ── */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          <a href="https://facebook.com/ShrimpZone" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:text-primary transition-all group">
            <Facebook className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm uppercase">Facebook</span>
          </a>
          <a href="https://instagram.com/Shrimpzone" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:text-primary transition-all group">
            <Instagram className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm uppercase">Instagram</span>
          </a>
          <a href="https://tiktok.com/@Shrimpzoneo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:text-primary transition-all group">
            <Music2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm uppercase">TikTok</span>
          </a>
        </div>

        {/* ── Egypt Branches Grid ── */}
        <div className="mb-14">
          <h4 className="text-xl font-bold text-white text-center mb-8">
            فروعنا الجديدة 🇪🇬
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LOCATIONS.egypt.map((loc, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-secondary/30 p-6 transition-all duration-300 hover:border-primary/40 hover:bg-secondary/40"
              >
                <div className="bg-primary/10 p-2 rounded-xl">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                </div>
                <div className="text-right">
                  <span className="block text-white font-black text-sm mb-1">{loc.name}</span>
                  <span className="block text-gray-400 text-xs leading-relaxed">{loc.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Credits ── */}
        <div className="pt-8 border-t border-white/10 text-center space-y-3">
          <p className="text-gray-400 text-sm font-medium">
            Powered by{" "}
            <a href="https://wa.me/201551190990" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-primary transition-all cursor-pointer">
              Nexara FMW
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}
