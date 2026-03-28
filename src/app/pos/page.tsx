"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Minus, Plus, Trash2, Printer, CreditCard, Banknote,
  ShoppingBag, CheckCircle2, RotateCcw, Utensils, Coffee, Truck,
  Save, TableProperties, X, Search, MapPin, Bell, Percent, Tag, ClipboardList, Clock

} from "lucide-react";

// Default POS branch (overridden by cashier session)
const DEFAULT_POS_BRANCH = "محطة الرمل";

// ── Types ──
interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: any;
  image: string;
  country: string;
  isAvailable: boolean;
}

interface TicketItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface SavedTable {
  tableNumber: string;
  items: TicketItem[];
  savedAt: number;
}

interface OnlineOrder {
  _id: string;
  orderNumber?: number;
  customerName: string;
  customerPhone: string;
  address: string;
  branch: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
}

// ── POS Page ──
export default function POSPage() {
  const { data: session } = useSession();
  const userBranch = (session?.user as any)?.assignedBranch;
  const POS_BRANCH = userBranch || DEFAULT_POS_BRANCH;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in");
  const [orderNumber, setOrderNumber] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [dateStr, setDateStr] = useState("");

  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showActiveOrdersModal, setShowActiveOrdersModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);
  const [isCanceledLoading, setIsCanceledLoading] = useState(false);
  const [finalOrderNumber, setFinalOrderNumber] = useState<number | null>(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState<string | null>(null);


  // CRM
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmFound, setCrmFound] = useState(false);
  const phoneDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending online orders for this branch
  const [pendingOrders, setPendingOrders] = useState(0);
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [alertedOrders, setAlertedOrders] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dbActiveOrders, setDbActiveOrders] = useState<any[]>([]);
  const prevPendingRef = useRef(0);
  const isFirstFetch = useRef(true);


  // Discount
  const [discountType, setDiscountType] = useState<"%" | "fixed">("%");
  const [discountValue, setDiscountValue] = useState("");

  // Audio context for notification
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── TTS Order Ready Announcement ──
  const announceOrderReady = (orderNumber: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel any ongoing speech to avoid overlapping
      window.speechSynthesis.cancel();
      
      // Clean-up the order number if it has '#' and leading zeroes
      const cleanNum = orderNumber.replace("#", "");
      const text = `Order number ${cleanNum} is ready in the kitchen`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Shift reconciliation (Z-Report)
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [zReport, setZReport] = useState<{
    totalOrders: number;
    // Payment Method
    cashTotal: number;
    visaTotal: number;
    cashCount: number;
    visaCount: number;
    // Order Type Revenue
    dineInRevenue: number;
    takeawayRevenue: number;
    deliveryRevenue: number;
    dineInCount: number;
    takeawayCount: number;
    deliveryCount: number;
    // Tax & Discounts
    totalTax: number;
    totalDiscounts: number;
    // Gross
    grossRevenue: number;
    // Items Sold
    itemsSold: { name: string; qty: number; revenue: number }[];
    // Bottom Line
    initialFloat: number;
    finalBalance: number;
  } | null>(null);

  // Fetch menu
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/menu");
        if (res.ok) {
          const data: MenuItem[] = await res.json();
          const egypt = data.filter(i => i.country === "مصر" && i.isAvailable);
          setMenuItems(egypt);
        }
        
        const catRes = await fetch("/api/menu/categories");
        if (catRes.ok) {
          const cats = await catRes.json();
          setCategoriesData(cats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    setDateStr(new Date().toLocaleDateString("ar-EG", { weekday: "long", month: "short", day: "numeric" }));

    // ── Toast Helper ──
    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    // Init AudioContext on first user interaction (bypass autoplay policy)
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
        // Play a silent buffer to unlock
        const buf = audioCtxRef.current.createBuffer(1, 1, 22050);
        const src = audioCtxRef.current.createBufferSource();
        src.buffer = buf;
        src.connect(audioCtxRef.current.destination);
        src.start();
      }
    };
    document.addEventListener("click", initAudio, { once: true });
    document.addEventListener("touchstart", initAudio, { once: true });

    // Live polling every 10s (refreshes menu + checks pending orders)
    const interval = setInterval(async () => {
      try {
        const [menuRes, ordersRes] = await Promise.all([
          fetch("/api/menu"),
          fetch("/api/orders"),
        ]);
        if (menuRes.ok) {
          const data: MenuItem[] = await menuRes.json();
          setMenuItems(data.filter(i => i.country === "مصر" && i.isAvailable));
        }
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          
          // 1. Online Pending Orders (Source: CMS/Web)
          const branchPending = orders.filter((o: any) =>
            o.branch === POS_BRANCH && (o.status === "Pending" || o.status === "pending") && o.customerPhone !== "POS"
          );
          
          // 2. ── ERP Active Orders (Source: POS/All) ──
          const activeStatuses = ['pending', 'جديد', 'جاري التحضير', 'جاهز', 'خرج للتوصيل'];
          const active = orders.filter((o: any) =>
             o.branch === POS_BRANCH && activeStatuses.includes(o.status)
          );
          setDbActiveOrders(active);

          const pending = branchPending.length;
          if (pending > prevPendingRef.current && prevPendingRef.current >= 0) {
            // New order arrived — Royal Whistle!
             try {
               const audio = new Audio('/assets/doordash.mp3');
               audio.volume = 0.6;
               audio.play().catch(err => {
                 console.warn("Audio playback blocked: interaction needed.", err);
               });
             } catch (err) {
               console.error("Audio error:", err);
             }
          }
          prevPendingRef.current = pending;
          setPendingOrders(pending);
          setOnlineOrders(branchPending);

          // ── Ready Order Alerts (Phase 22) ──
          const readyOrders = orders.filter((o: any) => o.status === "جاهز");
          
          if (isFirstFetch.current) {
            setAlertedOrders(readyOrders.map((o: any) => o._id));
            isFirstFetch.current = false;
          } else {
            setAlertedOrders(prevAlerted => {
            const newReady = readyOrders.filter((o: any) => !prevAlerted.includes(o._id));
            if (newReady.length > 0) {
              newReady.forEach((o: any) => {
                const displayId = o.orderNumber ? `#${String(o.orderNumber).padStart(4, "0")}` : `#${o._id.slice(-4).toUpperCase()}`;
                const message = `🔔 الطلب رقم [${displayId}] جاهز للاستلام!`;
                
                // Voice Announcement
                announceOrderReady(displayId);
                
                const toastId = o._id;
                setToasts(prev => {
                  if (prev.find(t => t.id === toastId)) return prev;
                  return [...prev, { id: toastId, message, type: "success" }];
                });
                
                setTimeout(() => {
                  setToasts(prev => prev.filter(t => t.id !== toastId));
                }, 6000);
              });
              return [...prevAlerted, ...newReady.map((o: any) => o._id)];
            }
            return prevAlerted;
          });
        }
      }
    } catch {}
  }, 10000);


    // Initial pending fetch
    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const orders = await res.json();
          const branchPending = orders.filter((o: any) =>
            o.branch === POS_BRANCH && (o.status === "Pending" || o.status === "pending") && o.customerPhone !== "POS"
          );
          
          const activeStatuses = ['pending', 'جديد', 'جاري التحضير', 'جاهز', 'خرج للتوصيل'];
          const active = orders.filter((o: any) =>
             o.branch === POS_BRANCH && activeStatuses.includes(o.status)
          );
          setDbActiveOrders(active);

          prevPendingRef.current = branchPending.length;
          setPendingOrders(branchPending.length);
          setOnlineOrders(branchPending);
          
          // Silently absorb existing ready orders on load to prevent toast spam
          const readyIds = orders.filter((o: any) => o.status === "جاهز").map((o: any) => o._id);
          setAlertedOrders(readyIds);
        }
      } catch {}
    })();


    return () => {
      clearInterval(interval);
      document.removeEventListener("click", initAudio);
      document.removeEventListener("touchstart", initAudio);
    };
  }, []);

  const categories = useMemo(
    () => ["الكل", ...categoriesData.map(c => c.name)],
    [categoriesData]
  );

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory("الكل");
    }
  }, [categories, activeCategory]);

  const currentItems = useMemo(
    () => activeCategory === "الكل" 
      ? menuItems 
      : menuItems.filter(i => (typeof i.category === 'object' ? i.category?.name : i.category) === activeCategory),
    [menuItems, activeCategory]
  );

  // ── Ticket Logic ──
  const addItem = (item: MenuItem) => {
    setTicket(prev => {
      const exists = prev.find(t => t.id === item._id);
      if (exists) return prev.map(t => t.id === item._id ? { ...t, qty: t.qty + 1 } : t);
      return [...prev, { id: item._id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setTicket(prev =>
      prev
        .map(t => t.id === id ? { ...t, qty: t.qty + delta } : t)
        .filter(t => t.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setTicket(prev => prev.filter(t => t.id !== id));
  };

  const subtotal = ticket.reduce((s, t) => s + t.price * t.qty, 0);
  const discountNum = parseFloat(discountValue) || 0;
  const discountAmount = discountType === "%" ? Math.round(subtotal * (discountNum / 100)) : Math.round(discountNum);
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(netSubtotal * 0.14);
  const total = netSubtotal + tax;
  const itemCount = ticket.reduce((s, t) => s + t.qty, 0);

  // ── Table Persistence ──
  // ── Load Order to Cart (Settlement / Updates) ──
  const loadOrderToCart = (order: any) => {
    if (!order) return;
    
    // 1. Set items (map back to TicketItem with temporary IDs)
    const mappedItems = order.items.map((i: any) => ({
      id: i._id || Math.random().toString(),
      name: i.name,
      price: i.price,
      qty: i.quantity
    }));
    setTicket(mappedItems);
    
    // 2. Set metadata
    const type = order.orderType === "صالة" ? "dine-in" : order.orderType === "تيك أواي" ? "takeaway" : "delivery";
    setOrderType(type);
    
    // Extract table number from the unified labeling format
    const tableMatch = order.address?.match(/ترابيزة (\d+)/) || order.customerName?.match(/ترابيزة (\d+)/);
    setTableNumber(tableMatch ? tableMatch[1] : "");

    // Customer details
    const nameParts = order.customerName?.split('|');
    const actualName = nameParts && nameParts.length > 1 ? nameParts[1].trim() : "";
    setCustomerName(actualName);
    setCustomerPhone(order.customerPhone === "POS" ? "" : order.customerPhone);
    setCustomerAddress(type === "delivery" ? order.address : "");
    
    // Discount
    if (order.discount) {
      setDiscountType(order.discount.type || "%");
      setDiscountValue(String(order.discount.value || ""));
    }
    
    setActiveOrderId(order._id);
    setActiveOrderStatus(order.status);
    setShowActiveOrdersModal(false);
    
    const displayId = order.orderNumber ? `#${String(order.orderNumber).padStart(4, "0")}` : `#${order._id.slice(-6).toUpperCase()}`;
    const toastId = Date.now().toString();
    setToasts(prev => [...prev, { id: toastId, message: `📂 تم تحميل الطلب رقم [${displayId}] للتحديث.`, type: "info" }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
  };

  const handleSaveUnpaidOrder = async () => {
    if (ticket.length === 0) return;
    if (orderType === "dine-in" && !tableNumber.trim()) return;
    if (orderType === "delivery" && !customerAddress.trim()) {
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { id: toastId, message: "⚠️ يرجى إدخال عنوان التوصيل", type: "error" }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
      return;
    }

    setSubmitting(true);

    const orderLabel = `POS #${String(orderNumber).padStart(4, "0")}`;
    const typeLabel = orderType === "dine-in" ? "صالة" : orderType === "takeaway" ? "تيك أواي" : "دليفري";
    
    const resolvedName = customerName.trim()
      ? `${orderLabel} — ${typeLabel} — آجل | ${customerName.trim()}`
      : `${orderLabel} — ${typeLabel} — آجل`;

    const resolvedAddress = orderType === "dine-in"
      ? `طلبات الصالة — ترابيزة ${tableNumber || "-"}`
      : orderType === "takeaway"
        ? "تيك أواي"
        : customerAddress.trim() || "دليفري";

    const orderPayload: any = {
      orderNumber: orderNumber,
      items: ticket.map(t => ({ _id: t.id, name: t.name, quantity: t.qty, price: t.price })),
      totalAmount: total,
      taxAmount: tax,
      discount: { 
        type: discountType, 
        value: Number(discountValue) || 0, 
        amount: discountAmount 
      },
      orderType: typeLabel,
      paymentMethod: 'آجل',
      status: 'جديد',
      branch: POS_BRANCH || "محطة الرمل",
      source: "POS",
      customerName: resolvedName,
      customerPhone: customerPhone.trim() || "POS",
      address: resolvedAddress,
      isPaid: false, // آجل is never paid initially
      timestamp: new Date(),
    };

    try {
      const url = activeOrderId ? `/api/orders/${activeOrderId}` : '/api/orders';
      const method = activeOrderId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const displayId = res.ok ? (await res.clone().json()).orderNumber : null;
        const message = activeOrderId 
           ? `✔️ تم تحديث الطلب بنجاح!` 
           : `✔️ تم إرسال الطلب #${String(displayId || orderNumber).padStart(4, "0")} للمطبخ بنجاح!`;
        
        const toastId = Date.now().toString();
        setToasts(prev => [...prev, { id: toastId, message, type: "success" }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 5000);

        setTicket([]);
        setActiveOrderId(null);
        if (displayId) {
          setFinalOrderNumber(displayId);
          setOrderNumber(displayId + 1);
        } else {
          setOrderNumber(n => n + 1);
        }
        resetForm();
      } else {
        console.error("Failed to save unpaid order");
      }
    } catch (error) {
      console.error("Error saving unpaid order:", error);
    } finally {
      setSubmitting(false);
    }
  };



  // ── CRM Phone Lookup ──
  const lookupPhone = useCallback(async (phone: string) => {
    if (phone.length < 8) {
      setCrmFound(false);
      return;
    }
    setCrmLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const orders = await res.json();
        // Find most recent order with matching phone
        const match = orders.find((o: any) =>
          o.customerPhone && o.customerPhone.includes(phone) && o.customerPhone !== "POS"
        );
        if (match) {
          // Extract name — strip POS prefix labels
          const rawName = match.customerName || "";
          const namePart = rawName.includes("|") ? rawName.split("|").pop()?.trim() : "";
          if (namePart) setCustomerName(namePart);
          if (match.address && match.address !== "تيك أواي" && !match.address.startsWith("طلبات الصالة")) {
            setCustomerAddress(match.address);
          }
          setCrmFound(true);
        } else {
          setCrmFound(false);
        }
      }
    } catch {
      // silent
    } finally {
      setCrmLoading(false);
    }
  }, []);

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, "");
    setCustomerPhone(clean);
    setCrmFound(false);

    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    if (clean.length >= 8) {
      phoneDebounce.current = setTimeout(() => lookupPhone(clean), 600);
    }
  };

  // Validation
  const alreadySentToKitchen = activeOrderStatus === "جديد" || activeOrderStatus === "جاري التحضير" || activeOrderStatus === "جاهز";
  const isPayDisabled = ticket.length === 0 || submitting || (orderType === "delivery" && !customerAddress.trim());
  const isUnpaidOrderDisabled = ticket.length === 0 || submitting || (orderType === "dine-in" && !tableNumber.trim()) || alreadySentToKitchen;

  // ── Reset form fields ──
  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setTableNumber("");
    setCrmFound(false);
    setActiveTableId(null);
    setActiveOrderId(null);
    setActiveOrderStatus(null);
    setDiscountValue("");
    setDiscountType("%");
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const resp = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!resp.ok) throw new Error("Update failed");
      
      const updated = await resp.json();
      setDbActiveOrders(prev => prev.map(o => o._id === orderId ? updated : o));
      if (newStatus === "تم التسليم") {
        setDbActiveOrders(prev => prev.filter(o => o._id !== orderId));
      }
      
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { id: toastId, message: `✅ تم تحديث حالة الطلب إلى [${newStatus}]`, type: "success" }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3000);
    } catch (e) {
      console.error(e);
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { id: toastId, message: "❌ فشل تحديث حالة الطلب", type: "error" }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
    }
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setIsCanceledLoading(true);
    
    try {
      const resp = await fetch(`/api/orders/${orderToCancel._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ملغي" }),
      });
      
      if (!resp.ok) throw new Error("Cancellation failed");
      
      setDbActiveOrders(prev => prev.filter(o => o._id !== orderToCancel._id));
      setShowCancelModal(false);
      setOrderToCancel(null);
      
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { 
        id: toastId, 
        message: "🚨 تم إلغاء الطلب واسترجاع المكونات للمخزن!", 
        type: "error" 
      }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 5000);
    } catch (e) {
      console.error(e);
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { id: toastId, message: "❌ فشل إلغاء الطلب", type: "error" }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
    } finally {
      setIsCanceledLoading(false);
    }
  };

  // ── Checkout ──

  const handlePay = async (method: "Cash" | "Visa") => {
    if (ticket.length === 0) return;
    setSubmitting(true);

    const orderLabel = `POS #${String(orderNumber).padStart(4, "0")}`;
    const typeLabel = orderType === "dine-in" ? "صالة" : orderType === "takeaway" ? "تيك أواي" : "دليفري";
    const payLabel = method === "Cash" ? "كاش" : "فيزا";

    const resolvedName = customerName.trim()
      ? `${orderLabel} — ${typeLabel} — ${payLabel} | ${customerName.trim()}`
      : `${orderLabel} — ${typeLabel} — ${payLabel}`;

    const resolvedAddress = orderType === "dine-in"
      ? `طلبات الصالة — ترابيزة ${tableNumber || "-"}`
      : orderType === "takeaway"
        ? "تيك أواي"
        : customerAddress.trim() || "دليفري";

    try {
      const orderPayload = {
        orderNumber: orderNumber,
        items: ticket.map(t => ({ _id: t.id, name: t.name, quantity: t.qty, price: t.price })),
        totalAmount: total,
        taxAmount: tax,
        discount: { 
           type: discountType,
           value: Number(discountValue) || 0,
           amount: discountAmount 
        },
        orderType: typeLabel,
        paymentMethod: method,
        branch: POS_BRANCH || "محطة الرمل",
        source: "POS",
        customerName: resolvedName,
        customerPhone: customerPhone.trim() || "POS",
        address: resolvedAddress,
        isPaid: orderType !== "delivery", // Logistics Focus: Delivery remains unpaid until confirm
        status: "جديد", 
        timestamp: new Date(),
      };

      const url = activeOrderId ? `/api/orders/${activeOrderId}` : '/api/orders';
      const fetchMethod = activeOrderId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: fetchMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const savedOrder = res.ok ? await res.json() : null;
      const orderNumFromDb = savedOrder?.orderNumber || orderNumber;

      setShowSuccess(true);
      setFinalOrderNumber(orderNumFromDb);
      setTimeout(() => {
        setShowSuccess(false);
        setTicket([]);
        setOrderNumber(orderNumFromDb + 1);
        resetForm();
      }, 2000);
    } catch (e) {
      console.error(e);
      const toastId = Date.now().toString();
      setToasts(prev => [...prev, { id: toastId, message: "❌ فشل في إتمام العملية", type: "error" }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
    } finally {
      setSubmitting(false);
    }
  };


  // Input style constant
  const inputCls = "w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-white text-sm placeholder:text-gray-500 outline-none focus:border-orange-500 transition-all";

  // ── Accept Online Order ──
  const handleAcceptOnlineOrder = async (orderId: string) => {
    setAcceptingId(orderId);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "جديد", isPaid: false }), // KDS New + Unpaid
      });
      // Remove from local list
      setOnlineOrders(prev => prev.filter(o => o._id !== orderId));
      setPendingOrders(prev => Math.max(0, prev - 1));
      prevPendingRef.current = Math.max(0, prevPendingRef.current - 1);
      // If no more orders, close modal
      if (onlineOrders.length <= 1) setShowOnlineModal(false);
      // Show success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setAcceptingId(null);
    }
  };

  // ── End Shift (Z-Report) ──
  const handleEndShift = async () => {
    setShiftLoading(true);
    setShowShiftModal(true);
    setConfirmClose(false);
    setZReport(null);
    try {
      // 1. Get last shift close timestamp for this branch
      const settingsRes = await fetch(`/api/settings?branch=${encodeURIComponent(POS_BRANCH)}`);
      // Fallback to Epoch 0 if anything fails or if it's the first run
      let lastClose = new Date(0); 
      
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        // Shift logic: If the record exists but has never been manually updated (POST), 
        // we might still be using the initial "Now" default from the old model.
        // We check if updatedAt exists and is significantly after creation or close timestamp is old.
        lastClose = new Date(settings.lastShiftCloseTimestamp || 0);
        
        // RECOVERY: If the lastClose is suspiciously close to 'now' (less than 24h old) 
        // AND the user hasn't successfully closed a shift yet, we might want to default to 0.
        // For now, let's just log it clearly.
        console.log("POS Z-Report — Shift Boundary:", lastClose.toLocaleString());
      }

      // 2. Get all orders
      const res = await fetch("/api/orders");
      if (!res.ok) {
        console.error("Z-Report ERROR: Failed to fetch orders");
        return;
      }
      const allOrders = await res.json();
      console.log('Orders Fetched:', allOrders);
      console.log('Current Timestamp:', new Date().toLocaleString());
      console.log(`POS Z-Report — Total Orders In DB: ${allOrders.length}`);

      // 3. Filter orders strictly by branch and timestamp (Post-Last-Close)
      const shiftOrders = allOrders.filter((o: any) => {
        const d = new Date(o.createdAt);
        const matchBranch = o.branch === POS_BRANCH;
        const afterClose = d > lastClose;
        const activeStatus = (o.status === "Completed" || o.status === "Processing" || o.status === "Pending");
        return matchBranch && afterClose && activeStatus;
      });

      console.log(`POS Z-Report — Found ${shiftOrders.length} orders for this shift.`);
      if (shiftOrders.length > 0) {
        console.log("POS Z-Report — Aggregating Orders:", shiftOrders);
      }

      // ── Aggregation Loop (Defensive Logic) ──
      let cashTotal = 0, visaTotal = 0, cashCount = 0, visaCount = 0;
      let dineInRevenue = 0, takeawayRevenue = 0, deliveryRevenue = 0;
      let dineInCount = 0, takeawayCount = 0, deliveryCount = 0;
      let totalTax = 0, totalDiscounts = 0;
      const itemsMap = new Map<string, { qty: number; revenue: number }>();

      for (const order of shiftOrders) {
        const amount = order.totalAmount || 0;
        
        // ── Normalization for Bilingual Labels ──
        const rawMethod = order.paymentMethod || "Cash";
        const method = (rawMethod === "Visa" || rawMethod === "فيزا") ? "Visa" : "Cash";

        const rawType = order.orderType || "Delivery";
        const type = (rawType === "Dine-in" || rawType === "صالة") ? "Dine-in" :
                     (rawType === "Takeaway" || rawType === "تيك أواي") ? "Takeaway" : 
                     "Delivery";

        // Payment split
        if (method === "Visa") {
          visaTotal += amount;
          visaCount++;
        } else {
          cashTotal += amount;
          cashCount++;
        }

        // Order type split
        if (type === "Delivery") {
          deliveryRevenue += amount;
          deliveryCount++;
        } else if (type === "Takeaway") {
          takeawayRevenue += amount;
          takeawayCount++;
        } else {
          dineInRevenue += amount;
          dineInCount++;
        }

        // Financials
        totalTax += order.taxAmount || 0;
        totalDiscounts += order.discount?.amount || 0;

        // Items Sold Map
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            const iName = item.name || "صنف غير معروف";
            const iQty = item.quantity || 0;
            const iPrice = item.price || 0;
            const existing = itemsMap.get(iName);
            if (existing) {
              existing.qty += iQty;
              existing.revenue += (iQty * iPrice);
            } else {
              itemsMap.set(iName, { qty: iQty, revenue: (iQty * iPrice) });
            }
          }
        }
      }

      const grossRevenue = cashTotal + visaTotal;
      const initialFloat = 0;
      const finalBalance = initialFloat + grossRevenue;

      // Sort items by revenue desc
      const itemsSold = Array.from(itemsMap.entries())
        .map(([name, d]) => ({ name, qty: d.qty, revenue: d.revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      setZReport({
        totalOrders: shiftOrders.length,
        cashTotal, visaTotal, cashCount, visaCount,
        dineInRevenue, takeawayRevenue, deliveryRevenue,
        dineInCount, takeawayCount, deliveryCount,
        totalTax, totalDiscounts, grossRevenue,
        itemsSold, initialFloat, finalBalance,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setShiftLoading(false);
    }
  };

  const handleConfirmCloseShift = async () => {
    setShiftLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: POS_BRANCH }),
      });
      if (res.ok) {
        setShowShiftModal(false);
        setZReport(null);
        setConfirmClose(false);
        
        // Premium Toast Notification
        const toastId = Date.now().toString();
        setToasts(prev => [...prev, { 
          id: toastId, 
          message: "🏁 تم إقفال الوردية بنجاح! الوردية الجديدة بدأت الآن.", 
          type: "success" 
        }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 6000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShiftLoading(false);
    }
  };

  // ── Render ──
  return (
    <div className="fixed inset-0 z-[200] bg-[#0A1128] flex flex-col overflow-hidden select-none" dir="rtl">
      {/* ── Success Overlay ── */}
      {showSuccess && (
        <div className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-28 h-28">
              <div className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl" />
              <div className="relative h-28 w-28 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center">
                <CheckCircle2 className="h-14 w-14 text-green-400" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-white">تم طباعة الفاتورة بنجاح! 🖨️</h2>
            <p className="text-gray-400 text-xl">طلب #{String(finalOrderNumber || orderNumber).padStart(4, "0")}</p>
          </div>
        </div>
      )}

      {/* ── Online Orders Modal ── */}
      {showOnlineModal && (
        <div className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-white font-black text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-400" />
                الطلبات الواردة من الموقع
                <span className="text-xs text-gray-500 font-medium">({onlineOrders.length})</span>
              </h2>
              <button
                onClick={() => setShowOnlineModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {onlineOrders.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد طلبات معلقة</p>
                </div>
              ) : (
                onlineOrders.map((order) => (
                  <div key={order._id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                    {/* Customer Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{order.customerName}</p>
                        <p className="text-gray-400 text-xs mt-0.5" dir="ltr">{order.customerPhone}</p>
                      </div>
                      <span className="text-[10px] text-primary font-black bg-primary/10 px-2 py-0.5 rounded shrink-0 border border-primary/20">
                        {order.orderNumber ? `#${String(order.orderNumber).padStart(4, "0")}` : `#${order._id.slice(-6).toUpperCase()}`}
                      </span>
                    </div>

                    {/* Address */}
                    {order.address && order.address !== "تيك أواي" && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-gray-300 text-xs leading-relaxed">{order.address}</p>
                      </div>
                    )}

                    {/* Items */}
                    <div className="bg-slate-900/60 rounded-lg p-2.5 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-300">{item.quantity}x {item.name}</span>
                          <span className="text-primary font-bold">{item.price * item.quantity} ج.م</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-700">
                        <span className="text-white font-bold text-xs">الإجمالي</span>
                        <span className="text-primary font-black text-sm">{order.totalAmount} ج.م</span>
                      </div>
                    </div>

                    {/* Accept Button */}
                    <button
                      onClick={() => handleAcceptOnlineOrder(order._id)}
                      disabled={acceptingId === order._id}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {acceptingId === order._id ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      قبول الطلب وطباعة الفاتورة ✅
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Z-Report Modal ── */}
      {showShiftModal && (
        <div className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-white font-black text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-400" />
                تقفيل الوردية (Z-Report) — {POS_BRANCH}
              </h2>
              <button
                onClick={() => { setShowShiftModal(false); setZReport(null); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {shiftLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : zReport ? (
                <>
                  {/* Date */}
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">{new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    <p className="text-white font-black text-lg mt-1">{zReport.totalOrders} طلب</p>
                  </div>

                  {/* ── Order Type Breakdown ── */}
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-2">إيرادات حسب نوع الطلب</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-orange-500/5 rounded-xl p-2.5 text-center border border-orange-500/10">
                        <p className="text-base font-black text-orange-400">{zReport.dineInRevenue}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">صالة 🍽️ ({zReport.dineInCount})</p>
                      </div>
                      <div className="bg-cyan-500/5 rounded-xl p-2.5 text-center border border-cyan-500/10">
                        <p className="text-base font-black text-cyan-400">{zReport.takeawayRevenue}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">تيك أواي 🥡 ({zReport.takeawayCount})</p>
                      </div>
                      <div className="bg-pink-500/5 rounded-xl p-2.5 text-center border border-pink-500/10">
                        <p className="text-base font-black text-pink-400">{zReport.deliveryRevenue}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">دليفري 🚚 ({zReport.deliveryCount})</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Payment Method Breakdown ── */}
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-2">طريقة الدفع</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-500/5 rounded-xl p-3 text-center border border-green-500/10">
                        <p className="text-xl font-black text-green-400">{zReport.cashTotal}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">كاش 💵 ({zReport.cashCount} طلب)</p>
                      </div>
                      <div className="bg-blue-500/5 rounded-xl p-3 text-center border border-blue-500/10">
                        <p className="text-xl font-black text-blue-400">{zReport.visaTotal}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">فيزا 💳 ({zReport.visaCount} طلب)</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Tax & Discounts ── */}
                  <div className="bg-slate-800/40 rounded-xl p-3 space-y-2 border border-slate-700/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">إجمالي الضريبة المحصلة (14%)</span>
                      <span className="text-yellow-400 font-bold">{zReport.totalTax} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">إجمالي الخصومات</span>
                      <span className="text-red-400 font-bold">{zReport.totalDiscounts} ج.م</span>
                    </div>
                  </div>

                  {/* ── Items Sold Table ── */}
                  {zReport.itemsSold.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">الأصناف المباعة بالتفصيل</p>
                      <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-right text-gray-500 font-medium p-2.5">اسم الصنف</th>
                              <th className="text-center text-gray-500 font-medium p-2.5 w-16">الكمية</th>
                              <th className="text-left text-gray-500 font-medium p-2.5 w-20">الإيراد</th>
                            </tr>
                          </thead>
                          <tbody>
                            {zReport.itemsSold.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-800/50 hover:bg-white/5">
                                <td className="p-2.5 text-gray-300 font-medium">{item.name}</td>
                                <td className="p-2.5 text-center text-white font-bold">{item.qty}</td>
                                <td className="p-2.5 text-left text-primary font-bold">{item.revenue} ج.م</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── Bottom Line (Accounting) ── */}
                  <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 rounded-xl p-4 border border-purple-500/20 space-y-2">
                    <p className="text-xs text-purple-300 font-black mb-2">الحساب الختامي</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">رصيد بداية الوردية (Float)</span>
                      <span className="text-gray-300 font-bold">{zReport.initialFloat} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">إجمالي الإيرادات المستلمة</span>
                      <span className="text-white font-bold">{zReport.grossRevenue} ج.م</span>
                    </div>
                    <div className="flex justify-between text-base border-t border-purple-500/20 pt-2 mt-1">
                      <span className="text-white font-black">رصيد الدرج النهائي</span>
                      <span className="text-green-400 font-black text-xl">{zReport.finalBalance} ج.م</span>
                    </div>
                  </div>

                  {/* Close / Confirmation Section */}
                  {!confirmClose ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowShiftModal(false); setZReport(null); }}
                        className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all shadow-md active:scale-95"
                      >
                        إغلاق المؤقت
                      </button>
                      <button
                        onClick={() => setConfirmClose(true)}
                        disabled={shiftLoading}
                        className="flex-[2] py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition-all active:scale-95 shadow-lg shadow-rose-900/20 disabled:opacity-50"
                      >
                        تأكيد إقفال الوردية 🚩
                      </button>
                    </div>
                  ) : (
                    <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 animate-in zoom-in-95 duration-200">
                      <p className="text-white font-black text-center text-sm mb-4">هل أنت متأكد من إقفال الوردية وتصفير الخزنة؟</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmClose(false)}
                          className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all active:scale-95"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={handleConfirmCloseShift}
                          disabled={shiftLoading}
                          className="flex-[2] py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition-all active:scale-95 shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {shiftLoading ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>نعم، إقفال الوردية 🏁</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ══════════════ LEFT — Menu (70%) ══════════════ */}
        <div className="flex-[7] flex flex-col overflow-hidden border-l border-slate-800">
          {/* POS Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Utensils className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white leading-tight">نظام شرمب زون (POS)</h1>
                <p className="text-[11px] text-gray-500 font-medium">نظام نقاط البيع — مصر 🇪🇬</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {/* Pending Orders Badge — Clickable */}
              {pendingOrders > 0 && (
                <button
                  onClick={() => setShowOnlineModal(true)}
                  className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <Bell className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-red-400 font-black text-[11px]">{pendingOrders} طلب أونلاين</span>
                </button>
              )}
              {/* End Shift Button */}
              <button
                onClick={handleEndShift}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors text-purple-400"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span className="font-bold text-[11px]">إقفال الوردية</span>
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-gray-400">
                <Coffee className="h-3.5 w-3.5" />
                <span className="font-medium text-[11px]">{dateStr}</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 px-4 py-3 border-b border-slate-800/50 bg-slate-900/30 shrink-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(255,87,34,0.4)]"
                    : "bg-slate-800/60 text-gray-300 hover:bg-slate-700/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-lg">لا توجد أصناف في هذا القسم</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentItems.map((item) => {
                  const inTicket = ticket.find(t => t.id === item._id);
                  return (
                    <button
                      key={item._id}
                      onClick={() => addItem(item)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer min-h-[120px] ${
                        inTicket
                          ? "bg-primary/10 border-primary/40 shadow-[0_0_10px_rgba(255,87,34,0.15)]"
                          : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                      }`}
                    >
                      {inTicket && (
                        <span className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-black text-white shadow-md">
                          {inTicket.qty}
                        </span>
                      )}
                      <p className="text-white font-bold text-sm text-center leading-tight mb-2 line-clamp-2">{item.name}</p>
                      <span className="text-primary font-black text-base">{item.price} <span className="text-xs text-gray-400">ج.م</span></span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ RIGHT — Ticket (30%) ══════════════ */}
        <div className="flex-[3] flex flex-col bg-slate-900 min-w-[320px] max-w-[400px]">

          {/* ── Active Orders Center Toggle ── */}
          <button
            onClick={() => setShowActiveOrdersModal(true)}
            className="mx-3 my-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-orange-500/50 transition-all flex items-center justify-between group shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <ClipboardList className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-right">
                <p className="text-white font-black text-sm">مركز الطلبات النشطة</p>
                <p className="text-[10px] text-gray-500 font-bold">{dbActiveOrders.length} طلبات جارية الآن</p>
              </div>
            </div>
            <div className="flex -space-x-2 rtl:space-x-reverse">
               {dbActiveOrders.slice(0,3).map(o => (
                 <div key={o._id} className="h-6 w-6 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[8px] font-black text-white">
                   {o.orderType === "صالة" ? "🍽️" : "🚚"}
                 </div>
               ))}
            </div>
          </button>


          {/* Ticket Header */}
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-black text-base flex items-center gap-2">
                <Printer className="h-4 w-4 text-primary" />
                رقم الطلب #{String(orderNumber).padStart(4, "0")}
              </h2>
              {ticket.length > 0 && (
                <button
                  onClick={() => { setTicket([]); setActiveTableId(null); }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> مسح
                </button>
              )}
            </div>

            {/* Order Type Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-700 text-sm">
              <button
                onClick={() => setOrderType("dine-in")}
                className={`flex-1 py-2 font-bold transition-all ${
                  orderType === "dine-in"
                    ? "bg-primary text-white"
                    : "bg-slate-800 text-gray-400 hover:text-white"
                }`}
              >
                الصالة 🍽️
              </button>
              <button
                onClick={() => setOrderType("takeaway")}
                className={`flex-1 py-2 font-bold transition-all ${
                  orderType === "takeaway"
                    ? "bg-primary text-white"
                    : "bg-slate-800 text-gray-400 hover:text-white"
                }`}
              >
                تيك أواي 🥡
              </button>
              <button
                onClick={() => setOrderType("delivery")}
                className={`flex-1 py-2 font-bold transition-all flex items-center justify-center gap-1 ${
                  orderType === "delivery"
                    ? "bg-primary text-white"
                    : "bg-slate-800 text-gray-400 hover:text-white"
                }`}
              >
                <Truck className="h-3.5 w-3.5" /> دليفري
              </button>
            </div>

            {/* ── Dynamic Order Fields ── */}
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
              <p className="text-[11px] text-gray-500 font-bold mb-1">بيانات الطلب</p>

              {/* Dine-in: Table Number */}
              {orderType === "dine-in" && (
                <input
                  type="number"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  placeholder="رقم الترابيزة *"
                  className={inputCls}
                  min={1}
                  dir="ltr"
                />
              )}

              {/* Takeaway: Phone (CRM) → Name */}
              {orderType === "takeaway" && (
                <>
                  <div className="relative">
                    <input
                      value={customerPhone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="رقم الموبايل (CRM)"
                      className={`${inputCls} ${crmFound ? "border-green-500/50 bg-green-500/5" : ""}`}
                      dir="ltr"
                      type="tel"
                      inputMode="numeric"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      {crmLoading ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : crmFound ? (
                        <span className="text-green-400 text-[10px] font-bold">✓ CRM</span>
                      ) : customerPhone.length >= 8 ? (
                        <Search className="h-3.5 w-3.5 text-gray-500" />
                      ) : null}
                    </div>
                  </div>
                  <input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="اسم العميل"
                    className={inputCls}
                  />
                </>
              )}

              {/* Delivery: Phone (CRM) → Name → Address */}
              {orderType === "delivery" && (
                <>
                  <div className="relative">
                    <input
                      value={customerPhone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="رقم الموبايل (CRM)"
                      className={`${inputCls} ${crmFound ? "border-green-500/50 bg-green-500/5" : ""}`}
                      dir="ltr"
                      type="tel"
                      inputMode="numeric"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      {crmLoading ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : crmFound ? (
                        <span className="text-green-400 text-[10px] font-bold">✓ CRM</span>
                      ) : customerPhone.length >= 8 ? (
                        <Search className="h-3.5 w-3.5 text-gray-500" />
                      ) : null}
                    </div>
                  </div>
                  <input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="اسم العميل"
                    className={inputCls}
                  />
                  <textarea
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="العنوان بالتفصيل *"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </>
              )}
            </div>
          </div>

          {/* Ticket Items */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {ticket.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                <ShoppingBag className="h-12 w-12 opacity-30" />
                <p className="text-sm font-medium">اضغط على صنف لإضافته</p>
              </div>
            ) : (
              ticket.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{item.name}</p>
                    <p className="text-primary text-xs font-black mt-0.5">
                      {item.price * item.qty} ج.م
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-600 active:scale-90 transition-all"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center text-white font-black text-sm">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-600 active:scale-90 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 active:scale-90 transition-all shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Area */}
          <div className="border-t border-slate-800 px-4 pt-3 pb-4 shrink-0 space-y-3 bg-slate-900">
            {/* Discount Section */}
            {ticket.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                    <Tag className="h-3 w-3" /> إضافة خصم
                  </p>
                  <div className="flex rounded-lg overflow-hidden border border-slate-600 text-[11px]">
                    <button
                      onClick={() => setDiscountType("%")}
                      className={`px-3 py-1 font-bold transition-all flex items-center gap-0.5 ${
                        discountType === "%" ? "bg-primary text-white" : "bg-slate-800 text-gray-400"
                      }`}
                    >
                      <Percent className="h-3 w-3" /> نسبة
                    </button>
                    <button
                      onClick={() => setDiscountType("fixed")}
                      className={`px-3 py-1 font-bold transition-all ${
                        discountType === "fixed" ? "bg-primary text-white" : "bg-slate-800 text-gray-400"
                      }`}
                    >
                      مبلغ ج.م
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === "%" ? "النسبة (%)" : "المبلغ (ج.م)"}
                  className="w-full bg-slate-900/60 border border-slate-600 rounded-lg p-2 text-white text-sm placeholder:text-gray-500 outline-none focus:border-orange-500 transition-all"
                  dir="ltr"
                  min={0}
                />
              </div>
            )}

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>المجموع الفرعي ({itemCount} صنف)</span>
                <span className="text-white font-bold">{subtotal} ج.م</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>خصم {discountType === "%" ? `${discountNum}%` : `${discountNum} ج.م`}</span>
                  <span className="font-bold">- {discountAmount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>ضريبة 14%</span>
                <span className="text-white font-bold">{tax} ج.م</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-slate-700">
                <span className="text-white font-black">الإجمالي</span>
                <span className="text-primary font-black text-xl">{total} ج.م</span>
              </div>
            </div>

            {/* Dynamic Checkout Flow (Phase 7 Logistics) */}
            {activeOrderId && orderType === "delivery" ? (
              <div className="space-y-3">
                <button 
                  disabled={activeOrderStatus === "جديد" || activeOrderStatus === "جاري التحضير"}
                  onClick={() => {
                    if (activeOrderStatus === "جاهز") {
                      updateOrderStatus(activeOrderId, "out_for_delivery");
                      setActiveOrderStatus("خرج للتوصيل");
                    } else if (activeOrderStatus === "خرج للتوصيل") {
                      (async () => {
                        await fetch(`/api/orders/${activeOrderId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "completed", isPaid: true }),
                        });
                        setShowSuccess(true);
                        setTimeout(() => {
                          setShowSuccess(false);
                          setTicket([]);
                          resetForm();
                        }, 2000);
                      })();
                    }
                  }}
                  className={`w-full py-4 rounded-2xl text-white font-black text-lg transition-all active:scale-95 disabled:opacity-50 shadow-lg ${
                    activeOrderStatus === "جاهز" ? "bg-green-600 hover:bg-green-500" :
                    activeOrderStatus === "خرج للتوصيل" ? "bg-purple-600 hover:bg-purple-500" :
                    "bg-slate-700 font-bold"
                  }`}
                >
                  {activeOrderStatus === "جديد" || activeOrderStatus === "جاري التحضير" ? "👨‍🍳 بانتظار المطبخ" :
                   activeOrderStatus === "جاهز" ? "🚚 تسليم للطيار" :
                   activeOrderStatus === "خرج للتوصيل" ? "💰 تحصيل وإغلاق" : "Completed"}
                </button>
                <button
                  onClick={() => { setOrderToCancel({ _id: activeOrderId, orderNumber: finalOrderNumber }); setShowCancelModal(true); }}
                  className="w-full py-3 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-black text-sm transition-all active:scale-95 border border-red-500/20"
                >
                  إلغاء الطلب 🚨
                </button>
              </div>
            ) : (
              <>
                {/* Standard Save/Unpaid Button */}
                {(orderType === "dine-in" || orderType === "takeaway" || orderType === "delivery") && (
                  <button
                    onClick={handleSaveUnpaidOrder}
                    disabled={isUnpaidOrderDisabled}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-black text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg ${
                      orderType === "dine-in" ? "bg-amber-600 hover:bg-amber-500" : "bg-slate-700 hover:bg-slate-600 border border-slate-600"
                    }`}
                  >
                    <Save className="h-4 w-4" />
                    {orderType === "dine-in" ? "حفظ الطاولة 💾" : "إرسال للمطبخ (آجل) 👨‍🍳"}
                  </button>
                )}

                {/* Standard Pay Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePay("Cash")}
                    disabled={isPayDisabled}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-black text-base transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg"
                  >
                    <Banknote className="h-5 w-5" />
                    دفع كاش 💵
                  </button>
                  <button
                    onClick={() => handlePay("Visa")}
                    disabled={isPayDisabled}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg"
                  >
                    <CreditCard className="h-5 w-5" />
                    فيزا 💳
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>

      {/* ── Active Orders Center Modal ── */}
      {showActiveOrdersModal && (
        <div className="absolute inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">مركز الطلبات النشطة</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">متابعة العمليات الجارية في الصالة والدليفري</p>
                </div>
              </div>
              <button
                onClick={() => setShowActiveOrdersModal(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-slate-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex divide-x divide-x-reverse divide-slate-800">
              {/* Column 1: Deferred / Unpaid (Settlement Focus) */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-black text-white">فواتير مفتوحة (آجل)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black">
                    {dbActiveOrders.filter(o => !o.isPaid).length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {dbActiveOrders.filter(o => !o.isPaid).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                      <TableProperties className="h-12 w-12 text-gray-500 mb-2" />
                      <p className="text-xs font-bold text-gray-500">لا توجد فواتير معلقة</p>
                    </div>
                  ) : (
                    dbActiveOrders.filter(o => !o.isPaid).map(order => (
                      <div key={order._id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 hover:border-amber-500/50 transition-all group">
                         <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                               {order.orderType === "صالة" ? <TableProperties className="h-4 w-4 text-amber-500/50" /> : <Truck className="h-4 w-4 text-blue-500/50" />}
                               <div>
                                  <p className="text-white font-black text-sm">{order.customerName.split('|').length > 1 ? order.customerName.split('|')[1] : order.customerName.split('|')[0]}</p>
                                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                    {order.orderNumber ? `#${String(order.orderNumber).padStart(4, "0")}` : `#${order._id.slice(-6).toUpperCase()}`}
                                  </p>
                               </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                               order.status === "جاهز" ? "bg-green-500/20 text-green-400" :
                               order.status === "جاري التحضير" ? "bg-blue-500/20 text-blue-400" :
                               "bg-amber-500/20 text-amber-400"
                            }`}>
                               {order.status}
                            </span>
                         </div>
                         <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700/50">
                            {order.orderType === "دليفري" ? (
                               <button 
                                 disabled={order.status === "جديد" || order.status === "جاري التحضير"}
                                 onClick={() => {
                                   if (order.status === "جاهز") {
                                     updateOrderStatus(order._id, "out_for_delivery");
                                   } else if (order.status === "خرج للتوصيل") {
                                     (async () => {
                                       await fetch(`/api/orders/${order._id}`, {
                                         method: "PATCH",
                                         headers: { "Content-Type": "application/json" },
                                         body: JSON.stringify({ status: "completed", isPaid: true }),
                                       });
                                       setDbActiveOrders(prev => prev.filter(o => o._id !== order._id));
                                       const toastId = Date.now().toString();
                                       setToasts(prev => [...prev, { id: toastId, message: "💰 تم تحصيل المبلغ وإغلاق الطلب بنجاح!", type: "success" }]);
                                     })();
                                   }
                                 }}
                                 className={`flex-1 py-2 rounded-lg text-white text-[10px] font-black transition-all active:scale-95 disabled:opacity-50 ${
                                   order.status === "جاهز" ? "bg-green-600 hover:bg-green-500" :
                                   order.status === "خرج للتوصيل" ? "bg-purple-600 hover:bg-purple-500" :
                                   "bg-slate-700 font-bold"
                                 }`}
                               >
                                 {order.status === "جديد" || order.status === "جاري التحضير" ? "👨‍🍳 بانتظار المطبخ" :
                                  order.status === "جاهز" ? "🚚 تسليم للطيار" :
                                  order.status === "خرج للتوصيل" ? "💰 تحصيل وإغلاق" : "Completed"}
                               </button>
                            ) : (
                               <button
                                 onClick={() => loadOrderToCart(order)}
                                 className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                               >
                                 <Plus className="h-3 w-3" /> تحصيل وتحديث
                               </button>
                            )}
                             <button
                               onClick={() => { setOrderToCancel(order); setShowCancelModal(true); }}
                               className="px-3 py-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black transition-all active:scale-95 border border-red-500/20"
                             >
                               إلغاء 🚨
                             </button>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Paid Active Orders (Tracking Focus) */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-blue-500/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-black text-white">متابعة الطلبات (مدفوعة)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-500 text-white text-[10px] font-black">
                    {dbActiveOrders.filter(o => o.isPaid).length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                   {dbActiveOrders.filter(o => o.isPaid).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                      <Truck className="h-12 w-12 text-gray-500 mb-2" />
                      <p className="text-xs font-bold text-gray-500">لا توجد طلبات جارية</p>
                    </div>
                  ) : (
                    dbActiveOrders.filter(o => o.isPaid).map(order => (
                      <div key={order._id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 hover:border-blue-500/50 transition-all">
                         <div className="flex items-start justify-between mb-3">
                            <div className="min-w-0 flex-1">
                               <p className="text-white font-black text-sm truncate">{order.customerName.split('|').length > 1 ? order.customerName.split('|')[1] : "طلب خارجي"}</p>
                               <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                               order.status === "جاهز" ? "bg-green-500/20 text-green-400" :
                               order.status === "جاري التحضير" ? "bg-blue-500/20 text-blue-400" :
                               order.status === "خرج للتوصيل" ? "bg-purple-500/20 text-purple-400" :
                               "bg-orange-500/20 text-orange-400"
                            }`}>
                               {order.status}
                            </span>
                         </div>
                         <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700/50">
                            {order.status === "جاهز" && (
                               <button 
                                 onClick={() => updateOrderStatus(order._id, order.orderType === "دليفري" ? "خرج للتوصيل" : "Completed")}
                                 className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[10px] font-black transition-all active:scale-95"
                               >
                                 {order.orderType === "دليفري" ? "🚚 خرج للتوصيل" : "✅ تسليم الطلب"}
                               </button>
                            )}
                            {order.status === "خرج للتوصيل" && (
                               <button 
                                 onClick={() => updateOrderStatus(order._id, "Completed")}
                                 className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black transition-all active:scale-95"
                               >
                                 🏁 تم التسليم
                               </button>
                            )}
                            <button 
                              onClick={() => loadOrderToCart(order)}
                              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 text-[10px] font-bold transition-all active:scale-95"
                            >
                              تحميل الطلب
                            </button>
                            <button 
                              onClick={() => { setOrderToCancel(order); setShowCancelModal(true); }}
                              className="px-3 py-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black transition-all active:scale-95 border border-red-500/20"
                            >
                              إلغاء الطلب 🚨
                            </button>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Toast Notifications Overlay ── */}

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" dir="rtl">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className="flex items-center gap-3 bg-slate-900 border-2 border-green-500/50 text-white px-6 py-4 rounded-2xl shadow-2xl min-w-[320px] animate-in slide-in-from-right-full duration-500 pointer-events-auto"
          >
            <div className="bg-green-600 p-2 rounded-full shadow-lg shadow-green-900/20">
              <Bell className="h-5 w-5 text-white animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black leading-tight">{toast.message}</p>
              <div className="h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-green-500 animate-out fade-out fill-mode-forwards duration-1000" style={{ width: '100%' }}></div>
              </div>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Cancel Order Confirmation Modal ── */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0D152B] border border-red-500/30 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              {/* Warning Icon */}
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center animate-pulse">
                <Trash2 className="h-10 w-10 text-red-500" />
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">إلغاء الطلب 🚨</h3>
                <p className="text-gray-300 font-bold">
                  هل أنت متأكد من إلغاء الطلب رقم 
                  <span className="text-red-400 mx-1">#{orderToCancel.orderNumber || orderToCancel._id.slice(-6).toUpperCase()}</span>؟
                </p>
                <p className="text-xs text-gray-500 leading-relaxed px-4">
                  هذا الإجراء سيقوم باسترجاع المواد الخام للمخزن وتحديث التقارير المالية. لا يمكن التراجع عن هذه الخطوة.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCanceledLoading}
                  className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-lg transition-all active:scale-95 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                >
                  {isCanceledLoading ? (
                    <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "نعم، إلغاء الطلب 🏁"
                  )}
                </button>
                <button
                  onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
                  className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-base transition-all active:scale-95"
                >
                  تراجع عن الإلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
