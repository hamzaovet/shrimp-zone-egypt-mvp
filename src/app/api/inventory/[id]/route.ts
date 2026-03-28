import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Inventory from '@/models/Inventory';
import InventoryMovement from '@/models/InventoryMovement';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, quantityAdded, newUnitCost, ...rest } = body;

    if (action === 'ADD_STOCK') {
      const item = await Inventory.findById(id);
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      const oldStock = item.stock || 0;
      const oldCost = item.costPerUnit || 0;
      const added = Number(quantityAdded) || 0;
      const cost = Number(newUnitCost) || 0;

      // Weighted Average Cost Calculation
      const totalQuantity = oldStock + added;
      const newCost = totalQuantity > 0 
        ? ((oldStock * oldCost) + (added * cost)) / totalQuantity 
        : cost;

      item.stock += added;
      item.costPerUnit = newCost;
      await item.save();

      // ── CREATE LEDGER ENTRY ──
      await InventoryMovement.create({
        inventoryId: item._id,
        type: 'IN',
        quantity: added,
        unitCost: cost,
        totalCost: added * cost,
        reference: 'توريد مخزون (يدوي)',
        date: new Date()
      });

      return NextResponse.json(item);
    }

    if (action === 'DEDUCT_STOCK') {
      const item = await Inventory.findById(id);
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      const amount = Math.abs(Number(body.quantityRemoved) || 0);
      const reason = body.reason || 'هالك / تسوية';

      item.stock -= amount;
      await item.save();

      // ── CREATE LEDGER ENTRY (Phase 8 AIS) ──
      await InventoryMovement.create({
        inventoryId: item._id,
        type: 'OUT',
        quantity: amount,
        unitCost: item.costPerUnit,
        totalCost: amount * item.costPerUnit,
        reference: reason,
        date: new Date()
      });

      return NextResponse.json(item);
    }

    const updatedItem = await Inventory.findByIdAndUpdate(id, rest, { new: true });
    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("INVENTORY_UPDATE_ERROR:", error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  try {
    const { id } = await params;
    const deletedItem = await Inventory.findByIdAndDelete(id);
    if (!deletedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
