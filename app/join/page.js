"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function JoinPage() {
  const supabase = supabaseBrowser();
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
    });
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return setErr("Not logged in.");

    const res = await fetch("/api/join-room", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ roomId, joinCode }),
    });

    const out = await res.json();
    if (!out.ok) setErr(out.error || "Failed");
    else {
      setMsg(`Joined room ${out.roomId}. You can submit now.`);
      window.location.href = "/submit";
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1>Join your room</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Room ID (e.g. 317)" value={roomId} onChange={(e)=>setRoomId(e.target.value)} />
        <input placeholder="Join code" value={joinCode} onChange={(e)=>setJoinCode(e.target.value)} />
        <button>Join</button>
      </form>
      {err && <p style={{ color: "red" }}>{err}</p>}
      {msg && <p>{msg}</p>}
    </main>
  );
}
