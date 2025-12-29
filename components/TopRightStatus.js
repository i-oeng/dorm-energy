"use client";

import { useEffect, useState } from "react";

export default function TopRightStatus() {
  const [state, setState] = useState({ loading: true });

  async function load() {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json();
      setState({ loading: false, ...data });
    } catch {
      setState({ loading: false, ok: false });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.loading) return null;
  if (!state.loggedIn) return null;

  return (
    <div style={box}>
      <div style={{ fontWeight: 700 }}>Room: {state.roomId ?? "—"}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{state.email}</div>

      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/register";
        }}
        style={btn}
      >
        Logout
      </button>
    </div>
  );
}

const box = {
  position: "fixed",
  top: 12,
  right: 16,
  textAlign: "right",
  fontSize: 14,
  lineHeight: 1.2,
  zIndex: 9999,
};

const btn = {
  marginTop: 8,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontSize: 12,
};
