"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, ScanLine } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-[rgba(255,255,255,0.06)]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00ddb3] glow-teal-sm transition-all group-hover:scale-105">
              <ScanLine className="h-4 w-4 text-[#060b18]" strokeWidth={2.5} />
            </div>
            <span className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-[#f0f2f5]">
              Access
              <span className="text-[#00ddb3]">Scan</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/scan"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#8892a7] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#f0f2f5]"
            >
              {session?.user ? "Dashboard" : "Scan"}
            </Link>
            <Link
              href="/about"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#8892a7] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#f0f2f5]"
            >
              About
            </Link>

            <div className="ml-3 h-5 w-px bg-[rgba(255,255,255,0.08)]" />

            {session?.user ? (
              <div className="ml-3 flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-sm text-[#8892a7]">
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[#515c72] transition-colors hover:bg-[rgba(255,100,100,0.08)] hover:text-[#ff6b6b]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="ml-3 flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#8892a7] transition-colors hover:text-[#f0f2f5]"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[#00ddb3] px-4 py-2 text-sm font-semibold text-[#060b18] transition-all hover:bg-[#00c9a2] hover:shadow-[0_0_20px_rgba(0,221,179,0.2)]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
