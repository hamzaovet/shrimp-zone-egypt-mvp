import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name, phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ message: "رقم الهاتف مطلوب" }, { status: 400 });
    }

    // Normalize phone to +20 format (e.g., 010... -> +2010...)
    const normalizedPhone = `+20${phone.replace(/^(\+20|0)/, "")}`;

    // Find or create customer
    let customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      if (!name) {
        return NextResponse.json({ message: "الاسم مطلوب للتسجيل الجديد" }, { status: 400 });
      }
      customer = await Customer.create({ name, phone: normalizedPhone });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Customer Auth Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
