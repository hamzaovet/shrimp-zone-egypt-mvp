"use client";

import { useCart } from "@/lib/CartContext";
import { useCountry } from "@/lib/CountryContext";
import { Minus, Plus, Trash2, ShoppingBag, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CheckoutDialog from "./CheckoutDialog";
import { getStoredBranch } from "@/lib/branches";

export default function CartView() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { isHydrated } = useCountry();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!isHydrated) return null;

  const currency = "EGP";

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">سلتك فارغة</h2>
        <p className="text-gray-400 mb-8 max-w-xs">شكلها كدة لسه مختارتش أكلك المفضل.. تصفح القائمة واختار اللي يعجبك!</p>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-6 px-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" />
          سلة الطلبات
        </h2>
        <button onClick={clearCart} className="text-destructive text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
          <Trash2 className="h-4 w-4" /> مسح الكل
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {cartItems.map((item) => (
          <div key={item.id} className="bg-[#0A1128]/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex-1">
              <h4 className="text-white font-bold text-base mb-1">{item.title}</h4>
              <div className="text-primary font-black">{item.price} {currency}</div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center bg-white/5 rounded-xl border border-white/5 p-1">
                <button 
                  onClick={() => updateQuantity(item.id, -1)} 
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, 1)} 
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-destructive/60 hover:text-destructive text-xs font-medium">
                حذف الصنف
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 mb-8 shadow-lg shadow-primary/5">
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-300 font-bold">إجمالي الطلب:</span>
          <div className="text-right">
            <span className="text-3xl font-black text-primary block">{cartTotal} {currency}</span>
            <span className="text-[10px] text-primary/60 font-medium">غير شامل الخدمة</span>
          </div>
        </div>
        
        <Button 
          onClick={() => setCheckoutOpen(true)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg h-16 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Send className="h-6 w-6" /> إتمام الطلب الآن
        </Button>
      </div>

      <div className="text-center">
        <p className="text-[11px] text-gray-500 font-medium bg-black/20 inline-block px-4 py-2 rounded-full border border-white/5">
          🔒 دفع آمن وسريع عبر WhatsApp أو نقداً عند الاستلام
        </p>
      </div>

      <CheckoutDialog 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen} 
        targetPhone="19274"
        currency={currency}
        branchName={getStoredBranch()}
      />
    </div>
  );
}
