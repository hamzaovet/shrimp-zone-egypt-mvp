import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Get settings for a branch
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");
    if (!branch) return NextResponse.json({ error: "الفرع مطلوب" }, { status: 400 });

    await connectDB();
    let settings = await Settings.findOne({ branch });
    if (!settings) {
      settings = await Settings.create({ branch });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Update lastShiftCloseTimestamp (Close Shift)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "cashier"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { branch } = await req.json();
    if (!branch) return NextResponse.json({ error: "الفرع مطلوب" }, { status: 400 });

    await connectDB();
    const settings = await Settings.findOneAndUpdate(
      { branch },
      { lastShiftCloseTimestamp: new Date() },
      { new: true, upsert: true }
    );
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
