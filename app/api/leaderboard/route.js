import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceDay = since.toISOString().slice(0, 10);

  const { data: rooms } = await supabaseServer
    .from("rooms")
    .select("id,name,active")
    .eq("active", true);

  const { data: subs } = await supabaseServer
    .from("submissions")
    .select("room_id,kwh_per_person,flagged,day")
    .gte("day", sinceDay);

  const map = new Map();
  for (const r of rooms || []) map.set(r.id, { roomId: r.id, name: r.name || r.id, days: 0, sum: 0, flagged: 0 });

  for (const s of subs || []) {
    if (!map.has(s.room_id)) continue;
    if (typeof s.kwh_per_person !== "number") continue;
    const t = map.get(s.room_id);
    t.days += 1;
    t.sum += s.kwh_per_person;
    if (s.flagged) t.flagged += 1;
  }

  const list = Array.from(map.values())
    .map(x => ({ ...x, avgKwhPerPerson: x.days ? x.sum / x.days : null }))
    .sort((a,b) => (a.avgKwhPerPerson ?? Infinity) - (b.avgKwhPerPerson ?? Infinity));

  return NextResponse.json({ ok: true, sinceDay, list });
}
