import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Expense from '@/models/Expense';
import DailyClosure from '@/models/DailyClosure';
import MenuItem from '@/models/MenuItem';
import Inventory from '@/models/Inventory';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');
    const isAllBranches = !branch || branch === 'كل الفروع';

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const query: any = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["تم التسليم", "Completed"] },
      isPaid: true // Action 2: Exclude unpaid deliveries from balance
    };
    if (!isAllBranches) query.branch = branch;

    const [orders, expenses, menuItems, inventory] = await Promise.all([
      Order.find(query),
      Expense.find({ 
        ...(!isAllBranches ? { branch } : {}), 
        date: { $gte: startOfDay, $lte: endOfDay } 
      }),
      MenuItem.find({}),
      Inventory.find({})
    ]);

    let totalRevenue = 0;
    let cashSales = 0;
    let visaSales = 0;
    let totalCogs = 0;

    // Create lookup maps for performance
    const menuMap = new Map(menuItems.map(m => [m._id.toString(), m]));
    const invMap = new Map(inventory.map(i => [i._id.toString(), i]));

    orders.forEach(order => {
      totalRevenue += order.totalAmount;
      if (order.paymentMethod === 'Cash') {
        cashSales += order.totalAmount;
      } else if (order.paymentMethod === 'Visa') {
        visaSales += order.totalAmount;
      }

      // Calculate COGS
      order.items.forEach((item: any) => {
        const menuItem = menuMap.get(item._id?.toString());
        if (menuItem && menuItem.recipe) {
          menuItem.recipe.forEach((r: any) => {
            const invItem = invMap.get(r.ingredientId?.toString());
            if (invItem) {
              totalCogs += (r.quantity * invItem.costPerUnit) * item.quantity;
            }
          });
        }
      });
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      totalRevenue,
      cashSales,
      visaSales,
      totalCogs,
      totalExpenses,
      expenses
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'ADD_EXPENSE') {
      const expense = await Expense.create(data);
      return NextResponse.json(expense);
    }

    if (action === 'CLOSE_DAY') {
      const closure = await DailyClosure.create(data);
      return NextResponse.json(closure);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
