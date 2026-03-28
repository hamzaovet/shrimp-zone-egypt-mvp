import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import Category from "@/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "cashier", "chef"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await connectDB();
    
    // Force schema registration for Vercel
    require('@/models/Category');
    require('@/models/MenuItem');
    require('@/models/Order');
    
    // Get branch from query params
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    // Fetch only active orders for the kitchen
    // CRITICAL: We only show 'جديد' (New) or 'جاري التحضير' (Preparing).
    // 'pending' (Web) is EXCLUDED until POS accepts it and changes status to 'جاري التحضير'.
    const query: any = {
      status: { $in: ['جديد', 'جاري التحضير'] }
    };
    if (branch) query.branch = branch;

    const orders = await Order.find(query).sort({ timestamp: 1 });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Kitchen API Error:", error);
    return NextResponse.json({ error: error.message || "فشل جلب طلبات المطبخ" }, { status: 500 });
  }
}
