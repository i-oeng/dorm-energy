"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    else window.location.href = "/join";
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>


        <h1 style={styles.title}>Let's save electricity!</h1>

        <div style={styles.subtitle}>
          Already have an account?{" "}
          <button type="button" style={styles.linkBtn} onClick={() => router.push("/login")}>
            Login
          </button>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <input
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            required
          />


          <input
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />

          <button disabled={err} style={styles.primaryBtn} type="submit">
            {err ? "Creating..." : "Sign up"}
          </button>

          {err ? <div style={styles.message}>{msg}</div> : null}


        </form>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "radial-gradient(circle at 30% 20%, #1f2937 0%, #0b0f14 40%, #05070a 100%)",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 26,
    background: "rgba(18, 22, 28, 0.75)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
    color: "white",
  },
  logoWrap: { display: "grid", placeItems: "center", marginBottom: 10 },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  logoDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    border: "3px solid rgba(255,255,255,0.85)",
    boxSizing: "border-box",
  },
  title: { margin: "10px 0 6px", fontSize: 28, fontWeight: 800, textAlign: "center" },
  subtitle: { textAlign: "center", fontSize: 13.5, opacity: 0.75, marginBottom: 18 },
  linkBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontWeight: 700,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
  },
  form: { display: "grid", gap: 8 },
  label: { fontSize: 12, opacity: 0.7, marginTop: 6 },
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
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.45)",
    background: "linear-gradient(180deg, rgba(59,130,246,0.9), rgba(37,99,235,0.9))",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14.5,
  },
  message: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
  orRow: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center", marginTop: 14 },
  orLine: { height: 1, background: "rgba(255,255,255,0.10)" },
  orText: { fontSize: 12, opacity: 0.6 },
  socialRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 },
  socialBtn: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontWeight: 800,
    cursor: "not-allowed",
  },
};
