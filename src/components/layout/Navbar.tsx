"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, ScanLine, Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMobileMenu, mobileMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(255,255,255,0.06)] bg-[#060b18] md:bg-[rgba(12,20,37,0.8)] md:backdrop-blur-[20px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00ddb3] glow-teal-sm transition-all group-hover:scale-105">
              <ScanLine className="h-4 w-4 text-[#060b18]" strokeWidth={2.5} />
            </div>
            <span className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-[#f0f2f5]">
              Access
              <span className="text-[#00ddb3]">Scan</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
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

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#8892a7] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#f0f2f5]"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="border-t border-[rgba(255,255,255,0.06)] md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-2">
              <Link
                href="/scan"
                onClick={closeMobileMenu}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#f0f2f5] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
              >
                {session?.user ? "Dashboard" : "Scan"}
              </Link>
              <Link
                href="/about"
                onClick={closeMobileMenu}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#f0f2f5] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
              >
                About
              </Link>

              <div className="my-2 h-px w-full bg-[rgba(255,255,255,0.08)]" />

              {session?.user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.04)] px-3.5 py-2 text-sm text-[#8892a7]">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="max-w-[70vw] truncate">
                        {session.user.name || session.user.email}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        void signOut();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[#515c72] transition-colors hover:bg-[rgba(255,100,100,0.08)] hover:text-[#ff6b6b]"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#f0f2f5] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="rounded-lg bg-[#00ddb3] px-3.5 py-2 text-sm font-semibold text-[#060b18] transition-all hover:bg-[#00c9a2] hover:shadow-[0_0_20px_rgba(0,221,179,0.2)]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
