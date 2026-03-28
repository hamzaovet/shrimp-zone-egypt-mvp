"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Package, Plus, Search, Edit2, Trash2, X, 
  AlertTriangle, TrendingUp, Layers, PackageCheck, DollarSign
} from "lucide-react";

interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  stock: number;
  minStockLevel: number;
  costPerUnit: number;
  updatedAt: string;
}

interface InventoryMovement {
  _id: string;
  type: 'OPENING' | 'IN' | 'OUT';
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string;
  date: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // AIS States
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [fetchingMovements, setFetchingMovements] = useState(false);

  const [addStockData, setAddStockData] = useState({
    quantityAdded: 0,
    newUnitCost: 0
  });

  const [deductData, setDeductData] = useState({
    quantityRemoved: 0,
    reason: "هالك"
  });

  const [formData, setFormData] = useState({
    name: "",
    unit: "جرام",
    stock: 0,
    minStockLevel: 0,
    costPerUnit: 0
  });

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchItems();
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const totalValue = items.reduce((acc, item) => acc + (item.stock * item.costPerUnit), 0);
  const totalItems = items.length;
  const lowStockCount = items.filter(i => i.stock <= (i.minStockLevel || 0)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const url = editingItem ? `/api/inventory/${editingItem._id}` : "/api/inventory";
    const method = editingItem ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        showToast(editingItem ? "تم تحديث الخامة بنجاح" : "تم إضافة الخامة بنجاح", "success");
        setShowModal(false);
        setEditingItem(null);
        setFormData({ name: "", unit: "جرام", stock: 0, minStockLevel: 0, costPerUnit: 0 });
        fetchItems();
      } else {
        const data = await res.json();
        showToast(data.error || "فشلت العملية", "error");
      }
    } catch (error) {
      showToast("حدث خطأ في الخادم", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخامة نهائياً؟")) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("تم حذف الخامة بنجاح", "success");
        fetchItems();
      }
    } catch (error) {
      showToast("فشل الحذف", "error");
    }
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      stock: item.stock,
      minStockLevel: item.minStockLevel || 0,
      costPerUnit: item.costPerUnit
    });
    setShowModal(true);
  };

  const openAddStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAddStockData({ quantityAdded: 0, newUnitCost: item.costPerUnit });
    setShowAddStockModal(true);
  };

  const openDeduct = (item: InventoryItem) => {
    setSelectedItem(item);
    setDeductData({ quantityRemoved: 0, reason: "هالك" });
    setShowDeductModal(true);
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/inventory/${selectedItem._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "ADD_STOCK",
          ...addStockData
        })
      });

      if (res.ok) {
        showToast(`✅ تم إضافة ${addStockData.quantityAdded} ${selectedItem.unit} بنجاح`, "success");
        setShowAddStockModal(false);
        fetchItems();
      } else {
        showToast("فشل إضافة المخزون", "error");
      }
    } catch (error) {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/inventory/${selectedItem._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "DEDUCT_STOCK",
          ...deductData
        })
      });

      if (res.ok) {
        showToast(`📉 تم خصم ${deductData.quantityRemoved} ${selectedItem.unit} بنجاح`, "info");
        setShowDeductModal(false);
        fetchItems();
      } else {
        showToast("فشل خصم المخزون", "error");
      }
    } catch (error) {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openLedger = async (item: InventoryItem) => {
    setSelectedItem(item);
    setMovements([]);
    setFetchingMovements(true);
    setShowLedgerModal(true);
    
    try {
      const res = await fetch(`/api/inventory/${item._id}/movements`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data);
      }
    } catch (error) {
      showToast("فشل جلب سجل الحركة", "error");
    } finally {
      setFetchingMovements(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-white p-4 lg:p-8 overflow-x-hidden" dir="rtl">
      
      {/* Toast Notifications */}
      <div className="fixed top-6 left-6 z-[600] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-left-full duration-300 ${
              toast.type === "success" ? "bg-green-500/20 border-green-500/40 text-green-300" :
              toast.type === "error" ? "bg-red-500/20 border-red-500/40 text-red-300" :
              "bg-blue-500/20 border-blue-500/40 text-blue-300"
            }`}
          >
            {toast.type === "success" ? <PackageCheck className="h-5 w-5" /> : toast.type === "error" ? <AlertTriangle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            <p className="text-sm font-black tracking-wide">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/20 rounded-2xl border border-primary/20">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">إدارة المخزون والخامات</h1>
            <p className="text-gray-500 font-bold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" /> متابعة رصيد المخزن والتحكم في الخامات
            </p>
          </div>
        </div>

        <button 
          onClick={() => { setShowModal(true); setEditingItem(null); setFormData({ name: "", unit: "جرام", stock: 0, minStockLevel: 0, costPerUnit: 0 }); }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl shadow-primary/20"
        >
          <Plus className="h-6 w-6" /> إضافة خامة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <p className="text-gray-500 text-xs font-black uppercase mb-2">إجمالي الأصناف</p>
          <p className="text-3xl font-black text-white">{totalItems}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <p className="text-gray-500 text-xs font-black uppercase mb-2">إجمالي قيمة المخزون</p>
          <p className="text-3xl font-black text-primary">
            {isMounted ? totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'} ج.م
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 border-red-500/20 bg-red-500/5">
          <p className="text-red-500/60 text-xs font-black uppercase mb-2">نواقص (تحت حد الأمان)</p>
          <p className="text-3xl font-black text-red-500">{lowStockCount}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <Search className="h-5 w-5 text-gray-500 mb-3" />
          <input 
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-white font-bold placeholder:text-gray-700 h-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-5 text-gray-500 text-xs font-black uppercase tracking-wider">الخامة</th>
                <th className="px-6 py-5 text-gray-500 text-xs font-black uppercase tracking-wider">الوحدة</th>
                <th className="px-6 py-5 text-gray-500 text-xs font-black uppercase tracking-wider">الرصيد</th>
                <th className="px-6 py-5 text-gray-500 text-xs font-black uppercase tracking-wider">حد الأمان</th>
                <th className="px-6 py-5 text-gray-500 text-xs font-black uppercase tracking-wider">التكلفة</th>
                <th className="px-6 py-5 text-gray-500 text-xs font-black uppercase tracking-wider">القيمة</th>
                <th className="px-6 py-5 text-gray-500 text-xs font-black uppercase tracking-wider text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-600 font-bold">لاتوجد بيانات</td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5 font-black text-white">{item.name}</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-gray-400 text-[11px] font-black">{item.unit}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className={`text-base font-black ${item.stock <= (item.minStockLevel || 0) ? 'text-red-500' : 'text-white'}`}>
                        {item.stock}
                        {item.stock <= (item.minStockLevel || 0) && <AlertTriangle className="h-4 w-4 inline-block mr-2 animate-pulse" />}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-gray-500 font-bold text-sm">
                      {item.minStockLevel || 0}
                    </td>
                    <td className="px-6 py-5 text-gray-400 font-bold text-sm">{item.costPerUnit.toFixed(3)} ج.م</td>
                    <td className="px-6 py-5 text-primary font-black text-base">
                      {isMounted ? (item.stock * item.costPerUnit).toLocaleString('ar-EG') : '...'} ج.م
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openAddStock(item)} title="إضافة وارد" className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white transition-all"><Plus className="h-4 w-4" /></button>
                        <button onClick={() => openDeduct(item)} title="تسوية / هالك" className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                        <button onClick={() => openLedger(item)} title="سجل الحركة" className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-all"><TrendingUp className="h-4 w-4" /></button>
                        <button onClick={() => openEdit(item)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(item._id)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D152B] border border-slate-700/50 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden shadow-primary/20">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <h2 className="text-xl font-black text-white">{editingItem ? 'تعديل خامة' : 'إضافة خامة جديدة'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-black uppercase mb-1 block">الاسم</label>
                  <input required className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl p-4 text-white font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-black uppercase mb-1 block">الوحدة</label>
                    <select className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl p-4 text-white font-bold" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                      <option value="جرام">جرام</option><option value="كيلو">كيلو</option><option value="قطعة">قطعة</option><option value="لتر">لتر</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-black uppercase mb-1 block">حد الأمان</label>
                    <input required type="number" className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl p-4 text-white font-bold" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-black uppercase mb-1 block">الرصيد</label>
                    <input required type="number" step="0.01" className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl p-4 text-white font-bold" value={formData.stock} onChange={e => setFormData({...formData, stock: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-black uppercase mb-1 block">التكلفة</label>
                    <input required type="number" step="0.01" className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl p-4 text-white font-bold" value={formData.costPerUnit} onChange={e => setFormData({...formData, costPerUnit: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-800 text-white font-black">إلغاء</button>
                <button type="submit" disabled={submitting} className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black">{submitting ? 'جاري الحفظ...' : 'حفظ البيانات'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && selectedItem && (
        <div className="fixed inset-0 z-[550] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0D152B] border border-slate-700/50 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-orange-500/10">
              <h2 className="text-xl font-black text-white">إضافة وارد: {selectedItem.name}</h2>
              <button onClick={() => setShowAddStockModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleAddStockSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-black mb-1 block font-mono">الكمية القادمة ({selectedItem.unit})</label>
                  <input required type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-black text-2xl" value={addStockData.quantityAdded} onChange={e => setAddStockData({...addStockData, quantityAdded: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-black mb-1 block font-mono">سعر شراء الوحدة (Cost)</label>
                  <input required type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-black text-2xl" value={addStockData.newUnitCost} onChange={e => setAddStockData({...addStockData, newUnitCost: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <button disabled={submitting} type="submit" className="w-full py-5 rounded-2xl bg-orange-500 text-white font-black shadow-xl shadow-orange-500/20">{submitting ? 'جاري المعالجة...' : 'تحديث المخزن والتكلفة'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Item Ledger Modal */}
      {showLedgerModal && selectedItem && (
        <div className="fixed inset-0 z-[550] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0D152B] border border-slate-700/50 rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-purple-500/10">
              <h2 className="text-xl font-black text-white">حركة الصنف: {selectedItem.name}</h2>
              <button onClick={() => setShowLedgerModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 lg:p-8">
              {fetchingMovements ? (
                <div className="py-20 text-center"><div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : (
                <table className="w-full text-right border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest px-4">
                      <th className="pr-4 py-4 text-right">التاريخ</th>
                      <th className="py-4 text-center">النوع</th>
                      <th className="py-4 text-right">الكمية</th>
                      <th className="py-4 text-right">التكلفة</th>
                      <th className="py-4 text-right">الإجمالي</th>
                      <th className="pl-4 py-4 text-right">المرجع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(m => (
                      <tr key={m._id} className="bg-slate-900/40 hover:bg-slate-800 transition-colors text-sm">
                        <td className="py-4 pr-4 rounded-r-2xl text-gray-400 text-right">
                          {new Date(m.date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black ${m.type === 'IN' ? 'bg-green-500/10 text-green-400' : m.type === 'OUT' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {m.type === 'IN' ? 'وارد' : m.type === 'OUT' ? 'منصرف' : 'رصيد أول'}
                          </span>
                        </td>
                        <td className={`py-4 text-right font-black ${m.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                          {m.type === 'IN' ? '+' : '-'}{m.quantity}
                        </td>
                        <td className="py-4 text-right text-gray-400">{m.unitCost.toFixed(3)} ج.م</td>
                        <td className="py-4 text-right font-black text-white">{m.totalCost.toFixed(2)} ج.م</td>
                        <td className="py-4 pl-4 rounded-l-2xl text-right text-primary font-bold text-xs">
                          {m.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Stock Deduction Modal (Phase 8 Adjustments) */}
      {showDeductModal && selectedItem && (
        <div className="fixed inset-0 z-[550] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0D152B] border border-red-500/20 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-red-500/10">
              <h2 className="text-xl font-black text-white">تسوية / خصم: {selectedItem.name}</h2>
              <button onClick={() => setShowDeductModal(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleDeductSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-black mb-1 block">الكمية المخصومة ({selectedItem.unit})</label>
                  <input required type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-black text-2xl" value={deductData.quantityRemoved} onChange={e => setDeductData({...deductData, quantityRemoved: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-black mb-1 block">سبب الخصم (نوع التسوية)</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-black text-sm" value={deductData.reason} onChange={e => setDeductData({...deductData, reason: e.target.value})}>
                    <option value="هالك">🥀 هالك (Spoilage)</option>
                    <option value="مرتجع لمورد">🔙 مرتجع لمورد (Return to Supplier)</option>
                    <option value="تسوية جرد">📊 تسوية جرد (Inventory Correction)</option>
                  </select>
                </div>
              </div>
              <button disabled={submitting} type="submit" className="w-full py-5 rounded-2xl bg-red-600 text-white font-black shadow-xl shadow-red-600/20">
                {submitting ? 'جاري المعالجة...' : 'تأكيد التسوية والخصم 🚨'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
