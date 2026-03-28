"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, LogOut, Wallet, Users } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== 'admin') {
      router.push("/login");
    }
  }, [status, session, router]);

  if (status === "loading" || status === "unauthenticated" || (session?.user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { title: "نظرة عامة", icon: LayoutDashboard, href: "/admin" },
    { title: "الطلبات", icon: ShoppingBag, href: "/admin/orders" },
    { title: "المنيو", icon: UtensilsCrossed, href: "/admin/menu" },
    { title: "العملاء", icon: Users, href: "/admin/customers" },
    { title: "الماليات", icon: Wallet, href: "/admin/accounting" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-secondary/30 border-l border-white/10 md:min-h-screen flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-center">
          <div className="relative">
            <img src="/assets/bahij-logo.png" alt="بهيج ملك الفسفور العجيب" style={{ width: 'auto', height: '40px' }} className="object-contain" />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link key={idx} href={item.href} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 w-full px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
