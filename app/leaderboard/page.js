"use client";

import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ ok: false }));
  }, []);

  if (!data) return <main style={{ padding: 16 }}>Loading...</main>;
  if (!data.ok) return <main style={{ padding: 16 }}>Failed to load leaderboard.</main>;

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Leaderboard (last 7 days)</h1>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        {data.list.map((r, i) => (
          <div
            key={r.roomId}
            style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}
          >
            <b>#{i + 1} {r.name}</b>
            <div>
              Avg kWh/person:{" "}
              {r.avgKwhPerPerson === null ? "—" : r.avgKwhPerPerson.toFixed(2)}
            </div>
            <div>Submissions: {r.submissions}</div>
            <div>Flagged: {r.flagged}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
