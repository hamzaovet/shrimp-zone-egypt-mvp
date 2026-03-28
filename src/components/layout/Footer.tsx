import { PhoneCall, MapPin } from "lucide-react";
import { LOCATIONS } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-white/10 pt-16 pb-24 md:pb-16 w-full">
      <div className="container mx-auto px-4">

        {/* ── Hotline Hero Box ── */}
        <div className="relative mb-16">
          {/* glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl -z-10" />
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/10 via-background to-primary/5 px-6 py-10 shadow-[0_0_60px_rgba(255,87,34,0.15)]">
            <PhoneCall className="h-10 w-10 text-primary animate-pulse" />
            <span className="text-4xl md:text-5xl font-black text-white tracking-wider" dir="ltr">
              19274
            </span>
            <div className="text-center space-y-2">
              <p className="text-gray-300 text-base md:text-lg font-medium">
                اتصل الآن &nbsp;|&nbsp; Call Now
              </p>
              <p className="text-primary font-bold text-sm md:text-base" dir="ltr">
                01203111170 - 01286888176
              </p>
              <p className="text-gray-400 text-xs md:text-sm">
                مواعيد العمل: من 1:00 ظهراً حتى 1:00 صباحاً
              </p>
            </div>
          </div>
        </div>

        {/* ── Egypt Branches Grid ── */}
        <div className="mb-14">
          <h4 className="text-xl font-bold text-white text-center mb-8">
            فروعنا في مصر 🇪🇬
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LOCATIONS.egypt.map((loc, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-3 rounded-xl border border-white/10 bg-secondary/30 p-5 transition-colors duration-300 hover:border-primary/40"
              >
                <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="text-right">
                  <span className="block text-white font-bold text-sm">{loc.name}</span>
                  <span className="block text-gray-400 text-xs mt-1">{loc.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Credits ── */}
        <div className="pt-8 border-t border-white/10 text-center space-y-3">
          <p className="text-gray-400 text-sm font-medium">
            Powered by{" "}
            <a href="https://wa.me/201551190990" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-orange-400 hover:underline transition-all cursor-pointer">
              Nexara FMW
            </a>
          </p>
          <p className="text-gray-400 text-sm font-medium">
            Managed by{" "}
            <a href="https://wa.me/201551190990" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:text-orange-400 hover:underline transition-all cursor-pointer">
              Dr. Hamza
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}
