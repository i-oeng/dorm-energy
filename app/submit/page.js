"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function SubmitPage() {
  const supabase = supabaseBrowser();

  const [meterKwh, setMeterKwh] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoName, setPhotoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const [nextSubmitAt, setNextSubmitAt] = useState(null);
  const [remaining, setRemaining] = useState("");
  const [tips, setTips] = useState([]);

  useEffect(() => {
    if (!nextSubmitAt) return;

    const target = new Date(nextSubmitAt).getTime();
    if (Number.isNaN(target)) return;

    function tick() {
      const diff = Math.max(0, target - Date.now());
      const totalSeconds = Math.floor(diff / 1000);
      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const s = String(totalSeconds % 60).padStart(2, "0");
      setRemaining(`${h}:${m}:${s}`);

      if (diff === 0) {
        setNextSubmitAt(null);
        setRemaining("");
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextSubmitAt]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setResult(null);
    setTips([]);

    if (nextSubmitAt) return; 
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

      if (!data.ok) {
        setErr(data.error || "Failed");

        if (data.next_submit_at) {
          setNextSubmitAt(data.next_submit_at);
        }


        if (data.submission) {
          setResult(data.submission);
        }

        return;
      }

      setNextSubmitAt(null);
      setRemaining("");
      setResult(data.submission);
      setTips(Array.isArray(data.tips) ? data.tips : []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Submit your readings!</h1>

        <div style={styles.subtitle}>
          Enter your total meter kWh and attach a photo proof.
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Meter kWh"
            inputMode="decimal"
            value={meterKwh}
            onChange={(e) => setMeterKwh(e.target.value)}
            required
            disabled={!!nextSubmitAt}
          />

          <div style={styles.fileWrap}>
            <label style={styles.fileBox}>
              <input
                style={styles.fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setPhoto(f);
                  setPhotoName(f?.name || "");
                }}
                required
                disabled={!!nextSubmitAt}
              />

              <span style={styles.chooseBtn}>Select photo</span>
              <span style={styles.fileNameInline}>{photoName || "No file chosen"}</span>
            </label>
          </div>

          <button
            disabled={loading || !!nextSubmitAt}
            style={styles.primaryBtn}
            type="submit"
          >
            {nextSubmitAt
              ? `Next submit in ${remaining || "..."}`
              : loading
              ? "Submitting..."
              : "Submit"}
          </button>

          {nextSubmitAt ? (
            <div style={styles.messageWarn}>
              You already submitted today. Next submission available in{" "}
              <b>{remaining || "..."}</b>.
            </div>
          ) : null}

          {err ? <div style={styles.messageError}>{err}</div> : null}
        </form>

        {result ? (
          <section style={styles.resultsSection}>
            <h2 style={styles.h2}>Computed metrics</h2>

            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Daily kWh</span>
              <span style={styles.metricValue}>
                {result.daily_kwh === null
                  ? "Need yesterday’s reading"
                  : Number(result.daily_kwh).toFixed(2)}
              </span>
            </div>

            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>kWh/person</span>
              <span style={styles.metricValue}>
                {result.kwh_per_person === null ? "-" : Number(result.kwh_per_person).toFixed(2)}
              </span>
            </div>

            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Status</span>
              <span style={styles.metricValue}>
                {result.flagged ? `Flagged — ${result.flag_reason}` : "OK"}
              </span>
            </div>

            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Habits</span>
              <span style={styles.metricValue}>
                {result.habits?.length ? result.habits.join(", ") : "—"}
              </span>
            </div>

            {tips?.length ? (
              <div style={styles.tipsBox}>
                <div style={styles.tipsTitle}>Tips</div>
                <ul style={styles.tipsList}>
                  {tips.map((t, idx) => (
                    <li key={idx} style={styles.tipsItem}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.photo_url ? (
              <img src={result.photo_url} alt="proof" style={styles.proofImg} />
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(circle at 30% 20%, #1f2937 0%, #0b0f14 40%, #05070a 100%)",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 22,
    padding: 26,
    background: "rgba(18, 22, 28, 0.75)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
    color: "white",
  },
  title: {
    margin: "10px 0 6px",
    fontSize: 28,
    fontWeight: 800,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 13.5,
    opacity: 0.75,
    marginBottom: 18,
  },
  form: { display: "grid", gap: 10 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    outline: "none",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.25)",
    color: "white",
    fontSize: 14,
  },
  primaryBtn: {
    marginTop: 10,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(221, 246, 59, 0.45)",
    background:
      "linear-gradient(180deg, rgba(240, 236, 3, 0.9), rgba(235, 192, 37, 0.9))",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14.5,
  },
  messageError: {
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
  messageWarn: {
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(245, 158, 11, 0.12)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
  },

  fileWrap: { display: "grid", gap: 8 },
  fileBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.25)",
    cursor: "pointer",
  },
  fileInput: { display: "none" },
  chooseBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontWeight: 800,
    fontSize: 13.5,
    whiteSpace: "nowrap",
  },
  fileNameInline: {
    fontSize: 12.5,
    opacity: 0.8,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },

  resultsSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.10)",
    display: "grid",
    gap: 10,
  },
  h2: { margin: 0, fontSize: 16, fontWeight: 900 },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
  },
  metricLabel: { fontSize: 13, opacity: 0.75 },
  metricValue: { fontSize: 13.5, fontWeight: 800, textAlign: "right" },

  tipsBox: {
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.20)",
    background: "rgba(59,130,246,0.08)",
  },
  tipsTitle: { fontSize: 13, fontWeight: 900, marginBottom: 8 },
  tipsList: { margin: 0, paddingLeft: 18, display: "grid", gap: 6 },
  tipsItem: { fontSize: 13, opacity: 0.95 },

  proofImg: {
    width: "100%",
    marginTop: 6,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
  },
};
