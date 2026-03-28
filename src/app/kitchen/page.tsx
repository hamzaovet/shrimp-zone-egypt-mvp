"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  AlertCircle, 
  Utensils, 
  History,
  TrendingUp,
  Package
} from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber?: number;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  orderType: string;
  createdAt: string;
  preparingAt?: string;
  readyAt?: string;
}

const KDSPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [playedAlerts, setPlayedAlerts] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/assets/notification.mp3');
  }, []);

  const fetchOrders = async () => {
    try {
      const branch = typeof window !== 'undefined' ? localStorage.getItem('shrimpZoneBranch') || '' : '';
      const res = await fetch(`/api/kitchen?branch=${encodeURIComponent(branch)}`);
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);

        // ── Royal Whistle Logic (New Order Alert) ──
        const newPending = data.filter(o => o.status === 'pending' && !playedAlerts.includes(o._id));
        if (newPending.length > 0) {
          audioRef.current?.play().catch(() => console.log("Audio play blocked by browser"));
          setPlayedAlerts(prev => [...prev, ...newPending.map(o => o._id)]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch kitchen orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000); // Update clock every minute
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // Optimistic Update
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));

      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      
      // Refresh to ensure synchronization
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("خطأ في تحديث الحالة");
      fetchOrders();
    }
  };

  const getTimeElapsed = (timestamp: string) => {
    const start = new Date(timestamp);
    const diff = Math.floor((currentTime.getTime() - start.getTime()) / 60000); // Diff in minutes
    
    if (diff < 1) return "الآن";
    return `منذ ${diff} دقيقة`;
  };

  const newOrders = orders.filter(o => o.status === 'جديد');
  const preparingOrders = orders.filter(o => o.status === 'جاري التحضير');

  const formatOrderHeader = (order: Order) => {
    const name = order.customerName;
    if (!name) return "طلب غير معروف";
    // Display Order Number prominently if available
    const displayId = order.orderNumber ? `#${String(order.orderNumber).padStart(4, "0")}` : `#${order._id.slice(-4).toUpperCase()}`;

    // Standard format: POS #0001 — صالة — آجل | ترابيزة 5
    const [main, extra] = name.split('|').map(s => s.trim());
    const parts = main.split('—').map(p => p.trim());
    
    // parts[0] = POS #0001 (Legacy) or "Online"
    // parts[1] = صالة
    const base = parts.length >= 2 ? `${displayId} — ${parts[1]}` : `${displayId} — ${main}`;
    
    if (extra && extra.includes("ترابيزة")) {
      return `${base} — ${extra.replace("ترابيزة", "طاولة")}`;
    }
    return base;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 font-sans" dir="rtl">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-3 rounded-xl shadow-lg shadow-orange-900/20">
            <ChefHat size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">شاشة تحضير المطبخ (KDS)</h1>
            <p className="text-slate-400 text-sm font-medium">التحكم الفوري في الطلبات • {orders.length} طلب نشط</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">الوقت الحالي</div>
            <div className="text-2xl font-mono font-bold text-orange-500">
              {isMounted ? currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '...'}
            </div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
        
        {/* New Orders Column */}
        <div className="flex flex-col bg-slate-900/30 rounded-3xl border border-slate-800/50 overflow-hidden">
          <div className="bg-gradient-to-l from-orange-600 to-red-600 p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <History size={24} className="text-white animate-pulse" />
              <h2 className="text-xl font-bold text-white">الطلبات الجديدة</h2>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md">
              {newOrders.length} طلب
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {newOrders.map((order) => (
              <div key={order._id} className="bg-slate-900 rounded-2xl border-2 border-orange-500/30 hover:border-orange-500 transition-all duration-300 overflow-hidden shadow-xl group">
                {/* Card Header */}
                <div className="p-4 bg-slate-800/50 flex justify-between items-start border-b border-slate-700/50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">
                        Kitchen Ticket
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white group-hover:text-orange-400 transition-colors leading-tight">
                      {formatOrderHeader(order)}
                    </h3>

                  </div>
                  <div className="text-orange-500 font-bold text-sm bg-orange-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock size={14} />
                    {getTimeElapsed(order.createdAt)}
                  </div>
                </div>


                {/* Card Items */}
                <div className="p-4 space-y-3">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-800/30 p-2 rounded-lg">
                        <span className="text-base text-slate-200 font-medium">{item.name}</span>
                        <span className="text-lg font-black text-white bg-slate-700 w-10 h-10 flex items-center justify-center rounded-lg shadow-inner">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-4 pt-0">
                  <button 
                    onClick={() => updateStatus(order._id, 'جاري التحضير')}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    <Utensils size={24} />
                    بدء التحضير
                  </button>
                </div>
              </div>
            ))}
            {newOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-20">
                <Package size={64} strokeWidth={1} />
                <p className="mt-4 font-medium">لا توجد طلبات جديدة حالياً</p>
              </div>
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="flex flex-col bg-slate-900/30 rounded-3xl border border-slate-800/50 overflow-hidden">
          <div className="bg-gradient-to-l from-blue-600 to-cyan-600 p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-white" />
              <h2 className="text-xl font-bold text-white">جاري التحضير</h2>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md">
              {preparingOrders.length} طلب
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {preparingOrders.map((order) => (
              <div key={order._id} className="bg-slate-900 rounded-2xl border-2 border-blue-500/30 hover:border-blue-500 transition-all duration-300 overflow-hidden shadow-xl group">
                {/* Card Header */}
                <div className="p-4 bg-slate-800/50 flex justify-between items-start border-b border-slate-700/50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-slate-700 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">
                        Kitchen Ticket
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight">
                      {formatOrderHeader(order)}
                    </h3>

                  </div>
                  <div className="text-blue-400 font-bold text-sm bg-blue-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock size={14} />
                    {getTimeElapsed(order.preparingAt || order.createdAt)}
                  </div>
                </div>


                {/* Card Items */}
                <div className="p-4 space-y-3">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-800/30 p-2 rounded-lg">
                        <span className="text-base text-slate-200 font-medium">{item.name}</span>
                        <span className="text-lg font-black text-white bg-slate-700 w-10 h-10 flex items-center justify-center rounded-lg shadow-inner">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-4 pt-0">
                  <button 
                    onClick={() => updateStatus(order._id, 'جاهز')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    <CheckCircle size={24} />
                    جاهز للاستلام
                  </button>
                </div>
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-20">
                <AlertCircle size={64} strokeWidth={1} />
                <p className="mt-4 font-medium">لا توجد طلبات قيد التحضير</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default KDSPage;
