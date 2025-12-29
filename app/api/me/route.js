import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  const supabase = supabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const user = data.user;
  if (!user) return NextResponse.json({ ok: true, loggedIn: false });

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("room_id")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    ok: true,
    loggedIn: true,
    email: user.email,
    roomId: profile?.room_id ?? null,
  });
}
