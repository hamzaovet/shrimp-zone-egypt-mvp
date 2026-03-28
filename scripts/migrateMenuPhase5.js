const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://hamzaovet_db_user:8FgowR0m3U5RF0aV@cluster0.nnrm8hu.mongodb.net/bahij_erp?appName=Cluster0";

// Define Schemas locally for the script
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String },
  country: { type: String, enum: ['مصر'], default: 'مصر', required: true },
  isAvailable: { type: Boolean, default: true },
  recipe: [{
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: { type: Number, required: true }
  }]
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

const categoriesData = [
  "الشوربة (أصل الفسفور)",
  "الوجبات الفردية",
  "الطواجن والمكرونات",
  "الصواني (للأكيلة والمجموعات)",
  "الأسماك والجمبري بالكيلو",
  "السندوتشات",
  "السلطات والمقبلات"
];

const menuItemsData = [
  {
    "name": "شوربة بهيج (بيضاء/حمراء)",
    "description": "(جمبري، سبيط، فيليه، كابوريا، جندوفلي)",
    "price": 135,
    "category": "الشوربة (أصل الفسفور)",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "شوربة جمبري (بيضاء/حمراء)",
    "description": "جمبري بخلطة بهيج المميزة",
    "price": 125,
    "category": "الشوربة (أصل الفسفور)",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "شوربة ملوخية بالجمبري",
    "description": "ملوخية مصرية بقطع الجمبري والتقلية",
    "price": 75,
    "category": "الشوربة (أصل الفسفور)",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "شوربة سي فود مخلية",
    "description": "(بدون قشر) بالكريمة أو المرقة",
    "price": 145,
    "category": "الشوربة (أصل الفسفور)",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "وجبة بهيج المقلي",
    "description": "(فيليه، جمبري، سبيط مقلي) + أرز وسلطة",
    "price": 195,
    "category": "الوجبات الفردية",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "وجبة الدنيس",
    "description": "سمكة دنيس (زيت وليمون) + جمبري وسبيط وفيليه + أرز وسلطة",
    "price": 245,
    "category": "الوجبات الفردية",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "وجبة البلطي 'العايمة'",
    "description": "سمكة بلطي مقلية + 2 قطعة جمبري + أرز وسلطة",
    "price": 120,
    "category": "الوجبات الفردية",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "وجبة السوبر شنجربنجو",
    "description": "تشكيلة مشوية (جمبري وفيليه وسبيط خضار) + أرز وسلطة",
    "price": 210,
    "category": "الوجبات الفردية",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "وجبة كينج بهيج",
    "description": "سمكة قاروص سنجاري + جمبري مشوي وسبيط + أرز وسلطة",
    "price": 285,
    "category": "الوجبات الفردية",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طاجن مكرونة سي فود (وايت صوص)",
    "description": "مكرونة بالكريمة والجمبري والسبيط والجبنة",
    "price": 165,
    "category": "الطواجن والمكرونات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طاجن جمبري بالخضار",
    "description": "جمبري مطهو بصلصة بهيج الحمراء والفرن",
    "price": 175,
    "category": "الطواجن والمكرونات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طاجن سبيط (كلماري)",
    "description": "بصوص الطماطم والثوم",
    "price": 160,
    "category": "الطواجن والمكرونات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طاجن فواكه البحر (بهيج)",
    "description": "مشكل سي فود بخلطة 'العو' الخاصة",
    "price": 190,
    "category": "الطواجن والمكرونات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "صينية 'أنا مش خرونج'",
    "description": "(10 جمبري مشوي، 10 مقلي، 10 فراشة، 300 جم جمبري بلدي، كيلو أرز وسلطات)",
    "price": 850,
    "category": "الصواني (للأكيلة والمجموعات)",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "صينية الشيراتون",
    "description": "(سمكة قاروص، 8 جمبري مقلي، 8 مشوي، 2 كابوريا، كلماري، كيلو أرز وسلطات)",
    "price": 1250,
    "category": "الصواني (للأكيلة والمجموعات)",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "صينية الزعفرانة",
    "description": "أرز فتة بصوص الزعفران وقطع الجمبري المشوي",
    "price": 185,
    "category": "الصواني (للأكيلة والمجموعات)",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "جمبري (جامبو / كبير / وسط)",
    "description": "الكيلو - السعر حسب الوزن (طرق الطهي: مقلي، مشوي، مسلوق، فراشة، أو بترفلاي)",
    "price": 0,
    "category": "الأسماك والجمبري بالكيلو",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "سمك بوري",
    "description": "الكيلو - السعر حسب الوزن (سنجاري أو مشوي ردة)",
    "price": 0,
    "category": "الأسماك والجمبري بالكيلو",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "سمك دنيس / قاروص",
    "description": "الكيلو - السعر حسب الوزن (زيت وليمون أو مشوي على الفحم)",
    "price": 0,
    "category": "الأسماك والجمبري بالكيلو",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "سمك بلطي",
    "description": "الكيلو - السعر حسب الوزن (مقلي أو مشوي)",
    "price": 0,
    "category": "الأسماك والجمبري بالكيلو",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "استاكوزا",
    "description": "الكيلو - السعر حسب الوزن (بالزبدة والثوم أو بالبشاميل)",
    "price": 0,
    "category": "الأسماك والجمبري بالكيلو",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "كابوريا / جندوفلي",
    "description": "الكيلو - السعر حسب الوزن (مسلوق بخلطة بهيج)",
    "price": 0,
    "category": "الأسماك والجمبري بالكيلو",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "سندوتش جمبري مقلي",
    "description": "عيش بلدي أو فينو بخلطة بهيج",
    "price": 65,
    "category": "السندوتشات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "سندوتش سبيط مقلي",
    "description": "عيش بلدي أو فينو بخلطة بهيج",
    "price": 60,
    "category": "السندوتشات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "سندوتش فيليه",
    "description": "عيش بلدي أو فينو بخلطة بهيج",
    "price": 50,
    "category": "السندوتشات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "سندوتش 'صاروخ بهيج' (مشكل)",
    "description": "عيش بلدي أو فينو (جمبري، سبيط، فيليه)",
    "price": 85,
    "category": "السندوتشات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "سلطة رنجة",
    "description": "طبق مقبلات رنجة بالخضار",
    "price": 45,
    "category": "السلطات والمقبلات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "أرز صيادية",
    "description": "طبق أرز سمك كلاسيكي",
    "price": 25,
    "category": "السلطات والمقبلات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "أرز بهيج بالخلطة",
    "description": "(أرز بقطع الجمبري والسبيط)",
    "price": 65,
    "category": "السلطات والمقبلات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طبق طحينة",
    "description": "مقبلات طحينة بهيج",
    "price": 15,
    "category": "السلطات والمقبلات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طبق بابا غنوج",
    "description": "مقبلات باذنجان مشوي",
    "price": 15,
    "category": "السلطات والمقبلات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طبق باذنجان مخلل",
    "description": "باذنجان مخلل بالثوم والخل",
    "price": 15,
    "category": "السلطات والمقبلات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طبق سلطة خضراء",
    "description": "خضروات طازجة متنوعة",
    "price": 15,
    "category": "السلطات والمقبلات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  },
  {
    "name": "طبق طماطم متبلة",
    "description": "طماطم بخلطة الثوم والكمون",
    "price": 15,
    "category": "السلطات والمقبلات",
    "imageUrl": "/assets/images/placeholder_dish.png"
  }
];

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  // 1. Clear existing menu data
  await MenuItem.deleteMany({});
  await Category.deleteMany({});
  console.log('Cleared existing MenuItem and Category data.');

  // 2. Create Categories
  const createdCategories = [];
  for (let i = 0; i < categoriesData.length; i++) {
    const catName = categoriesData[i];
    const cat = await Category.create({
      name: catName,
      order: i
    });
    createdCategories.push(cat);
  }
  console.log(`Created ${createdCategories.length} categories.`);

  const catMap = createdCategories.reduce((acc, cat) => {
    acc[cat.name] = cat._id;
    return acc;
  }, {});

  // 3. Create Menu Items
  const itemsToInsert = menuItemsData.map(item => {
    let description = item.description;
    let price = item.price;

    if (price === 0) {
      if (!description.includes('السعر حسب الوزن')) {
        description = `${description} - السعر حسب الوزن`;
      }
    }

    return {
      name: item.name,
      description: description,
      price: price,
      category: catMap[item.category],
      image: item.imageUrl,
      country: 'مصر',
      isAvailable: true
    };
  });

  await MenuItem.insertMany(itemsToInsert);
  console.log(`Inserted ${itemsToInsert.length} menu items.`);

  mongoose.connection.close();
  console.log('Migration complete.');
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
