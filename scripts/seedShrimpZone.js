const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://hamzaovet_db_user:8FgowR0m3U5RF0aV@cluster0.nnrm8hu.mongodb.net/shrimp_zone_erp?appName=Cluster0";

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true },
  stock: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  branch: { type: String, required: true, unique: true },
  lastShiftCloseTimestamp: { type: Date, default: () => new Date(0) },
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String },
  country: { type: String, enum: ['مصر'], default: 'مصر', required: true },
  isAvailable: { type: Boolean, default: true },
  recipe: [{
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: { type: Number, required: true }
  }]
}, { timestamps: true });

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'cashier'], default: 'user' },
  assignedBranch: { type: String, default: '' },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Connecting to MongoDB (Shrimp Zone ERP)...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  // 1. Clear existing data in the NEW database (safety first)
  await Inventory.deleteMany({});
  await MenuItem.deleteMany({});
  await User.deleteMany({});
  await Settings.deleteMany({});
  console.log('Cleared existing data.');

  // 1.1 Seed Admin User
  const hashedHamza = await bcrypt.hash('shrimp_king_2026', 10);
  await User.create({
    name: 'Dr. Hamza',
    email: 'dr.hamza@fmw.com',
    password: hashedHamza,
    role: 'admin'
  });
  console.log('Seeded Master Admin: dr_hamza');

  // 2. Seed Ingredients (Inventory)
  const ingredients = await Inventory.insertMany([
    { name: 'جمبري جامبو', unit: 'جرام', stock: 50000, costPerUnit: 0.8 },
    { name: 'جمبري وسط', unit: 'جرام', stock: 100000, costPerUnit: 0.4 },
    { name: 'سمك بلطي', unit: 'قطعة', stock: 500, costPerUnit: 45 },
    { name: 'سمك فيليه', unit: 'جرام', stock: 20000, costPerUnit: 0.2 },
    { name: 'كاليماري', unit: 'جرام', stock: 15000, costPerUnit: 0.35 },
    { name: 'سلطعون (كابوريا)', unit: 'قطعة', stock: 300, costPerUnit: 60 },
    { name: 'محار (جندوفلي)', unit: 'جرام', stock: 10000, costPerUnit: 0.15 },
    { name: 'أرز ريزو', unit: 'جرام', stock: 200000, costPerUnit: 0.02 },
    { name: 'مكرونة قلم', unit: 'جرام', stock: 50000, costPerUnit: 0.015 },
    { name: 'كريمة طهي', unit: 'مل', stock: 10000, costPerUnit: 0.12 },
    { name: 'خبز صاروخ', unit: 'قطعة', stock: 1000, costPerUnit: 5 },
  ]);

  const ingMap = ingredients.reduce((acc, ing) => ({ ...acc, [ing.name]: ing._id }), {});

  // 3. Seed Menu Items
  const menuItems = [
    // الشوربة
    {
      name: 'شوربة شرمب زون',
      price: 135,
      category: 'الشوربة',
      description: 'أقوى شوربة جمبري في الشرق الأوسط',
      recipe: [
        { ingredientId: ingMap['جمبري وسط'], quantity: 150 },
        { ingredientId: ingMap['كاليماري'], quantity: 50 },
        { ingredientId: ingMap['كريمة طهي'], quantity: 100 }
      ]
    },
    {
      name: 'شوربة ملوخية بالجمبري',
      price: 75,
      category: 'الشوربة',
      recipe: [
        { ingredientId: ingMap['جمبري وسط'], quantity: 100 }
      ]
    },
    // الوجبات الفردية
    {
      name: 'وجبة شرمب زون المقلي',
      price: 195,
      category: 'الوجبات الفردية',
      recipe: [
        { ingredientId: ingMap['سمك فيليه'], quantity: 250 },
        { ingredientId: ingMap['أرز ريزو'], quantity: 300 }
      ]
    },
    // الطواجن والمكرونات
    {
      name: 'طاجن مكرونة سي فود (وايت صوص)',
      price: 165,
      category: 'الطواجن والمكرونات',
      recipe: [
        { ingredientId: ingMap['مكرونة قلم'], quantity: 400 },
        { ingredientId: ingMap['جمبري وسط'], quantity: 100 },
        { ingredientId: ingMap['كاليماري'], quantity: 50 },
        { ingredientId: ingMap['كريمة طهي'], quantity: 200 }
      ]
    },
    // الصواني
    {
      name: 'صينية أنا مش خرونج',
      price: 1765,
      category: 'الصواني',
      description: '10 جمبري مشوي، 10 مقلي، 10 باترفلاي، 300جم بلدي، كيلو أرز',
      recipe: [
        { ingredientId: ingMap['جمبري جامبو'], quantity: 1000 },
        { ingredientId: ingMap['أرز ريزو'], quantity: 1000 }
      ]
    },
    {
      name: 'صينية طير إنت',
      price: 1500,
      category: 'الصواني',
      description: '4 بلطي، 4 سلطعون، 6 جمبري مشوي، 9 محار، أرز وشوربات',
      recipe: [
        { ingredientId: ingMap['سمك بلطي'], quantity: 4 },
        { ingredientId: ingMap['سلطعون (كابوريا)'], quantity: 4 },
        { ingredientId: ingMap['محار (جندوفلي)'], quantity: 1000 },
        { ingredientId: ingMap['أرز ريزو'], quantity: 2000 }
      ]
    },
    {
      name: 'صينية المبكبكة الكبيرة',
      price: 1200,
      category: 'الوجبات العائلية',
      description: '40 جمبري، كيلو مكرونة صوص أحمر حار، شوربة',
      recipe: [
        { ingredientId: ingMap['جمبري وسط'], quantity: 1000 },
        { ingredientId: ingMap['مكرونة قلم'], quantity: 1000 }
      ]
    },
    {
      name: 'وجبة البلطية العايمة',
      price: 205,
      category: 'الوجبات الفردية',
      description: 'سمكة بلطي مقلي، 2 جمبري، أرز، سلطة، شوربة',
      recipe: [
        { ingredientId: ingMap['سمك بلطي'], quantity: 1 },
        { ingredientId: ingMap['جمبري وسط'], quantity: 50 },
        { ingredientId: ingMap['أرز ريزو'], quantity: 300 }
      ]
    },
    // السندوتشات
    {
      name: 'صاروخ شرمب زون (الصاروخ النووي)',
      price: 85,
      category: 'السندوتشات',
      description: 'مشكل سي فود بخلطة الملك السرية في رغيف جبار',
      recipe: [
        { ingredientId: ingMap['جمبري وسط'], quantity: 150 },
        { ingredientId: ingMap['خبز صاروخ'], quantity: 1 }
      ]
    }
  ];

  await MenuItem.insertMany(menuItems);
  console.log('Seeded ' + menuItems.length + ' menu items.');

  // 4. Seed Branches (Settings)
  const branches = [
    'محطة الرمل', 'المكس', 'سموحة', 'ميامي', 
    'المنتزه', 'جليم', 'التجمع الخامس', 'الشيخ زايد'
  ];
  await Settings.insertMany(branches.map(b => ({ branch: b, lastShiftCloseTimestamp: new Date(0) })));
  console.log('Seeded ' + branches.length + ' branch settings.');

  mongoose.connection.close();
  console.log('Seeding complete.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
