import { NextResponse } from "next/server";
import { listUserGenerations } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";

export async function GET() {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const generations = await listUserGenerations(userId);

  return NextResponse.json({ generations });
}
