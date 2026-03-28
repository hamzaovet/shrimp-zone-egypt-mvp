import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import InventoryMovement from '@/models/InventoryMovement';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  try {
    const { id } = await params;
    const movements = await InventoryMovement.find({ inventoryId: id })
      .sort({ date: -1 })
      .limit(50); // Get last 50 movements for the item
    
    return NextResponse.json(movements);
  } catch (error: any) {
    console.error("FETCH_MOVEMENTS_ERROR:", error);
    return NextResponse.json({ error: 'Failed to fetch item movements' }, { status: 500 });
  }
}
