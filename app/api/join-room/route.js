import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing auth token" }, { status: 401 });
    }

    const { roomId, joinCode } = await req.json();
    if (!roomId || !joinCode) {
      return NextResponse.json({ ok: false, error: "Missing roomId/joinCode" }, { status: 400 });
    }


    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;


    const { data: room, error: roomErr } = await supabaseServer
      .from("rooms")
      .select("id, code, active")
      .eq("id", roomId)
      .single();

    if (roomErr || !room) return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });
    if (!room.active) return NextResponse.json({ ok: false, error: "Room inactive" }, { status: 403 });


    if (room.code !== joinCode) {
      return NextResponse.json({ ok: false, error: "Wrong join code" }, { status: 403 });
    }


    const { error: upErr } = await supabaseServer
      .from("profiles")
      .upsert({ user_id: userId, room_id: roomId, role: "student" });

    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, roomId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
