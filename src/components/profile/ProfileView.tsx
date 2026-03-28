import { useState, useEffect } from "react";
import { User, Package, MapPin, LogOut, ChevronLeft, Bell, Phone, UserPlus, History, Wallet, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { useCustomerAuth } from "@/lib/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { useNavigation } from "@/lib/NavigationContext";

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderNumber?: number;
}

const STATUS_LABELS: Record<string, string> = {
  "جديد": "جديد",
  "جاري التحضير": "جاري التحضير",
  "جاهز": "جاهز",
  "خرج للتوصيل": "في الطريق",
  "تم التسليم": "تم الاستلام",
  "ملغي": "ملغي",
  "Pending": "قيد الانتظار",
};

export default function ProfileView() {
  const { customer, login, logout, isLoading } = useCustomerAuth();
  const { setActiveTab } = useNavigation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  const [funMsg, setFunMsg] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer?.phone) return;
      setIsFetchingOrders(true);
      try {
        const res = await fetch(`/api/orders?phone=${encodeURIComponent(customer.phone)}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setIsFetchingOrders(false);
      }
    };

    fetchOrders();
  }, [customer?.phone]);

  const comingSoon = () => {
    setFunMsg(true);
    setTimeout(() => setFunMsg(false), 4000);
  };

  const totalSpent = orders
    .filter(o => o.status !== "ملغي")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(name, phone);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الدخول");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="pb-32 pt-10 px-6 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">انضم لعائلة شرمب زون</h2>
          <p className="text-gray-400 text-sm">سجل دخولك برقم هاتفك لمتابعة طلباتك وعروضك</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300 mr-2">الاسم بالكامل</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ادخل اسمك هنا"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300 mr-2">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 outline-none transition-all"
                required
              />
            </div>
          </div>

          {error && <p className="text-destructive text-sm font-bold text-center">{error}</p>}

          <Button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-black text-lg h-16 rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95"
          >
            دخول / تسجيل
          </Button>
        </form>

        <p className="mt-8 text-center text-[10px] text-gray-500 leading-relaxed px-4">
          بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية لمطاعم شرمب زون ملك الجمبري.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-6 px-4 max-w-md mx-auto">
      {/* Header/Greeting */}
      <div className="flex items-center gap-4 mb-8 bg-[#0A1128]/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 rotate-3 group-hover:rotate-12 transition-transform">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div className="z-10">
          <h2 className="text-2xl font-black text-white">أهلاً بك، {customer.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">عميل VIP</span>
            <span className="text-gray-400 text-[10px] font-medium">{customer.phone}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards - Hidden if 0 to keep it clean */}
      {orders.length > 0 && totalSpent > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <History className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-black text-white">{orders.length}</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">إجمالي الطلبات</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/5 p-4 rounded-2xl">
            <div className="bg-green-500/10 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
              <Wallet className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-black text-white">{totalSpent} <span className="text-xs">ج.م</span></div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">إجمالي المدفوعات</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Recent Orders Link */}
        <section className="bg-secondary/20 border border-white/5 rounded-[1.5rem] overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-white font-black text-base">طلباتك الأخيرة</span>
            </div>
            {orders.length > 5 && <Link href="/orders/all" className="text-primary text-xs font-bold">عرض الكل</Link>}
          </div>
          
          <div className="bg-white/5">
            {isFetchingOrders ? (
              <div className="p-12 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500 text-xs">جاري تحميل طلباتك...</p>
              </div>
            ) : orders.length > 0 ? (
              <div className="divide-y divide-white/5">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="p-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">طلب #{order.orderNumber || order._id.slice(-6).toUpperCase()}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleDateString("ar-EG")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left flex flex-col items-end gap-1">
                      <div className="text-sm font-black text-primary">{order.totalAmount} ج.م</div>
                      <Link 
                        href={`/orders/${order._id}/status`}
                        className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full hover:bg-green-500/20 transition-colors"
                      >
                        {STATUS_LABELS[order.status] || order.status}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Package className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  بحر الجمبري بيناديك! <br/>
                  سجل أول طلب ليك دلوقتي وشوفه هنا.
                </p>
                <Button 
                  onClick={() => setActiveTab('home')}
                  className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-black px-8 py-6 h-auto shadow-lg shadow-primary/20"
                >
                  اطلب الآن 🍤
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Menu List */}
        <section className="bg-white/5 border border-white/5 rounded-[1.5rem] overflow-hidden shadow-xl">
          <div className="p-2">
            <button 
              onClick={comingSoon}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-xl group/btn"
            >
              <div className="flex items-center gap-3 text-gray-300 group-hover/btn:text-white transition-colors">
                <MapPin className="h-5 w-5" />
                <span className="text-sm font-bold">عناوين التوصيل</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            
            <button 
              onClick={comingSoon}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-xl group/btn"
            >
              <div className="flex items-center gap-3 text-gray-300 group-hover/btn:text-white transition-colors">
                <Bell className="h-5 w-5" />
                <span className="text-sm font-bold">الإشعارات</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>

            <button 
              onClick={logout}
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors rounded-xl group/btn"
            >
              <div className="flex items-center gap-3 text-destructive/70 group-hover/btn:text-destructive transition-colors">
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-bold">تسجيل الخروج</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-destructive/40" />
            </button>
          </div>
        </section>
      </div>

      <div className="mt-12 text-center text-[10px] text-gray-700 font-black uppercase tracking-[0.2em]">
        Shrimp Zone — شرمب زون
      </div>

      {/* Custom Fun Toast */}
      {funMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="bg-[#0A1128] border border-primary/40 p-6 rounded-[2rem] shadow-[0_0_40px_rgba(255,87,34,0.3)] text-center relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <p className="text-white font-bold text-sm leading-relaxed">
              الطيارين بتوعنا بيطبخوا الميزة دي على نار هادية.. اتقل تاخد شغل نضيف! 🚀👨‍🍳
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
