import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "This route is deprecated. Please use 'node scripts/seedBahij.js' for all Bahij ERP seeding operations.",
    status: "deprecated"
  }, { status: 403 });
}