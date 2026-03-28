"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag, Clock, CheckCircle, XCircle, TrendingUp,
  BarChart3, MapPin, RotateCcw, Filter, Calendar, Loader, Package, DollarSign, Utensils, Download
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from "recharts";
import Link from "next/link";
import { exportToExcel } from "@/lib/exportUtils";

interface OrderItem {
  id: string; // Add id for item tracking
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  country: string;
  branch: string;
  items: OrderItem[];
  totalAmount: number;
  status: "جديد" | "جاري التحضير" | "جاهز" | "خرج للتوصيل" | "تم التسليم" | "ملغي" | "مرتجع" | "Pending" | "Processing" | "Ready" | "Completed" | "Cancelled" | "Refunded";
  createdAt: string;
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  "جديد": { label: "جديد", color: "text-yellow-400 bg-yellow-400/10" },
  "جاري التحضير": { label: "جاري التحضير", color: "text-orange-400 bg-orange-400/10" },
  "جاهز": { label: "جاهز للاستلام", color: "text-blue-400 bg-blue-400/10" },
  "خرج للتوصيل": { label: "خرج للتوصيل", color: "text-purple-400 bg-purple-400/10" },
  "تم التسليم": { label: "تم التسليم", color: "text-green-400 bg-green-400/10" },
  "ملغي": { label: "ملغي", color: "text-gray-400 bg-gray-400/10" },
  "مرتجع": { label: "مرتجع", color: "text-red-400 bg-red-400/10" },
};

// Default to today's date in YYYY-MM-DD format (Cairo Timezone FIX)
function getCairoDate() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);
  const map = new Map(parts.map(p => [p.type, p.value]));
  return `${map.get("year")}-${map.get("month")}-${map.get("day")}`;
}

function todayStr() {
  return getCairoDate();
}

function startOfMonthStr() {
  const current = getCairoDate();
  return `${current.slice(0, 8)}01`;
}

export default function AdminOverview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]); // Added for Dormant Items cross-ref
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(startOfMonthStr());
  const [dateTo, setDateTo] = useState(todayStr());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, invRes, menuRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/inventory"),
          fetch("/api/menu")
        ]);
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (invRes.ok) setInventory(await invRes.json());
        if (menuRes.ok) setMenuItems(await menuRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Live sync every 15s
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let result = orders;

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.createdAt) <= to);
    }

    return result;
  }, [orders, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter(o => o.status === "جديد" || o.status === "Pending").length;
    const processing = filtered.filter(o => o.status === "جاري التحضير" || o.status === "Processing").length;
    const ready = filtered.filter(o => o.status === "جاهز" || o.status === "Ready").length;
    const completed = filtered.filter(o => o.status === "تم التسليم" || o.status === "خرج للتوصيل" || o.status === "Completed").length;
    const cancelled = filtered.filter(o => o.status === "ملغي" || o.status === "Cancelled").length;
    
    // Active = New + Preparing + Ready
    const activeOrdersCount = pending + processing + ready;

    const revenue = filtered
      .filter(o => o.status !== "ملغي" && o.status !== "مرتجع" && o.status !== "Cancelled" && o.status !== "Refunded")
      .reduce((s, o) => s + o.totalAmount, 0);

    const refundedTotal = filtered.filter(o => o.status === "مرتجع" || o.status === "Refunded" || o.status === "ملغي" || o.status === "Cancelled").reduce((sum, o) => sum + o.totalAmount, 0);

    return { total, pending, processing, ready, completed, cancelled, revenue, refundedTotal, activeOrdersCount };
  }, [filtered]);

  // Action 3: Chart Data Fix (Zero-fill empty dates)
  const chartData = useMemo(() => {
    const daily: Record<string, number> = {};
    
    // 1. Pre-fill with zeros for all days in range
    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split("T")[0];
        daily[dateString] = 0;
      }
    }

    // 2. Aggregate actual sales
    filtered.forEach(o => {
      if (o.status === "تم التسليم" || o.status === "خرج للتوصيل" || o.status === "Completed") {
        const dateString = o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : null;
        if (dateString && daily.hasOwnProperty(dateString)) {
          daily[dateString] += o.totalAmount;
        }
      }
    });

    return Object.entries(daily)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, total]) => ({ name, total }));
  }, [filtered, dateFrom, dateTo]);

  // SSR Hydration fix for Recharts
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Phase 9: Top Performers
  const topItems = useMemo(() => {
    const sales: Record<string, number> = {};
    filtered.forEach(o => {
      if (o.status === "تم التسليم" || o.status === "خرج للتوصيل" || o.status === "Completed") {
        o.items.forEach(item => {
          if (item.name) sales[item.name] = (sales[item.name] || 0) + item.quantity;
        });
      }
    });
    return Object.entries(sales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));
  }, [filtered]);

  // Phase 9: Dormant Items (Zero sales in filtered period)
  const dormantItems = useMemo(() => {
    const soldNames = new Set<string>();
    filtered.forEach(o => {
      if (o.status === "تم التسليم" || o.status === "خرج للتوصيل" || o.status === "Completed") {
        o.items.forEach(i => soldNames.add(i.name));
      }
    });
    
    // Cross-reference with ALL Menu Items
    const dormant = menuItems
      .filter(m => !soldNames.has(m.name))
      .map(m => m.name)
      .slice(0, 5);

    return dormant;
  }, [filtered, menuItems]);

  const criticalStockCount = useMemo(() => {
    return inventory.filter(i => i.stock <= (i.minStockLevel || 0)).length;
  }, [inventory]);

  const recentOrders = useMemo(() => filtered.slice(0, 8), [filtered]);

  const handleExportExcel = () => {
    if (filtered.length === 0) return;

    const headers = ["رقم الطلب", "التاريخ", "العميل", "النوع", "الحالة", "الإجمالي (ج.م)"];
    
    const data = filtered.map(o => {
      const date = new Date(o.createdAt).toLocaleDateString("ar-EG", {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
      const customer = `${o.customerName} (${o.customerPhone})`;
      const type = o.address ? "توصيل (Delivery)" : "صالة (Dine-in)";
      const status = STATUS_STYLES[o.status]?.label || o.status;
      const total = o.totalAmount;
      const id = `#${o._id.slice(-6).toUpperCase()}`;

      return [id, date, customer, type, status, total];
    });

    exportToExcel(data, headers, "Shrimp_Zone_ERP_Report");
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        نظرة عامة
      </h1>

      {/* Filters Row */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Calendar 
                className="h-4 w-4 text-primary shrink-0 cursor-pointer hover:scale-110 transition-transform" 
                onClick={() => {
                  const input = document.getElementById("date-from-input") as HTMLInputElement;
                  if (input && input.showPicker) input.showPicker();
                  else if (input) input.click();
                }}
              />
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">من:</label>
                <input
                  id="date-from-input"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">إلى:</label>
              <input
                id="date-to-input"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-6">
            <button
              onClick={() => { setDateFrom(startOfMonthStr()); setDateTo(todayStr()); }}
              className="text-xs font-bold text-gray-400 hover:text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary transition-all border border-transparent hover:border-primary/30"
            >
              هذا الشهر
            </button>
            <button
              onClick={() => { setDateFrom(todayStr()); setDateTo(todayStr()); }}
              className="text-xs font-bold text-gray-400 hover:text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary transition-all border border-transparent hover:border-primary/30"
            >
              اليوم
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 text-xs font-black text-white px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            <Download className="h-4 w-4" />
            تصدير التقرير (Excel)
          </button>
        </div>
      </div>

      {/* Order Stats — now 7 cards with Active Orders & Critical Stock */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
        <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{stats.total}</p>
              <p className="text-gray-400 text-xs mt-0.5">إجمالي الطلبات</p>
            </div>
          </CardContent>
        </Card>

        {/* Phase 10: Active Orders Count (New + Preparing + Ready) */}
        <Card className="bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40 transition-all border-dashed">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Utensils className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-orange-400">{stats.activeOrdersCount}</p>
              <p className="text-gray-400 text-[10px] mt-0.5">طلبات نشطة (تحت التنفيذ)</p>
            </div>
          </CardContent>
        </Card>

        {/* Phase 10: Critical Stock Card */}
        <Link href="/inventory" className="block">
          <Card className={`border-white/10 hover:border-red-500/50 transition-all cursor-pointer ${criticalStockCount > 0 ? 'bg-red-500/10 border-red-500/30 animate-pulse' : 'bg-white/5'}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${criticalStockCount > 0 ? 'bg-red-500/20' : 'bg-slate-500/10'}`}>
                <Package className={`h-6 w-6 ${criticalStockCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`text-3xl font-black ${criticalStockCount > 0 ? 'text-red-500' : 'text-white'}`}>{criticalStockCount}</p>
                <p className="text-gray-400 text-xs mt-0.5">نواقص المخزن</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-yellow-400/5 border-yellow-400/10 hover:border-yellow-400/20 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-400/10 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-yellow-400">{stats.pending}</p>
              <p className="text-gray-400 text-xs mt-0.5">جديد (New)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-400/5 border-orange-400/10 hover:border-orange-400/20 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-orange-400/10 rounded-xl">
              <Loader className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-orange-400">{stats.processing}</p>
              <p className="text-gray-400 text-xs mt-0.5">قيد التجهيز</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-400/5 border-blue-400/10 hover:border-blue-400/20 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-400/10 rounded-xl">
              <CheckCircle className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-blue-400">{stats.ready}</p>
              <p className="text-gray-400 text-xs mt-0.5">جاهز (Ready)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <RotateCcw className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-rose-400">{stats.refundedTotal}</p>
              <p className="text-gray-400 text-xs mt-0.5">مرتجعات (ج.م)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase 9: Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> أداء المبيعات (ج.م)
          </h2>
          <Card className="bg-secondary/40 border-white/5 p-6 h-[420px] overflow-x-auto">
            <div style={{ width: '1000px', height: '350px', position: 'relative', display: 'block' }}>
               {mounted && (
                <AreaChart width={1000} height={350} data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5722" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF5722" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A1128', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#FF5722', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#FF5722" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
               )}
            </div>
          </Card>
        </div>

        {/* Top Performers Card */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" /> أكثر المنتجات مبيعاً 🔥
            </h2>
            <Card className="bg-white/[0.03] border-white/5 divide-y divide-white/5 overflow-hidden backdrop-blur-sm">
              {topItems.map((item, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 font-black text-xs group-hover:bg-green-500/20 transition-colors">
                      {i+1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">{item.name}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">صنف نشط</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{item.qty}</p>
                    <p className="text-[10px] text-gray-500">قطعة</p>
                  </div>
                </div>
              ))}
              {topItems.length === 0 && <div className="p-12 text-center text-gray-500 text-sm">لا توجد بيانات كافية</div>}
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-gray-500" /> المنتجات الراكدة (هذا الشهر) 📉
            </h2>
            <Card className="bg-white/[0.03] border-white/5 divide-y divide-white/5 overflow-hidden backdrop-blur-sm">
              {dormantItems.map((name, i) => (
                <div key={name} className="p-4 flex items-center justify-between group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-gray-600 group-hover:bg-rose-500 transition-colors shadow-[0_0_8px_rgba(244,63,94,0)] group-hover:shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    <p className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{name}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase text-gray-600 bg-black/20 px-2 py-0.5 rounded border border-white/5">0 مبيعات</span>
                </div>
              ))}
              {dormantItems.length === 0 && <div className="p-12 text-center text-gray-500 text-sm italic">جميع المنتجات نشطة بانتظام ✅</div>}
            </Card>
          </div>
        </div>
      </div>

      {/* Revenue Snapshot Card */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" /> ملخص الإيرادات السريع
        </h2>
        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/5 border-green-500/10 hover:border-green-500/20 transition-colors overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">🇪🇬</span>
              <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full font-bold">EGP</span>
            </div>
            <p className="text-4xl font-black text-white">{stats.revenue.toLocaleString('ar-EG')} <span className="text-lg text-gray-400 font-medium">ج.م</span></p>
            <p className="text-gray-400 text-sm mt-1">صافي الإيرادات (تم استبعاد {stats.cancelled} طلب ملغي)</p>
            <div className="absolute -bottom-4 -left-4 text-8xl opacity-5 font-black">EGP</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> آخر الطلبات
        </h2>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-secondary/20 rounded-2xl border border-white/5 border-dashed">
            لا توجد طلبات في الفترة المحددة.
          </div>
        ) : (
          <Card className="bg-secondary/30 border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-right text-gray-400 font-medium p-4 text-xs">العميل</th>
                    <th className="text-right text-gray-400 font-medium p-4 text-xs">رقم الطلب</th>
                    <th className="text-right text-gray-400 font-medium p-4 text-xs">الإجمالي</th>
                    <th className="text-right text-gray-400 font-medium p-4 text-xs">الحالة</th>
                    <th className="text-right text-gray-400 font-medium p-4 text-xs">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const st = STATUS_STYLES[order.status] || STATUS_STYLES["جديد"];
                    const isRefunded = order.status === "مرتجع";
                    return (
                      <tr key={order._id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isRefunded ? "bg-red-500/10" : ""}`}>
                        <td className="p-4">
                          <p className="text-white font-bold">{order.customerName}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5" dir="ltr">{order.customerPhone}</p>
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-xs">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="p-4">
                          <span className="text-primary font-black">{order.totalAmount} ج.م</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="p-4 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
