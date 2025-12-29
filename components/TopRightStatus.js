"use client";

import { useEffect, useState } from "react";

export default function TopRightStatus() {
  const [state, setState] = useState({ loading: true });

  async function load() {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      const data = await r.json();
      setState({ loading: false, ...data });
    } catch (e) {
      setState({ loading: false, ok: false, error: String(e) });
    }
  }

  useEffect(() => {
    load();
  }, []);


  return (
    <div style={box}>
      {state.loading && <div>Checking session…</div>}

      {!state.loading && state.loggedIn === false && (
        <div>
          <div style={{ fontWeight: 700 }}>Not logged in</div>
          <div style={small}>/api/me says loggedIn=false</div>
        </div>
      )}

      {!state.loading && state.loggedIn === true && (
        <div>
          <div style={{ fontWeight: 700 }}>Room: {state.roomId ?? "—"}</div>
          <div style={small}>{state.email}</div>

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
      )}

      {!state.loading && state.ok === false && (
        <div>
          <div style={{ fontWeight: 700 }}>Status error</div>
          <div style={small}>{state.error || "Failed to load /api/me"}</div>
        </div>
      )}
    </div>
  );
}

const box = {
  position: "fixed",
  top: 12,
  right: 16,
  zIndex: 999999,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  fontSize: 14,
  lineHeight: 1.2,
  textAlign: "right",
};

const small = { fontSize: 12, opacity: 0.7, marginTop: 4 };

const btn = {
  marginTop: 8,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontSize: 12,
};
