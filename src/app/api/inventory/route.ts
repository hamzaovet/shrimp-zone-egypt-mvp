import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Inventory from '@/models/Inventory';

export async function GET() {
  await connectDB();
  try {
    const items = await Inventory.find({}).sort({ name: 1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const newItem = await Inventory.create(body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Item with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
