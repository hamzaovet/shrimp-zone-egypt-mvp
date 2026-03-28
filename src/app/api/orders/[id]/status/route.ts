export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // عدلنا دي لـ Promise
) {
  try {
    // ── UNWRAP PARAMS (Next.js 15 Fix) ──
    const resolvedParams = await params; 
    const id = resolvedParams.id;
    
    console.log(`[REALTIME] Fetching status for Order: ${id}`);
    
    await connectDB();
    const order = await Order.findById(id);
    
    if (!order) {
      console.log(`⚠️ Order not found in DB: ${id}`);
      return NextResponse.json({
        id: id,
        status: "preparing",
        estimatedDelivery: "25-35 mins",
        placedAt: new Date(Date.now() - 5 * 60000),
      });
    }

    console.log(`✅ Order ${id} current status in DB: ${order.status}`);

    return NextResponse.json({
      id: order._id,
      status: order.status,
      steps: {
        placed: true,
        preparing: ["جاري التحضير", "جاهز", "خرج للتوصيل", "تم التسليم", "preparing", "ready", "out_for_delivery", "delivered"].includes(order.status),
        outForDelivery: ["خرج للتوصيل", "تم التسليم", "out_for_delivery", "delivered"].includes(order.status),
        delivered: ["تم التسليم", "delivered"].includes(order.status)
      }
    });
  } catch (error: any) {
    console.error("🔥 Status Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}