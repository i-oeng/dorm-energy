"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function SubmitPage() {
  const supabase = supabaseBrowser();

  const [meterKwh, setMeterKwh] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setResult(null);

    if (!photo) return setErr("Upload a photo of the meter.");

    setLoading(true);
    try {

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const token = sessionData.session?.access_token;
      if (!token) {
        setErr("You are not logged in. Please login first.");
        return;
      }

 
      const fd = new FormData();
      fd.append("meterKwh", meterKwh);
      fd.append("photo", photo);


      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!data.ok) setErr(data.error || "Failed");
      else setResult(data.submission);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1>Submit meter reading</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Meter kWh (total)"
          inputMode="decimal"
          value={meterKwh}
          onChange={(e) => setMeterKwh(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setPhoto(e.target.files?.[0] || null)}
        />
        <button disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
      </form>

      {err ? <p style={{ color: "crimson", marginTop: 16 }}>{err}</p> : null}

      {result ? (
        <section style={{ marginTop: 20 }}>
          <h2>Computed metrics</h2>
          <p>
            <b>Daily kWh:</b>{" "}
            {result.daily_kwh === null ? "Need yesterday’s reading" : Number(result.daily_kwh).toFixed(2)}
          </p>
          <p>
            <b>kWh/person:</b>{" "}
            {result.kwh_per_person === null ? "-" : Number(result.kwh_per_person).toFixed(2)}
          </p>
          <p>
            <b>Status:</b> {result.flagged ? `Flagged — ${result.flag_reason}` : "OK ✅"}
          </p>
          <p>
            <b>Habits:</b> {result.habits?.length ? result.habits.join(", ") : "—"}
          </p>
          <img
            src={result.photo_url}
            alt="proof"
            style={{ width: "100%", marginTop: 12, borderRadius: 12 }}
          />
        </section>
      ) : null}
    </main>
  );
}
