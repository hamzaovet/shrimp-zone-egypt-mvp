"use client";

import { Home, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/lib/CartContext';
import { useCountry } from '@/lib/CountryContext';
import { useNavigation } from '@/lib/NavigationContext';

export default function BottomNav() {
  const { cartCount } = useCart();
  const { isHydrated } = useCountry();
  const { activeTab, setActiveTab } = useNavigation();

  if (!isHydrated) return null;

  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: Home, hasBadge: false },
    { id: 'cart', label: 'السلة', icon: ShoppingCart, hasBadge: true },
    { id: 'profile', label: 'حسابي', icon: User, hasBadge: false },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-[#0A1128]/95 backdrop-blur-lg border-t border-white/10 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 relative min-w-[64px] ${
                isActive ? 'text-primary scale-110' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,87,34,0.5)]' : ''}`} />
                {tab.hasBadge && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in duration-300">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  )
}
