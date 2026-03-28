import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Category from "@/models/Category";
import MenuItem from "@/models/MenuItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: "غير مصرح لك بالدخول" }, { status: 403 });
    }

    await connectDB();
    const customers = await Customer.find().sort({ totalSpent: -1 });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
