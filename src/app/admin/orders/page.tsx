"use client";

import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Clock, CheckCircle, XCircle, Filter, RotateCcw, TrendingUp, Loader, MapPin, ChevronDown, Utensils, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EGYPT_BRANCHES } from "@/lib/branches";
import { exportToExcel } from "@/lib/exportUtils";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber?: number;
  customerName: string;
  customerPhone: string;
  address: string;
  country: string;
  branch: string;
  items: OrderItem[];
  totalAmount: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled" | "Refunded" | "جديد" | "جاري التحضير" | "جاهز" | "خرج للتوصيل" | "تم التسليم";
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  Pending: { label: "أونلاين معلق", icon: Clock, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  Processing: { label: "قيد التجهيز", icon: Loader, color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  Completed: { label: "مكتمل", icon: CheckCircle, color: "text-green-400 bg-green-400/10 border-green-400/20" },
  Cancelled: { label: "ملغي", icon: XCircle, color: "text-gray-400 bg-gray-400/10 border-gray-400/20" },
  Refunded: { label: "مرتجع", icon: RotateCcw, color: "text-red-400 bg-red-400/10 border-red-400/20" },
  "جديد": { label: "جديد (المطبخ)", icon: Clock, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  "جاري التحضير": { label: "جاري التحضير", icon: Utensils, color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  "جاهز": { label: "جاهز للاستلام", icon: ShoppingBag, color: "text-green-400 bg-green-400/10 border-green-400/20" },
  "خرج للتوصيل": { label: "خرج للتوصيل", icon: Truck, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  "تم التسليم": { label: "تم التسليم", icon: CheckCircle, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("كل الفروع");

  const BRANCHES = ["كل الفروع", ...EGYPT_BRANCHES.map((b) => b.label)];

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Live polling every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    if (selectedBranch === "كل الفروع") return orders;
    return orders.filter((o) => o.branch === selectedBranch);
  }, [orders, selectedBranch]);

  const stats = useMemo(() => ({
    total: filteredOrders.length,
    pending: filteredOrders.filter((o) => o.status === "Pending").length,
    completed: filteredOrders.filter((o) => o.status === "Completed").length,
    revenue: filteredOrders.filter((o) => o.status !== "Cancelled" && o.status !== "Refunded").reduce((s, o) => s + o.totalAmount, 0),
    refundedTotal: filteredOrders.filter((o) => o.status === "Refunded").reduce((s, o) => s + o.totalAmount, 0),
  }), [filteredOrders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    if (filteredOrders.length === 0) return;

    const headers = ["رقم الطلب", "التاريخ", "العميل", "الهاتف", "العنوان", "الفرع", "الأصناف", "الإجمالي (ج.م)", "الحالة"];
    
    const data = filteredOrders.map(o => {
      const itemsStr = o.items.map(i => `${i.quantity}x ${i.name}`).join(" | ");
      const statusLabel = STATUS_CONFIG[o.status]?.label || o.status;
      const orderId = o.orderNumber ? `#${String(o.orderNumber).padStart(4, "0")}` : `#${o._id.slice(-6).toUpperCase()}`;
      
      return [
        orderId,
        new Date(o.createdAt).toLocaleString("ar-EG"),
        o.customerName,
        o.customerPhone,
        o.address,
        o.branch,
        itemsStr,
        o.totalAmount,
        statusLabel
      ];
    });

    exportToExcel(data, headers, `Bahij_Orders_${selectedBranch.replace(/ /g, "_")}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" />
          إدارة الطلبات
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-64">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-3 text-white font-bold appearance-none focus:border-primary outline-none transition-all cursor-pointer shadow-lg"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 font-bold">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchOrders} variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-xl">
              تحديث
            </Button>
            <Button 
              onClick={handleExport}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
            >
              تصدير (Excel)
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-white">{stats.total}</p>
          <p className="text-gray-400 text-sm mt-1">إجمالي الطلبات</p>
        </div>
        <div className="bg-yellow-400/5 border border-yellow-400/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-yellow-400">{stats.pending}</p>
          <p className="text-gray-400 text-sm mt-1">قيد الانتظار</p>
        </div>
        <div className="bg-green-400/5 border border-green-400/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-green-400">{stats.completed}</p>
          <p className="text-gray-400 text-sm mt-1">مكتمل</p>
        </div>
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 text-center">
          <p className="text-2xl font-black text-primary">{stats.revenue.toLocaleString()}</p>
          <p className="text-gray-400 text-sm mt-1">صافي الإيرادات (ج.م)</p>
        </div>
        {/* Refunds stat */}
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 text-center">
          <p className="text-2xl font-black text-rose-400">{stats.refundedTotal.toLocaleString()}</p>
          <p className="text-gray-400 text-sm mt-1">إجمالي المرتجعات (ج.م)</p>
        </div>
      </div>

      {/* Filters Placeholder for Spacing */}
      <div className="mb-4" />

      {/* Orders List */}
      {loading ? (
        <div className="text-center text-gray-400 py-16">جاري التحميل...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-secondary/20 rounded-2xl border border-white/5 border-dashed">
          لا توجد طلبات حالياً.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
            const StatusIcon = statusCfg.icon;
            const isRefunded = order.status === "Refunded";

            return (
              <Card
                key={order._id}
                className={`border-white/10 hover:border-white/20 transition-colors overflow-hidden ${
                  isRefunded ? "bg-red-500/10 border-red-500/20" : "bg-secondary/40"
                }`}
              >
                <CardContent className="p-5">
                  {/* Top Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-primary font-black bg-primary/10 px-3 py-1 rounded-lg border border-primary/20" dir="ltr">
                        {order.orderNumber ? `#${String(order.orderNumber).padStart(4, "0")}` : `#${order._id.slice(-6).toUpperCase()}`}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusCfg.label}
                    </div>
                  </div>

                  {/* Customer & Branch */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">العميل</p>
                      <p className="text-white font-bold text-sm">{order.customerName}</p>
                      <p className="text-gray-400 text-xs mt-0.5" dir="ltr">{order.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">العنوان</p>
                      <p className="text-gray-300 text-sm line-clamp-2">{order.address}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span className="text-gray-300">{item.quantity}x {item.name}</span>
                        <span className="text-primary font-bold">{item.price * item.quantity} ج.م</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t border-white/10">
                      <span className="text-white font-bold text-sm">الإجمالي</span>
                      <span className="text-primary font-black">{order.totalAmount} ج.م</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isRefunded && (
                    <div className="flex gap-2 flex-wrap">
                      {order.status === "Pending" && (
                        <>
                          <Button
                            onClick={() => updateStatus(order._id, "Completed")}
                            size="sm"
                            className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-lg text-xs h-8 px-4 transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5 ml-1" /> تأكيد
                          </Button>
                          <Button
                            onClick={() => updateStatus(order._id, "Cancelled")}
                            size="sm"
                            className="bg-gray-500/20 text-gray-400 hover:bg-gray-500 hover:text-white rounded-lg text-xs h-8 px-4 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5 ml-1" /> إلغاء
                          </Button>
                        </>
                      )}
                      {order.status === "Completed" && (
                        <Button
                          onClick={() => updateStatus(order._id, "Refunded")}
                          size="sm"
                          className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-xs h-8 px-4 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5 ml-1" /> إرجاع الطلب
                        </Button>
                      )}
                    </div>
                  )}
                  {isRefunded && (
                    <p className="text-red-400/60 text-xs font-medium">تم إرجاع هذا الطلب — لا إجراءات متاحة</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
