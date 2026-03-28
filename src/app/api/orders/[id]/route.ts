import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import Inventory from "@/models/Inventory";
import InventoryMovement from "@/models/InventoryMovement";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  try {
    const { id } = await params;
    const body = await req.json();
    
    // 🕵️‍♂️ الجاسوس: هيطبع كل اللي الـ POS بعته بالحرف
    console.log(`\n🚨 [POS UPDATE ALERT] Order ID: ${id}`);
    console.log(`🚨 [POS UPDATE ALERT] Payload received:`, body);

    const { status, isPaid } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Handle Cancellation & Restock Logic (Phase 7)
    const isCancelling = (status === 'ملغي' || status === 'Cancelled');
    const wasNotCancelled = (order.status !== 'ملغي' && order.status !== 'Cancelled');

    if (isCancelling && wasNotCancelled) {
      // ... (كود الـ Inventory زي ما هو بالظبط بدون تغيير)
      console.log(`\n--- 🔄 RE-STOCKING INVENTORY for Cancelled Order: ${order.orderNumber} ---`);
      try {
        if (order.items && order.items.length > 0) {
          for (const cartItem of order.items) {
            const itemId = cartItem._id || cartItem.id; 
            const menuItem = await MenuItem.findById(itemId);
            
            if (!menuItem || !menuItem.recipe || menuItem.recipe.length === 0) continue;

            for (const ingredient of menuItem.recipe) {
              const returnAmount = ingredient.quantity * cartItem.quantity;
              const updatedInv = await Inventory.findByIdAndUpdate(
                ingredient.ingredientId,
                { $inc: { stock: returnAmount } },
                { new: true }
              );

              if (updatedInv) {
                await InventoryMovement.create({
                  inventoryId: updatedInv._id,
                  type: 'IN',
                  quantity: returnAmount,
                  unitCost: updatedInv.costPerUnit,
                  totalCost: returnAmount * updatedInv.costPerUnit,
                  reference: `Return Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
                  date: new Date()
                });
              }
            }
          }
        }
      } catch (restockError) {
        console.error("⚠️ Non-blocking error during inventory restocking:", restockError);
      }
    }

    // 🛠️ تحديث الحالة بذكاء
    if (status) {
      if (status === 'out_for_delivery') order.status = 'خرج للتوصيل';
      else if (status === 'completed' || status === 'delivered') order.status = 'تم التسليم';
      else order.status = status;
    } 
    
    // 💡 تركة إضافية: لو الكاشير ضغط "تحصيل وإغلاق" والـ POS بعت isPaid: true بس ومبعتش الحالة
    if (isPaid === true && !status && order.status !== 'تم التسليم') {
        console.log("💡 Auto-completing order because it was paid/closed from POS.");
        order.status = 'تم التسليم'; // هنقفل الأوردر أوتوماتيك
    }

    if (isPaid !== undefined) order.isPaid = isPaid;
    
    await order.save();
    
    console.log(`✅ Order ${id} updated successfully. New Status: ${order.status}`);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: error.message || "فشل تحديث الطلب" }, { status: 500 });
  }
}