import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import Category from '@/models/Category';

export async function GET() {
  try {
    await connectDB();
    
    // Force schema registration for Vercel serverless cold-starts
    require('@/models/Category');
    require('@/models/MenuItem');

    const items = await MenuItem.find({}).populate('category').sort({ createdAt: -1 });
    return NextResponse.json(items, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    await connectDB();
    
    const newItem = new MenuItem(data);
    await newItem.save();
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
