"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Wallet, TrendingUp, DollarSign, Receipt, Scale, Plus, 
  ArrowUpCircle, ArrowDownCircle, PieChart, Banknote, CreditCard, 
  CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";

import { EGYPT_BRANCHES } from "@/lib/branches";

const EXPENSE_CATEGORIES = ['مرتبات', 'فواتير', 'مشتريات', 'مصاريف عامة'];
const BRANCHES = ['كل الفروع', ...EGYPT_BRANCHES.map(b => b.label)];

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function AccountingPage() {
  const { data: session } = useSession();
  const [selectedBranch, setSelectedBranch] = useState('كل الفروع');

  const [activeTab, setActiveTab] = useState<'summary' | 'treasury'>('summary');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Expense Form
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "مصاريف عامة", description: "" });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Treasury Form
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [actualBalance, setActualBalance] = useState<number>(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/accounting?branch=${encodeURIComponent(selectedBranch)}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      addToast("فشل تحميل البيانات المالية", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranch === 'كل الفروع') {
      setActiveTab('summary');
    }
    fetchData();
  }, [selectedBranch]);

  const stats = useMemo(() => {
    if (!data) return null;
    const grossProfit = data.totalRevenue - data.totalCogs;
    const netProfit = grossProfit - data.totalExpenses;
    const profitMargin = data.totalRevenue > 0 ? (netProfit / data.totalRevenue) * 100 : 0;
    const foodCostRatio = data.totalRevenue > 0 ? (data.totalCogs / data.totalRevenue) * 100 : 0;
    
    const expectedBalance = Number(openingBalance) + data.cashSales - data.totalExpenses;
    const variance = Number(actualBalance) - expectedBalance;

    return { 
      grossProfit, netProfit, profitMargin, foodCostRatio, 
      expectedBalance, variance 
    };
  }, [data, openingBalance, actualBalance]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) return;
    
    setIsSubmittingExpense(true);
    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_EXPENSE",
          branch: selectedBranch === 'كل الفروع' ? EGYPT_BRANCHES[0].label : selectedBranch,
          amount: Number(expenseForm.amount),
          category: expenseForm.category,
          description: expenseForm.description
        })
      });
      if (res.ok) {
        addToast("تم تسجيل المصروف بنجاح", "success");
        setExpenseForm({ amount: "", category: "مصاريف عامة", description: "" });
        fetchData();
      }
    } catch (e) {
      addToast("فشل حفظ المصروف", "error");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleCloseDay = async () => {
    if (isClosed) return;
    setIsClosing(true);
    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_DAY",
          branch: selectedBranch,
          date: new Date().toISOString().split("T")[0],
          openingBalance: Number(openingBalance),
          cashSales: data.cashSales,
          visaSales: data.visaSales,
          totalExpenses: data.totalExpenses,
          expectedClosingBalance: stats?.expectedBalance,
          actualClosingBalance: Number(actualBalance),
          variance: stats?.variance,
          isClosed: true
        })
      });
      if (res.ok) {
        addToast("تم إغلاق الوردية وحفظ البيانات", "success");
        setIsClosed(true);
      }
    } catch (e) {
      addToast("فشل إغلاق الوردية", "error");
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-gray-400 font-bold">جاري تحميل البيانات المالية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          الحسابات والخزنة
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-64">
             <select
               value={selectedBranch}
               onChange={(e) => setSelectedBranch(e.target.value)}
               className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-3 text-white font-bold appearance-none focus:border-primary outline-none transition-all cursor-pointer shadow-lg"
             >
               {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
             <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 font-bold">⌄</div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              ملخص التشغيل
            </button>
            {selectedBranch !== 'كل الفروع' && (
              <button
                onClick={() => setActiveTab('treasury')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'treasury' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                الخزنة (إغلاق الوردية)
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'summary' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Financial Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-green-500 uppercase mb-2">إجمالي المبيعات</p>
                  <p className="text-3xl font-black text-white">{data.totalRevenue.toLocaleString()} <span className="text-sm text-gray-500 font-medium">ج.م</span></p>
                  <div className="mt-4 flex items-center gap-3 text-[10px] font-bold">
                    <span className="text-gray-400 bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Banknote className="h-3 w-3" /> {data.cashSales.toLocaleString()} كاش
                    </span>
                    <span className="text-gray-400 bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> {data.visaSales.toLocaleString()} فيزا
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-orange-500 uppercase mb-2">تكلفة الخامات (COGS)</p>
                  <p className="text-3xl font-black text-white">{data.totalCogs.toLocaleString()} <span className="text-sm text-gray-500 font-medium">ج.م</span></p>
                  <p className="mt-2 text-[10px] text-gray-500 font-bold">بناءً على وصفات المنيو</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-blue-500 uppercase mb-2">إجمالي المصاريف</p>
                  <p className="text-3xl font-black text-white">{data.totalExpenses.toLocaleString()} <span className="text-sm text-gray-500 font-medium">ج.م</span></p>
                  <p className="mt-2 text-[10px] text-gray-500 font-bold">{data.expenses.length} بنود مسجلة</p>
                </CardContent>
              </Card>
            </div>

            {/* Profit Center */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-secondary/20 border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> مجمل الربح (Gross)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-black text-white">{stats?.grossProfit.toLocaleString()} <span className="text-sm text-gray-500">ج.م</span></p>
                    <p className="text-xs text-gray-500 mt-2 font-bold">(المبيعات - تكلفة الخام)</p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center">
                    <span className="text-primary font-black text-xs">{stats?.profitMargin.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/10 border-2 shadow-[0_0_30px_rgba(255,87,34,0.05)]">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-green-500" /> صافي الربح (Net)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-black text-green-500">{stats?.netProfit.toLocaleString()} <span className="text-sm text-gray-500 font-medium">ج.م</span></p>
                    <p className="text-xs text-gray-500 mt-2 font-bold">(مجمل الربح - المصاريف)</p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-green-500/10 border-4 border-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 font-black text-xs">{stats?.foodCostRatio.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expense List */}
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-red-400" /> قائمة مصروفات اليوم
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="text-right p-4 font-bold text-gray-400 text-xs">الفئة</th>
                        <th className="text-right p-4 font-bold text-gray-400 text-xs">الوصف</th>
                        <th className="text-right p-4 font-bold text-gray-400 text-xs">المبلغ</th>
                        <th className="text-right p-4 font-bold text-gray-400 text-xs">الوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.expenses.map((e: any) => (
                        <tr key={e._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-300 text-[10px] font-bold">{e.category}</span>
                          </td>
                          <td className="p-4 text-gray-400">{e.description || "---"}</td>
                          <td className="p-4 text-white font-black">{e.amount} ج.م</td>
                          <td className="p-4 text-gray-600 text-[10px]">{new Date(e.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                      {data.expenses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-gray-600 font-medium">لا توجد مصروفات مسجلة اليوم</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Add Expense Form */}
          <div className="space-y-6">
            <Card className="bg-secondary/40 border-white/10 sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> تسجيل مصروف جديد
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">المبلغ (ج.م) *</label>
                    <input
                      type="number"
                      required
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">الفئة *</label>
                    <select
                      value={expenseForm.category}
                      onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                    >
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">الوصف / ملاحظات</label>
                    <textarea
                      value={expenseForm.description}
                      onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                      rows={3}
                      placeholder="مثال: فاتورة كهرباء شهر مارس"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingExpense}
                    className="w-full py-4 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-900/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSubmittingExpense ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Plus className="h-5 w-5" /> إضافة المصروف</>}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
           {/* Treasury / Closure Tab */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-secondary/20 border-white/10 overflow-hidden">
                 <CardHeader className="bg-white/5 border-b border-white/5">
                    <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                       <Banknote className="h-5 w-5 text-green-500" /> حركة الدرج اليومية
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-center group">
                       <div className="flex items-center gap-3">
                          <ArrowUpCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-bold text-gray-300">إجمالي المبيعات (كاش)</span>
                       </div>
                       <span className="text-xl font-black text-white">{data.cashSales.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center group">
                       <div className="flex items-center gap-3">
                          <ArrowDownCircle className="h-5 w-5 text-red-500" />
                          <span className="text-sm font-bold text-gray-300">إجمالي المصروفات (خارج)</span>
                       </div>
                       <span className="text-xl font-black text-white">{data.totalExpenses.toLocaleString()} ج.م</span>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                       <span className="text-sm font-black text-gray-500 uppercase tracking-widest">صافي حركة اليوم</span>
                       <span className={`text-2xl font-black ${(data.cashSales - data.totalExpenses) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(data.cashSales - data.totalExpenses).toLocaleString()} ج.م
                       </span>
                    </div>
                 </CardContent>
              </Card>

              <Card className="bg-slate-900 border-primary/20 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Scale className="h-32 w-32" />
                 </div>
                 <CardContent className="p-8 space-y-8">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-500 uppercase">رصيد بداية اليوم *</label>
                       <input 
                          type="number"
                          value={openingBalance}
                          onChange={e => setOpeningBalance(Number(e.target.value))}
                          disabled={isClosed}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-white focus:border-primary outline-none transition-all disabled:opacity-50"
                          placeholder="0.00"
                       />
                    </div>
                    <div className="space-y-4 pt-4">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-400">الرصيد الدفتري المتوقع</span>
                          <span className="text-xl font-black text-white">{stats?.expectedBalance.toLocaleString()} ج.م</span>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-black text-primary uppercase">الرصيد الفعلي بالدرج (جرد) *</label>
                          <input 
                             type="number"
                             value={actualBalance}
                             onChange={e => setActualBalance(Number(e.target.value))}
                             disabled={isClosed}
                             className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-2xl font-black text-white outline-none transition-all disabled:opacity-50 ${isClosed ? 'border-white/10' : 'border-primary shadow-[0_0_20px_rgba(255,87,34,0.1)]'}`}
                             placeholder="المبلغ الفعلي حالياً..."
                          />
                       </div>
                    </div>

                    <div className={`p-6 rounded-2xl border flex items-center justify-between ${stats!.variance < 0 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                       <div className="flex items-center gap-3">
                          {stats!.variance < 0 ? <AlertCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                          <span className="text-sm font-black">العجز / الزيادة</span>
                       </div>
                       <span className="text-2xl font-black">{stats?.variance.toLocaleString()} ج.م</span>
                    </div>

                    <button
                       onClick={handleCloseDay}
                       disabled={isClosing || isClosed}
                       className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 ${isClosed ? "bg-green-600/20 text-green-400 border border-green-500/20" : "bg-primary hover:bg-orange-600 text-white shadow-orange-900/30"}`}
                    >
                       {isClosing ? <Loader2 className="h-6 w-6 animate-spin" /> : isClosed ? <><CheckCircle2 className="h-6 w-6" /> تم إغلاق اليوم بنجاح</> : "إغلاق وردية اليوم وتصفية الخزنة"}
                    </button>
                 </CardContent>
              </Card>
           </div>
        </div>
      )}

      {/* Toasts Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl min-w-[300px] animate-in slide-in-from-right-full duration-300 pointer-events-auto border-2 ${
              toast.type === "success" 
                ? "bg-slate-900 border-green-500/50 text-white" 
                : "bg-slate-900 border-red-500/50 text-red-500"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
            <p className="text-sm font-bold flex-1">{toast.message}</p>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <Plus className="h-4 w-4 rotate-45" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
