"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import LogoutButton from "@/components/LogoutButton";

export default function Header() {
  const supabase = supabaseBrowser();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!loggedIn) return null;

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 20px",
        background: "rgba(11,15,20,0.6)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 50,
      }}
    >
      <LogoutButton />
    </header>
  );
}
