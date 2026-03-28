"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/CartContext";
import { User, MapPin, Phone, Loader2, CheckCircle2, Send, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EGYPT_BRANCHES, setStoredBranch } from "@/lib/branches";

import { useCustomerAuth } from "@/lib/CustomerAuthContext";

const STORAGE_KEY = "shrimp_zone_customer";

interface CustomerData {
  name: string;
  address: string;
  phone: string;
  branch: string;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPhone: string;
  currency: string;
  branchName?: string;
}

export default function CheckoutDialog({ open, onOpenChange, targetPhone, currency, branchName }: CheckoutDialogProps) {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { customer: authCustomer } = useCustomerAuth();

  const [customer, setCustomer] = useState<CustomerData>({ name: "", address: "", phone: "", branch: branchName || "" });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});
  const [isSending, setIsSending] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      try {
        // 1. Check Auth State first (Highest priority)
        if (authCustomer) {
          // Normalize phone (remove +20 if present)
          const cleanPhone = authCustomer.phone.startsWith("+20") ? "0" + authCustomer.phone.slice(3) : authCustomer.phone;
          setCustomer(prev => ({ 
            ...prev, 
            name: authCustomer.name, 
            phone: cleanPhone,
            // Keep address from storage if available, auth model doesn't store current address in session yet
          }));
        }

        // 2. Check LocalStorage for address (and fallback for name/phone if not auth)
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCustomer(prev => ({ 
            ...prev, 
            name: prev.name || parsed.name || "", 
            address: parsed.address || "", 
            phone: prev.phone || parsed.phone || "" 
          }));
        }
      } catch {
        // ignore
      }
      // Always set branch from prop
      if (branchName) setCustomer(prev => ({ ...prev, branch: branchName }));
      setErrors({});
      setOrderSuccess(false);
      setLastOrderId(null);
    }
  }, [open, branchName, authCustomer]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof CustomerData, string>> = {};
    if (!customer.name.trim()) e.name = "الاسم مطلوب";
    if (!customer.address.trim()) e.address = "العنوان مطلوب";
    if (!customer.phone.trim()) e.phone = "رقم الهاتف مطلوب";
    if (!customer.branch) e.branch = "يرجى اختيار الفرع";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSending(true);

    // Save customer data to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: customer.name, address: customer.address, phone: customer.phone }));
    // Also persist branch choice
    setStoredBranch(customer.branch);

    const fullPhone = `+20${customer.phone.replace(/^0+/, "")}`;

    // Save order to DB
    try {
      const orderPayload = {
        customerName: customer.name,
        customerPhone: fullPhone,
        address: customer.address,
        country: "مصر",
        branch: customer.branch,
        items: cartItems.map(item => ({
          _id: item.id,
          name: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: cartTotal,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const result = await res.json();
        setLastOrderId(result._id);
      }
    } catch (err) {
      console.error("Order save error:", err);
    }

    clearCart();
    setIsSending(false);
    setOrderSuccess(true);
  };

  const handleClose = () => {
    setOrderSuccess(false);
    onOpenChange(false);
    // If we have an order ID, navigate to its status
    if (lastOrderId) {
      window.location.href = `/orders/${lastOrderId}/status`;
    }
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm";

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="left" className="flex flex-col p-0 border-white/10 bg-background w-full sm:max-w-md">
        <SheetHeader className="p-5 border-b border-white/10">
          <SheetTitle className="text-xl">
            {orderSuccess ? "تم الطلب بنجاح! 🎉" : "تأكيد الطلب ⚓"}
          </SheetTitle>
        </SheetHeader>

        {orderSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl" />
              <div className="relative h-24 w-24 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white">تم استلام طلبك بنجاح! 🚀</h3>
            <p className="text-gray-400 text-base leading-relaxed max-w-xs">
              سيتم التواصل معك لتأكيد الطلب.
            </p>
            <Button
              onClick={handleClose}
              className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold text-base h-12 px-8 rounded-2xl transition-transform hover:scale-[1.02]"
            >
              تمام 👍
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Order Summary */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                <h4 className="text-sm font-bold text-white mb-2">ملخص الطلب</h4>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.quantity}x {item.title}</span>
                    <span className="text-primary font-bold">{item.price * item.quantity} ج.م</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-white/10">
                  <span className="text-white font-bold">الإجمالي</span>
                  <span className="text-primary font-black text-lg">{cartTotal} ج.م</span>
                </div>
              </div>

              {/* Customer Form */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">بيانات التوصيل</h4>

                {/* Branch Selection — Required */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                    <Store className="h-3.5 w-3.5" /> الفرع *
                  </label>
                  <select
                    value={customer.branch}
                    onChange={(e) => setCustomer({ ...customer, branch: e.target.value })}
                    className={`${inputClass} cursor-pointer ${errors.branch ? "ring-2 ring-red-500/50 border-red-500/30" : ""}`}
                  >
                    <option value="" className="bg-slate-900 text-gray-400">— اختر الفرع —</option>
                    {EGYPT_BRANCHES.map((b) => (
                      <option key={b.key} value={b.key} className="bg-slate-900 text-white">{b.label}</option>
                    ))}
                  </select>
                  {errors.branch && <p className="text-red-400 text-xs mt-1">{errors.branch}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                    <User className="h-3.5 w-3.5" /> الاسم بالكامل
                  </label>
                  <input
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    readOnly={!!authCustomer}
                    className={`${inputClass} ${authCustomer ? "opacity-70 bg-white/10" : ""} ${errors.name ? "ring-2 ring-red-500/50 border-red-500/30" : ""}`}
                    placeholder="مثال: محمد أحمد"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                    <Phone className="h-3.5 w-3.5" /> رقم الهاتف
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center justify-center bg-primary/10 text-primary font-bold text-sm rounded-xl px-4 border border-primary/20 whitespace-nowrap" dir="ltr">
                      +20
                    </span>
                    <input
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/[^0-9]/g, "") })}
                      readOnly={!!authCustomer}
                      className={`${inputClass} flex-1 ${authCustomer ? "opacity-70 bg-white/10" : ""} ${errors.phone ? "ring-2 ring-red-500/50 border-red-500/30" : ""}`}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                      type="tel"
                      inputMode="numeric"
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                    <MapPin className="h-3.5 w-3.5" /> العنوان بالتفصيل
                  </label>
                  <textarea
                    rows={3}
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className={`${inputClass} resize-none ${errors.address ? "ring-2 ring-red-500/50 border-red-500/30" : ""}`}
                    placeholder="المدينة - الحي - اسم الشارع - رقم المبنى..."
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="p-5 border-t border-white/10 bg-background pb-safe">
              <Button
                onClick={handleSubmit}
                disabled={isSending}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg h-14 rounded-2xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mb-3 disabled:opacity-50 disabled:scale-100"
              >
                {isSending ? (
                  <><Loader2 className="h-6 w-6 animate-spin" /> جاري إرسال الطلب...</>
                ) : (
                  <><Send className="h-6 w-6" /> تأكيد الطلب</>
                )}
              </Button>
              <p className="text-center text-[10px] text-gray-500 font-medium">
                الأسعار شاملة ضريبة القيمة المضافة. يضاف 12% خدمة داخل الصالة.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
