export function getStrictCategory(item: any): string {
  const dbCat = item.category?.name || item.category;
  if (dbCat && typeof dbCat === 'string' && dbCat.trim() !== '') return dbCat;
  
  const n = (item.name || '').toLowerCase();
  
  // 1. Drinks
  if (n.includes('ليمون نعناع') || n.includes('غازي') || n.includes('مياه') || n.includes('شاي') || n.includes('قهوة') || n.includes('اسبريسو') || n.includes('مشروب')) return 'المشروبات';
  // 2. Sandwiches (Must catch BEFORE sauces/appetizers)
  if (n.includes('ساندوتش') || n.includes('فينو') || n.includes('بلدي')) return 'السندوتشات';
  // 3. Trays & Offers
  if (n.includes('المفترى') || n.includes('العتاولة') || n.includes('الهنا') || (n.includes('هاني فود') && !n.includes('صنية') && !n.includes('صينية') && !n.includes('طاجن') && !n.includes('شوربة') && !n.includes('باستا'))) return 'قسم الميني صواني';
  if (n.includes('بلا بينا') || n.includes('الفياجرا') || n.includes('البترفلاي') || n.includes('شرمباوي') || n.includes('مزاجنجي') || n.includes('تورتة') || n.includes('شرمب زون') || n.includes('المزاج العالي') || n.includes('عم المجال') || n.includes('نمبر وان')) return 'عرض الصواني';
  if (n.includes('صنية') || n.includes('صينية') || n.includes('الكيس الحراري')) return 'الصواني';
  // 4. Soups
  if (n.includes('شوربة') || n.includes('ملوخية') || n.includes('شوت') || n.includes('توت')) return 'الشوربة';
  // 5. Casseroles
  if (n.includes('طاجن') || n.includes('وايت صوص') || n.includes('صيادية')) return 'الطواجن';
  // 6. Pasta & Rice
  if (n.includes('باستا')) return 'الباستا';
  if (n.includes('أرز') || n.includes('رز')) return 'الأرز';
  // 7. Salads & Sauces (Safe to run now, sandwiches are already caught)
  if (n.includes('طحينة') || n.includes('بابا غنوج') || n.includes('سلطة') || n.includes('مخلل') || n.includes('رنجة') || n.includes('ثومية') || n.includes('صوص') || n.includes('جرجير') || n.includes('كفر عيش')) return 'السلطات والصوصات';
  // 8. Appetizers
  if (n.includes('فرايز') || n.includes('دايناميت') || n.includes('تارتار') || n.includes('مايونيز')) return 'المقبلات';
  // 9. Main Meals (Fallback)
  return 'قسم الوجبات';
}
