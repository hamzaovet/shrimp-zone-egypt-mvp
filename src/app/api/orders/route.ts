export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import Inventory from "@/models/Inventory";
import Category from "@/models/Category";
import InventoryMovement from "@/models/InventoryMovement";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST - Create new order
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Force schema registration for Vercel
    require('@/models/Category');
    require('@/models/MenuItem');
    require('@/models/Order');

    const body = await req.json();

    try {
      // ── Sequential Order Numbering (Daily reset) ──
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const countToday = await Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      const orderNumber = countToday + 1;

      const order = new Order({
        ...body,
        orderNumber: orderNumber,
        branch: body.branch || "محطة الرمل",
        customerName: body.customerName || "عميل أونلاين",
        customerPhone: body.customerPhone || "0000000000",
        address: body.address || "استلام من الفرع",
        
        // ── ERP Normalization (Shrimp Zone Web Flow Fix) ──
        orderType: body.orderType || 'delivery',
        paymentMethod: body.paymentMethod || 'Cash',
        taxAmount: body.taxAmount || 0,
        discount: body.discount || { type: 'fixed', value: 0, amount: 0 },
        status: body.status || 'pending',
        isPaid: false, // All orders start as unpaid unless POS explicitly marks them (handled in POS)
        source: body.source || 'Web',
        timestamp: new Date(),
      });

      await order.save();
      console.log('Order Saved to Shrimp Zone DB:', order._id);

      // ── AUTO STOCK DEDUCTION (Phase 4) ──
      try {
        if (body.items && body.items.length > 0) {
          for (const cartItem of body.items) {
            const itemId = cartItem._id || cartItem.id; // Fallback to handle both ID formats
            console.log(`\n--- Inventory Check for: ${cartItem.name} (ID: ${itemId}) ---`);
            
            const menuItem = await MenuItem.findById(itemId);
            
            if (!menuItem) {
              console.log(`❌ MenuItem not found in DB for ID: ${itemId}`);
              continue;
            }
            
            if (!menuItem.recipe || menuItem.recipe.length === 0) {
              console.log(`⚠️ No recipe attached to: ${menuItem.name}`);
              continue;
            }
            
            console.log(`✅ Recipe found for ${menuItem.name}. Ingredients count: ${menuItem.recipe.length}`);
            
            for (const ingredient of menuItem.recipe) {
              const deductionAmount = ingredient.quantity * cartItem.quantity;
              const updatedInv = await Inventory.findByIdAndUpdate(
                ingredient.ingredientId,
                { $inc: { stock: -deductionAmount } },
                { new: true }
              );
              if(updatedInv) {
                 // ── CREATE LEDGER ENTRY (Phase 5 AIS) ──
                 await InventoryMovement.create({
                   inventoryId: updatedInv._id,
                   type: 'OUT',
                   quantity: deductionAmount,
                   unitCost: updatedInv.costPerUnit,
                   totalCost: deductionAmount * updatedInv.costPerUnit,
                   reference: `Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
                   date: new Date()
                 });

                 console.log(`📉 Deducted ${deductionAmount} from ${updatedInv.name}. New Stock: ${updatedInv.stock}`);
              } else {
                 console.log(`❌ Failed to find/deduct Inventory item with ID: ${ingredient.ingredientId}`);
              }
            }
          }
        }
      } catch (inventoryError) {
        console.error("🔥 Crash in auto-deduction:", inventoryError);
      }

      return NextResponse.json(order, { status: 201 });
    } catch (saveError: any) {
      console.error("DATABASE SAVE ERROR:", saveError);
      return NextResponse.json({ 
        error: "Failed to save order", 
        details: saveError.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Order creation outer error:", error);
    return NextResponse.json({ error: error.message || "فشل إنشاء الطلب" }, { status: 500 });
  }
}

// GET - Fetch all orders (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    await connectDB();
    
    // Force schema registration
    require('@/models/Category');
    require('@/models/MenuItem');
    require('@/models/Order');

    let query = {};
    if (phone) {
      // If phone is provided, we filter by that (public use for mobile profile)
      query = { customerPhone: phone };
    } else {
      // If no phone, require Admin/Cashier auth for the full list
      const session = await getServerSession(authOptions);
      if (!session || !["admin", "cashier"].includes((session.user as any)?.role)) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: error.message || "فشل جلب الطلبات" }, { status: 500 });
  }
}
