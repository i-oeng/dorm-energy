// NOT IMPLEMENTED
// If needed, please contact islam.kossymbayev@gmail.com
// Thank you for taking your precious time to look through the code!

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseServer
    .from("submissions")
    .select("*")
    .eq("flagged", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, list: data });
}
