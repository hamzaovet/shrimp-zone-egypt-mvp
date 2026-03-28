"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useCart } from "@/lib/CartContext";
import { useCountry } from "@/lib/CountryContext";
import { ShoppingBag, Bike, MapPin, ChevronDown } from "lucide-react";
import { EGYPT_BRANCHES, getStoredBranch, setStoredBranch } from "@/lib/branches";

export default function Header() {
  const { cartCount, setDrawerOpen } = useCart();
  const { isHydrated } = useCountry();
  const [branch, setBranch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredBranch();
    if (stored) setBranch(stored);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectBranch = (key: string) => {
    setBranch(key);
    setStoredBranch(key);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* LOGO */}
        <div className="flex shrink-0 items-center">
          <div className="relative">
            <img src="/assets/logo.png" alt="شرمب زون - Shrimp Zone" style={{ width: 'auto', height: '40px' }} className="object-contain" />
          </div>
        </div>

        {/* LEFT CONTROLS */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Hotline pill (Visible on Mobile) */}
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
            <span className="text-white font-bold text-[10px] sm:text-xs">الخط الساخن:</span>
            <span className="text-primary font-black text-xs sm:text-sm">15911</span>
          </div>

          {/* Delivery Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full border border-slate-700 bg-slate-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <Bike className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-200 font-medium whitespace-nowrap">
              مفتوح الآن
            </span>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative p-2 text-white hover:text-primary transition-colors bg-white/5 rounded-full border border-white/10"
          >
            <ShoppingBag className="h-5 w-5" />
            {isHydrated && cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
