"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  const [supabase] = useState(() => supabaseBrowser());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleLogout() {
    setMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setMsg(error.message);
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setMsg("Logout failed.");
    } finally {
      setLoading(false);
    }
  }

  const isSubmit = pathname === "/submit";
  const isLeaderboard = pathname === "/leaderboard";

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>

      {isLeaderboard && (
        <button
          type="button"
          onClick={() => router.push("/submit")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(59,130,246,0.15)",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      )}

      {isSubmit && (
        <button
          type="button"
          onClick={() => router.push("/leaderboard")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(59,130,246,0.15)",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Leaderboard
        </button>
      )}


      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(237, 254, 0, 0.15)",
          color: "yellow",
          fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Logging out..." : "Log out"}
      </button>

      {msg && (
        <div
          style={{
            marginLeft: 10,
            padding: "8px 10px",
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 12.5,
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
