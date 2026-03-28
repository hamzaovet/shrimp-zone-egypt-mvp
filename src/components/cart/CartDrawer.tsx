"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/CartContext";
import { useCountry } from "@/lib/CountryContext";
import { Minus, Plus, Trash2, Send, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EGYPT_BRANCHES, getStoredBranch, setStoredBranch } from "@/lib/branches";
import CheckoutDialog from "./CheckoutDialog";

export default function CartDrawer() {
  const { cartItems, isDrawerOpen, setDrawerOpen, updateQuantity, removeFromCart, cartTotal, addToCart } = useCart();
  const { isHydrated } = useCountry();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    setSelectedBranch(getStoredBranch());
  }, []);

  if (!isHydrated) return null;

  const currency = "EGP";

  const handleProceedToCheckout = () => {
    const branch = getStoredBranch();
    if (!branch) {
      // Force branch selection
      setShowBranchModal(true);
      return;
    }
    setSelectedBranch(branch);
    setDrawerOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  const handleBranchSelect = (key: string) => {
    setStoredBranch(key);
    setSelectedBranch(key);
    setShowBranchModal(false);
    // Now proceed to checkout
    setDrawerOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  const handleCrossSell = () => {
    addToCart({ id: "addon2", title: "طحينة إضافية", price: 20 });
  };

  return (
    <>
      <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="flex flex-col p-0 border-white/10 bg-background">
          <SheetHeader className="p-4 border-b border-white/10">
            <SheetTitle>سلة الطلبات</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <span className="text-5xl mb-4">🛒</span>
                <p className="text-lg">سلتك فارغة حالياً</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">{item.title}</h4>
                    <div className="text-primary font-bold text-sm mt-1">{item.price} {currency}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white/10 rounded-full px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-300 hover:text-white px-2">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-white text-xs w-4 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-300 hover:text-white px-2">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive/80 transition-colors bg-destructive/10 p-2 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cross Selling */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-secondary/30 border-t border-white/10">
              <h4 className="text-sm font-bold text-white mb-3">إضافات سريعة 🔥</h4>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-white text-sm block">طحينة إضافية</span>
                  <span className="text-primary text-xs font-bold">20 EGP</span>
                </div>
                <Button onClick={handleCrossSell} size="sm" className="bg-primary/20 hover:bg-primary/40 text-primary font-bold rounded-full h-8 px-4">
                  <Plus className="h-4 w-4 ml-1" /> إضافة
                </Button>
              </div>
            </div>
          )}

          {/* Checkout Area */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-white/10 bg-background pb-safe">
              <div className="flex justify-between items-center mb-5">
                <span className="text-gray-300 font-medium">الإجمالي:</span>
                <span className="text-3xl font-black text-primary">{cartTotal} {currency}</span>
              </div>
              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg h-14 rounded-2xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mb-3"
              >
                <Send className="h-6 w-6" />
                إتمام الطلب
              </Button>
              <p className="text-center text-[10px] text-gray-500 font-medium">الأسعار شاملة ضريبة القيمة المضافة. يضاف 12% خدمة داخل الصالة.</p>
            </div>
          )}

          {/* ── Branch Selection Modal (overlay inside Sheet) ── */}
          {showBranchModal && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-xs space-y-4 shadow-2xl">
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="text-white text-lg font-black">اختر الفرع الأقرب</h3>
                  <p className="text-gray-400 text-xs mt-1">اختر فرعك عشان نوصلك طلبك بأسرع وقت</p>
                </div>
                <div className="space-y-2">
                  {EGYPT_BRANCHES.map((b) => (
                    <button
                      key={b.key}
                      onClick={() => handleBranchSelect(b.key)}
                      className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 transition-all active:scale-95"
                    >
                      📍 {b.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="w-full text-xs text-gray-500 hover:text-gray-400 pt-2"
                >
                  رجوع
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        targetPhone="19274"
        currency={currency}
        branchName={selectedBranch}
      />
    </>
  );
}
