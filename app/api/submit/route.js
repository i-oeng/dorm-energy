import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function isoDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

async function uploadToCloudinary(file, roomId) {
  const ab = await file.arrayBuffer();
  const buffer = Buffer.from(ab);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `dorm-energy/${roomId}`, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    ).end(buffer);
  });
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ ok: false, error: "Missing auth token" }, { status: 401 });

    const form = await req.formData();
    const meterKwhRaw = String(form.get("meterKwh") || "").trim();
    const file = form.get("photo");

    if (!meterKwhRaw || !file) {
      return NextResponse.json({ ok: false, error: "Missing meterKwh/photo" }, { status: 400 });
    }

    const meterKwh = Number(meterKwhRaw);
    if (!Number.isFinite(meterKwh) || meterKwh < 0) {
      return NextResponse.json({ ok: false, error: "Bad meterKwh" }, { status: 400 });
    }

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });

    const userId = userData.user.id;


    const { data: profile, error: profErr } = await supabaseServer
      .from("profiles")
      .select("room_id")
      .eq("user_id", userId)
      .single();

    if (profErr || !profile?.room_id) {
      return NextResponse.json({ ok: false, error: "User not linked to a room. Go to /join." }, { status: 403 });
    }

    const roomId = profile.room_id;


    const { data: room } = await supabaseServer
      .from("rooms")
      .select("occupants, active")
      .eq("id", roomId)
      .single();

    if (!room?.active) return NextResponse.json({ ok: false, error: "Room inactive" }, { status: 403 });

    
    const { data: prevRows } = await supabaseServer
      .from("submissions")
      .select("meter_kwh, day")
      .eq("room_id", roomId)
      .order("day", { ascending: false })
      .limit(1);

    const prev = prevRows?.length ? prevRows[0] : null;

    const photoUrl = await uploadToCloudinary(file, roomId);

    let dailyKwh = null;
    let flagged = false;
    let flagReason = null;

    if (prev && typeof prev.meter_kwh === "number") {
      dailyKwh = meterKwh - prev.meter_kwh;
      if (dailyKwh < 0) { flagged = true; flagReason = "Negative daily usage (typo/reset)."; }
      else if (dailyKwh > 40) { flagged = true; flagReason = "Suspicious spike."; }
    }

    const occupants = Number(room.occupants || 1) || 1;
    const kwhPerPerson = dailyKwh === null ? null : Math.max(dailyKwh, 0) / occupants;

    const habits = [];
    if (dailyKwh !== null) {
      if (dailyKwh <= 3) habits.push("Low-usage day");
      if (kwhPerPerson !== null && kwhPerPerson <= 1.5) habits.push("Great per-person efficiency");
      if (dailyKwh >= 10) habits.push("High-usage day — check idle devices");
    }

    const day = isoDay(new Date());

    const { data: inserted, error: insErr } = await supabaseServer
      .from("submissions")
      .insert([{
        room_id: roomId,
        day,
        meter_kwh: meterKwh,
        photo_url: photoUrl,
        daily_kwh: dailyKwh,
        kwh_per_person: kwhPerPerson,
        flagged,
        flag_reason: flagReason,
        habits,
        created_by: userId,
      }])
      .select("*")
      .single();

    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, submission: inserted });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
