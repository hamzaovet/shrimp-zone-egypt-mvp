import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import Category from '@/models/Category';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const params = await context.params;
    const { id } = params;
    
    const data = await request.json();
    await connectDB();
    
    // Force schema registration for Vercel
    require('@/models/Category');
    require('@/models/MenuItem');

    const updatedItem = await MenuItem.findByIdAndUpdate(id, data, { new: true });
    if (!updatedItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }
    
    const params = await context.params;
    const { id } = params;
    
    const data = await request.json();
    await connectDB();
    
    const updatedItem = await MenuItem.findByIdAndUpdate(id, data, { new: true });
    if (!updatedItem) return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const params = await context.params;
    const { id } = params;

    await connectDB();
    const deletedItem = await MenuItem.findByIdAndDelete(id);
    if (!deletedItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    
    return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    await connectDB();
    
    const menuItem = await MenuItem.findById(id);
    
    // ── Emergency Safety Check (Action from image_26.png) ──
    if (!menuItem) {
      return NextResponse.json({ error: 'Item not found in database' }, { status: 404 });
    }
    
    return NextResponse.json(menuItem, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
