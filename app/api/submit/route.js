import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function isoDay(d = new Date()) {
  return d.toISOString().slice(0, 10); 
}

function nextUtcMidnightISO(d = new Date()) {
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0));
  return next.toISOString();
}

async function uploadToCloudinary(file, roomId) {
  const ab = await file.arrayBuffer();
  const buffer = Buffer.from(ab);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `dorm-energy/${roomId}`, resource_type: "image" },
        (err, result) => (err ? reject(err) : resolve(result.secure_url))
      )
      .end(buffer);
  });
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing auth token" }, { status: 401 });
    }

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
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;

    const { data: profile, error: profErr } = await supabaseServer
      .from("profiles")
      .select("room_id")
      .eq("user_id", userId)
      .single();

    if (profErr || !profile?.room_id) {
      return NextResponse.json(
        { ok: false, error: "User not linked to a room. Go to /join." },
        { status: 403 }
      );
    }

    const roomId = profile.room_id;

    const { data: room } = await supabaseServer
      .from("rooms")
      .select("occupants, active")
      .eq("id", roomId)
      .single();

    if (!room?.active) {
      return NextResponse.json({ ok: false, error: "Room inactive" }, { status: 403 });
    }

    const day = isoDay(new Date());



    const { data: existingToday, error: existingErr } = await supabaseServer
      .from("submissions")
      .select("*")
      .eq("room_id", roomId)
      .eq("day", day)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingErr) {
      return NextResponse.json({ ok: false, error: existingErr.message }, { status: 500 });
    }

    if (existingToday?.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "You already submitted today.",
          already_submitted: true,
          next_submit_at: nextUtcMidnightISO(new Date()),
          submission: existingToday[0],
        },
        { status: 429 }
      );
    }


    const { data: recentRows } = await supabaseServer
      .from("submissions")
      .select("meter_kwh, day, daily_kwh, kwh_per_person")
      .eq("room_id", roomId)
      .order("day", { ascending: false })
      .limit(2);

    const prev = recentRows?.length ? recentRows[0] : null;       
    const prevPrev = recentRows?.length > 1 ? recentRows[1] : null; 


    const photoUrl = await uploadToCloudinary(file, roomId);

    let dailyKwh = null;
    let flagged = false;
    let flagReason = null;

    if (prev && typeof prev.meter_kwh === "number") {
      dailyKwh = meterKwh - prev.meter_kwh;
      if (dailyKwh < 0) {
        flagged = true;
        flagReason = "Negative daily usage (typo/reset).";
      } else if (dailyKwh > 40) {
        flagged = true;
        flagReason = "Suspicious spike.";
      }
    }

    const occupants = Number(room.occupants || 1) || 1;
    const kwhPerPerson = dailyKwh === null ? null : Math.max(dailyKwh, 0) / occupants;


    const habits = [];
    const tips = [];

    if (dailyKwh === null) {
      habits.push("First data point — daily usage will appear after the next submission");
      tips.push("Submit again tomorrow so we can compute your daily usage trend.");
    } else {

      if (dailyKwh < 2) habits.push("Ultra low-usage day");
      else if (dailyKwh < 5) habits.push("Low-usage day");
      else if (dailyKwh < 10) habits.push("Moderate-usage day");
      else if (dailyKwh < 20) habits.push("High-usage day");
      else habits.push("Very high-usage day");

 
      if (kwhPerPerson !== null) {
        if (kwhPerPerson < 1) habits.push("Excellent per-person efficiency");
        else if (kwhPerPerson < 2) habits.push("Good per-person efficiency");
        else if (kwhPerPerson < 3.5) habits.push("Average per-person efficiency");
        else habits.push("Poor per-person efficiency");
      }


      if (prev && typeof prev.daily_kwh === "number" && Number.isFinite(prev.daily_kwh)) {
        const diff = dailyKwh - prev.daily_kwh;

        if (Math.abs(diff) < 0.5) habits.push("Stable vs yesterday");
        else if (diff < 0) habits.push("Improved vs yesterday (lower usage)");
        else habits.push("Higher usage vs yesterday");


        if (diff > 2) {
          tips.push("Usage jumped vs yesterday — check heaters, kettles, and any always-on devices.");
        } else if (diff < -2) {
          tips.push("Nice improvement vs yesterday — keep the same routine and watch standby devices.");
        }
      }


      if (dailyKwh >= 10) tips.push("High usage: unplug idle chargers, avoid leaving lights on, and reduce standby power.");
      if (dailyKwh >= 15) tips.push("If you used heaters, try lowering temp by 1–2°C — it usually saves noticeable energy.");
      if (kwhPerPerson !== null && kwhPerPerson >= 3) tips.push("Per-person is high: coordinate schedules (laundry/kettle) to avoid repeated runs.");

      if (flagged) tips.push("This reading looks suspicious — double-check the meter digits and resubmit tomorrow.");
    }

    const { data: inserted, error: insErr } = await supabaseServer
      .from("submissions")
      .insert([
        {
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
        },
      ])
      .select("*")
      .single();

    if (insErr) {
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
    }


    return NextResponse.json({ ok: true, submission: inserted, tips });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
