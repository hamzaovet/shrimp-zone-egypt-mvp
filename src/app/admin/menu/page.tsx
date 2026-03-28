"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Plus, Trash2, Edit, Upload, ImageIcon, List, Package, ChevronDown } from "lucide-react";
import { getStrictCategory } from "@/lib/menuUtils";

export default function MenuManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [activeCategory, setActiveCategory] = useState("الكل");
  
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', image: '', country: 'مصر',
    recipe: [] as { ingredientId: string, quantity: number }[]
  });

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventoryItems(data);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/menu/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchInventory();
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditItemId(null);
    setFormData({ 
      name: '', description: '', price: '', category: '', image: '', country: 'مصر',
      recipe: []
    });
    setUploadError("");
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditItemId(item._id);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category?._id || item.category,
      image: item.image || '',
      country: item.country,
      recipe: item.recipe || []
    });
    setUploadError("");
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الصنف النهائي؟")) return;
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const body = new FormData();
      body.append("image", file);

      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
        { method: "POST", body }
      );

      if (!res.ok) throw new Error("فشل رفع الصورة. تحقق من مفتاح API.");

      const json = await res.json();
      const url = json?.data?.display_url;

      if (!url) throw new Error("لم يتم العثور على رابط الصورة في الاستجابة.");

      setFormData(prev => ({ ...prev, image: url }));
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "حدث خطأ أثناء رفع الصورة.");
    } finally {
      setIsUploading(false);
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      recipe: [...prev.recipe, { ingredientId: '', quantity: 0 }]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipe: prev.recipe.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newRecipe = [...prev.recipe];
      newRecipe[index] = { ...newRecipe[index], [field]: value };
      return { ...prev, recipe: newRecipe };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, price: Number(formData.price) };
      if (editItemId) {
        await fetch(`/api/menu/${editItemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      fetchMenu();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrency = () => 'EGP';
  const getFlag = () => '🇪🇬';

  // ── Robust Grouping Logic (Strict Fallback Pattern) ──
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const catName = getStrictCategory(item);
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }, [items]);

  // Dynamically derive category list from the actual items + "الكل"
  const categoryList = useMemo(() => {
    const uniqueCats = Array.from(new Set(items.map(i => getStrictCategory(i))));
    return ['الكل', ...uniqueCats.sort()];
  }, [items]);

  // Handle filtering for Admin view
  const displayedItems = useMemo(() => {
    if (activeCategory === "الكل") return items;
    return items.filter(item => getStrictCategory(item) === activeCategory);
  }, [items, activeCategory]);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          إدارة المنيو
        </h1>
        <Button onClick={openAddModal} className="bg-[#FF5722] hover:bg-[#FF5722]/90 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-transform hover:scale-105">
          <Plus className="h-5 w-5" /> إضافة صنف جديد
        </Button>
      </div>

      {/* ── Physically Rendered Category Tabs (Non-Negotiable UI) ── */}
      <div className="relative z-40 bg-background/40 backdrop-blur-xl py-4 border-b border-white/5 no-scrollbar">
        <div className="flex overflow-x-auto flex-nowrap gap-3 no-scrollbar pb-2">
          {categoryList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 active:scale-95 border ${
                activeCategory === cat
                  ? "bg-[#F97316] text-white border-[#F97316] shadow-lg shadow-primary/20"
                  : "bg-white/5 text-gray-400 border-white/5 hover:border-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {loading ? (
          <div className="text-center text-gray-400 py-20 flex flex-col items-center gap-6">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20" />
            <span className="text-lg font-bold">جاري تحميل قائمة المنيو...</span>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Context Header */}
            <div className="flex items-center gap-6 opacity-60">
                <h2 className="text-2xl font-black text-white whitespace-nowrap">
                   {activeCategory}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                   {displayedItems.length} صنف
                </span>
            </div>

            {/* Main Item Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {displayedItems.map((item: any) => (
                <Card key={item._id} className="bg-secondary/20 border-white/5 overflow-hidden hover:border-primary/30 transition-all duration-300 flex flex-col group backdrop-blur-sm rounded-[1.5rem] shadow-xl">
                  {item.image && (
                    <div className="h-48 w-full bg-white/5 overflow-hidden relative">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" 
                      />
                      <div className="absolute top-4 right-4">
                         <span className="text-[10px] font-black text-white bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg">
                           {item._id.slice(-6).toUpperCase()}
                         </span>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div className="flex flex-col gap-2 items-start">
                        <h3 className="text-xl font-black text-white leading-tight group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        {item.recipe && item.recipe.length > 0 && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-green-400 bg-green-400/10 px-2.5 py-1 rounded-lg border border-green-400/20 shadow-sm shadow-green-400/10">
                            <Package className="h-3 w-3" /> ريسبي مفعل ✓
                          </span>
                        )}
                      </div>
                      <div className="text-primary font-black bg-primary/10 px-4 py-2 rounded-xl text-lg shadow-inner border border-primary/10">
                        {item.price} <span className="text-xs opacity-70">{getCurrency()}</span>
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm font-medium mt-auto mb-6">
                      <span className="bg-white/5 text-gray-400 px-3 py-1.5 rounded-full text-xs border border-white/5">
                        {getStrictCategory(item)}
                      </span>
                      <span className="text-gray-500 flex items-center gap-2 text-xs font-bold">
                        {getFlag()} {item.country}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                      <button 
                        onClick={() => openEditModal(item)} 
                        className="h-11 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all bg-primary/5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/5 active:scale-95"
                      >
                        <Edit className="h-4 w-4" /> تعديل
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)} 
                        className="h-11 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-destructive/5 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" /> حذف
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A1128] border border-white/10 w-full max-w-xl rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-white mb-6 animate-in slide-in-from-bottom flex items-center gap-2">
              {editItemId ? <Edit className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
              {editItemId ? "تعديل الصنف" : "إضافة صنف جديد للـ Menu"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-bottom duration-300">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">اسم الصنف</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="مثال: جمبري دايناميت" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">السعر</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="0.00" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">القسم (Category)</label>
                  <select 
                    required 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full bg-[#0A1128] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>اختر القسم...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الوصف</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none" placeholder="اكتب تفاصيل أو مكونات الطبق هنا..." />
              </div>

              {/* ── Recipe Builder (Phase 3) ── */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                    <List className="h-4 w-4" /> مكونات الوصفة (الريسبي)
                  </h3>
                  <Button 
                    type="button" 
                    onClick={addIngredient}
                    size="sm" 
                    className="h-8 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg flex gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> إضافة مكون
                  </Button>
                </div>

                {formData.recipe.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4 bg-black/20 rounded-xl border border-dashed border-white/5">
                    لا توجد مكونات مضافة حالياً.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.recipe.map((row, idx) => {
                      const selectedInv = inventoryItems.find(inv => inv._id === row.ingredientId);
                      return (
                        <div key={idx} className="flex gap-2 items-end animate-in fade-in slide-in-from-right-2 duration-200">
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-500 mb-1 block">الخامة</label>
                            <div className="relative">
                              <select
                                required
                                value={row.ingredientId}
                                onChange={(e) => updateIngredient(idx, 'ingredientId', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-primary appearance-none"
                              >
                                <option value="" disabled>اختر خامة...</option>
                                {inventoryItems.map(inv => (
                                  <option key={inv._id} value={inv._id}>{inv.name}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />
                            </div>
                          </div>
                          
                          <div className="w-24">
                            <label className="text-[10px] text-gray-500 mb-1 block">الكمية</label>
                            <div className="relative">
                              <input
                                required
                                type="number"
                                step="0.01"
                                value={row.quantity}
                                onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div className="w-16 flex flex-col justify-end pb-2">
                             <span className="text-[10px] text-gray-400 font-bold text-center">
                               {selectedInv?.unit || '—'}
                             </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeIngredient(idx)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all mb-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">صورة الصنف</label>
                <div className="relative">
                  <label
                    htmlFor="image-upload"
                    className={`flex items-center justify-center gap-3 w-full bg-white/5 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-all hover:border-primary/50 hover:bg-white/10 ${
                      isUploading ? 'border-primary/40 animate-pulse' : 'border-white/10'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-primary font-bold text-sm">جاري رفع الصورة...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-400 text-sm">اضغط لاختيار صورة أو اسحبها هنا</span>
                      </>
                    )}
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>

                {uploadError && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">⚠️ {uploadError}</p>
                )}

                {formData.image && !isUploading && (
                  <div className="mt-3 relative group">
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-white/5">
                      <img src={formData.image} alt="معاينة" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold flex items-center gap-1"><ImageIcon className="h-4 w-4" /> تم الرفع بنجاح ✓</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="absolute top-2 left-2 bg-destructive/80 hover:bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              
              <input type="hidden" value="مصر" />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الدولة</label>
                <div className="w-full bg-[#121b36] border border-white/10 rounded-xl px-4 py-3 text-white flex items-center gap-2">
                  🇪🇬 مصر
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                <Button type="button" onClick={() => setModalOpen(false)} variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5 rounded-xl">إلغاء</Button>
                <Button type="submit" disabled={isSubmitting || isUploading} className="bg-[#FF5722] hover:bg-[#FF5722]/90 text-white font-bold px-8 rounded-xl h-11 transition-transform hover:scale-[1.02]">
                  {isSubmitting ? "جاري الحفظ..." : (editItemId ? "تحديث الصنف" : "إضافة الصنف")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
