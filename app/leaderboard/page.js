"use client";

import { useEffect, useState } from "react";

function funny(label) {
  const map = {
    submissions: "nothing to look here yet!",
    flagged: "Santa saw nothing suspicious 🎅",
    avg: "still cooking… 🍳",
    name: "Mystery room 👀",
  };
  return map[label] || "—";
}

export default function LeaderboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ ok: false }));
  }, []);

  if (!data) return <main style={styles.loading}>Loading...</main>;
  if (!data.ok) return <main style={styles.loading}>Failed to load leaderboard.</main>;

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Leaderboard 🎄</h1>

        <div style={styles.subtitle}>
          Last 7 days — average efficiency per person.
        </div>

        <div style={styles.list}>
          {data.list.map((r, i) => {
            const name = r?.name ? r.name : funny("name");
            const avg =
              typeof r?.avgKwhPerPerson === "number"
                ? r.avgKwhPerPerson.toFixed(2)
                : funny("avg");

            const submissions =
              typeof r?.submissions === "number"
                ? r.submissions
                : funny("submissions");

            const flagged =
              typeof r?.flagged === "number"
                ? r.flagged
                : funny("flagged");

            const rankPill =
              i === 0 ? "🏆 #1" : i === 1 ? "🥈 #2" : i === 2 ? "🥉 #3" : `#${i + 1}`;

            return (
              <div
                key={r.roomId ?? `${name}-${i}`}
                style={styles.rowCard}
              >
                <div style={styles.rowTop}>
                  <div style={styles.rankPill}>{rankPill}</div>
                  <div style={styles.roomName}>{name}</div>
                </div>

                <div style={styles.grid}>
                  <div style={styles.kv}>
                    <div style={styles.k}>Avg kWh/person</div>
                    <div style={styles.v}>{avg}</div>
                  </div>

                  <div style={styles.kv}>
                    <div style={styles.k}>Submissions</div>
                    <div style={styles.v}>
                      {typeof submissions === "number"
                        ? submissions
                        : `Submissions: ${submissions}`}
                    </div>
                  </div>

                  <div style={styles.kv}>
                    <div style={styles.k}>Flagged</div>
                    <div style={styles.v}>
                      {typeof flagged === "number"
                        ? flagged
                        : `Flagged: ${flagged}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.footerNote}>
          Pro tip: fewer flagged days usually means cleaner readings (and less chaos).
        </div>
      </div>
    </main>
  );
}

const styles = {
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(circle at 30% 20%, rgba(34,197,94,0.12) 0%, rgba(11,15,20,1) 45%, rgba(220,38,38,0.10) 100%)",
    color: "white",
    padding: 18,
  },

  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 18,
    paddingTop: 82, 
    color: "white",
    background:
      "radial-gradient(circle at 20% 15%, rgba(213, 235, 18, 0.22) 0%, rgba(11,15,20,1) 42%, rgba(246, 254, 3, 0.64) 100%)",
    position: "relative",
    overflow: "hidden",
  },

  card: {
    width: "100%",
    maxWidth: 720,
    borderRadius: 22,
    padding: 26,
    background: "rgba(18, 22, 28, 0.75)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
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

  list: {
    display: "grid",
    gap: 10,
  },

  rowCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 12,
  },

  rowTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  rankPill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 12.5,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  roomName: {
    fontSize: 14,
    fontWeight: 900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    opacity: 0.95,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },

  kv: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.18)",
    padding: "10px 10px",
    minHeight: 52,
    display: "grid",
    alignContent: "center",
    gap: 6,
  },

  k: {
    fontSize: 12,
    opacity: 0.7,
  },

  v: {
    fontSize: 13.5,
    fontWeight: 900,
  },

  footerNote: {
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.10)",
    fontSize: 12.5,
    opacity: 0.7,
    textAlign: "center",
  },
};
