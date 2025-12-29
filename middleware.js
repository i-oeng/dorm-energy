import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api")) return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isRegister = pathname.startsWith("/register");
  const isLogin = pathname.startsWith("/login");
  const isJoin = pathname.startsWith("/join");

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  if (!user) {
    if (isRegister || isLogin) return res;
    return NextResponse.redirect(new URL("/register", req.url));
  }

  // logged in users shouldn't access register/login
  if (isRegister || isLogin) {
    return NextResponse.redirect(new URL("/submit", req.url));
  }

  let hasRoom = false;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("room_id")
    .eq("user_id", user.id)
    .single();

  if (!error && profile?.room_id) hasRoom = true;

  // logged in + has room -> block join
  if (hasRoom && isJoin) {
    return NextResponse.redirect(new URL("/submit", req.url));
  }

  // logged in + no room -> force join
  if (!hasRoom && !isJoin) {
    return NextResponse.redirect(new URL("/join", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
