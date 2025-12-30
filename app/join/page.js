"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function JoinPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data?.session) router.push("/login");
    });

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setErr("Not logged in.");
        return;
      }

      const res = await fetch("/api/join-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId, joinCode }),
      });

      const out = await res.json().catch(() => null);

      if (!res.ok || !out?.ok) {
        setErr(out?.error || "Failed");
        return;
      }

      setMsg(`Joined room ${out.roomId}. You can submit now.`);
      router.push("/submit");
    } catch (e) {
      console.error(e);
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Join your room</h1>

        <div style={styles.subtitle}>
          Enter the room ID and join code you received.
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Room ID (e.g. 317)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            autoComplete="off"
            required
          />

          <input
            style={styles.input}
            placeholder="Join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            autoComplete="off"
            required
          />

          <button disabled={loading} style={styles.primaryBtn} type="submit">
            {loading ? "Joining..." : "Join"}
          </button>

          {err ? <div style={styles.messageError}>{err}</div> : null}
          {msg ? <div style={styles.messageOk}>{msg}</div> : null}
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
    background:
      "radial-gradient(circle at 30% 20%, #1f2937 0%, #0b0f14 40%, #05070a 100%)",
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
  form: { display: "grid", gap: 8 },
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
    background:
      "linear-gradient(180deg, rgba(237, 246, 59, 0.9), rgba(239, 169, 17, 0.9))",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14.5,
  },
  messageError: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
  messageOk: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(34, 197, 94, 0.12)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
};
