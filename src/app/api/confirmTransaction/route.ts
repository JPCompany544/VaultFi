import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { success: false, error: "This endpoint has been deprecated. Use /api/manualConfirmDeposit instead." },
    { status: 410 }
  );
}
