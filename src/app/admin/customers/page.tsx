"use client";

import { useState, useEffect } from "react";
import { Users, Search, TrendingUp, ShoppingBag, Wallet, ExternalLink, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/exportUtils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["الاسم", "رقم الهاتف", "إجمالي الطلبات", "إجمالي الإنفاق (ج.م)", "تاريخ التسجيل"];
    const data = customers.map(c => [
      c.name,
      c.phone,
      c.totalOrders,
      c.totalSpent,
      new Date(c.createdAt).toLocaleDateString("ar-EG")
    ]);
    exportToExcel(data, headers, "Bahij_Customers_CRM");
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4">
            <Users className="h-10 w-10 text-primary" />
            إدارة العملاء (CRM)
          </h1>
          <p className="text-gray-400 mt-2">تتبع نشاط العملاء وتحديد فئات الـ VIP لعام 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchCustomers} variant="outline" className="border-white/10 text-gray-400 hover:text-white transition-all">
            تحديث البيانات
          </Button>
          <Button 
            onClick={handleExport}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
          >
            تصدير البيانات (Excel)
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-secondary/30 border-white/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> إجمالي المسجلين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{customers.length} <span className="text-sm font-normal text-gray-500">عميل</span></div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30 border-white/10 overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-400 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" /> إجمالي الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{totalOrdersAll} <span className="text-sm font-normal text-gray-500">طلب</span></div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30 border-white/10 overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-400 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-500" /> إجمالي المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-500">{totalSpentAll.toLocaleString()} <span className="text-sm font-normal text-gray-500">ج.م</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="bg-secondary/20 border-white/10 overflow-hidden rounded-[2rem] shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
            <Filter className="h-5 w-5 text-primary" /> قائمة العملاء
          </CardTitle>
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input 
              type="text"
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 text-white focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-gray-500 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              جاري تحميل قاعدة البيانات...
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400">
                  <th className="p-5 font-bold text-sm">العميل</th>
                  <th className="p-5 font-bold text-sm text-center">رقم الهاتف</th>
                  <th className="p-5 font-bold text-sm text-center">الطلبات</th>
                  <th className="p-5 font-bold text-sm text-center">إجمالي الإنفاق</th>
                  <th className="p-5 font-bold text-sm text-center">الحالة</th>
                  <th className="p-5 font-bold text-sm"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredCustomers.map((c, idx) => (
                  <tr key={c._id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black border border-primary/20 transition-transform group-hover:rotate-12">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-black text-base">{c.name}</div>
                          <div className="text-gray-500 text-xs">عضو منذ {new Date(c.createdAt).toLocaleDateString("ar-EG")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-center text-gray-300 font-mono tracking-tighter">{c.phone}</td>
                    <td className="p-5 text-center text-white">{c.totalOrders}</td>
                    <td className="p-5 text-center">
                      <span className="text-green-500 font-black">{c.totalSpent.toLocaleString()} ج.م</span>
                    </td>
                    <td className="p-5 text-center">
                      {idx < 3 ? (
                        <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20 animate-pulse">VIP KING 👑</span>
                      ) : c.totalSpent > 1000 ? (
                        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/20">Loyal Customer</span>
                      ) : (
                        <span className="bg-white/5 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full border border-white/5">Member</span>
                      )}
                    </td>
                    <td className="p-5">
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white hover:bg-white/5 rounded-xl">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredCustomers.length === 0 && (
            <div className="p-20 text-center text-gray-500">
              لا توجد نتائج مطابقة لعملية البحث
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
