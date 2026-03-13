"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign in failed. Try logging in.");
      } else {
        router.push("/scan");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topo-grid relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pt-16">
      <div className="mesh-gradient pointer-events-none absolute inset-0" />

      <div className="animate-fade-up relative w-full max-w-sm">
        <div className="glass-panel rounded-2xl border border-[rgba(255,255,255,0.06)] p-8">
          <div className="mb-8 text-center">
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-[#f0f2f5]">
              Create account
            </h1>
            <p className="mt-2 text-sm text-[#8892a7]">
              Sign up to start scanning spaces
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-up delay-1">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#8892a7]">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0c1425] px-4 py-2.5 text-sm text-[#f0f2f5] placeholder-[#515c72] transition-all focus:border-[#00ddb3] focus:outline-none focus:ring-1 focus:ring-[#00ddb3]"
                placeholder="Your name"
              />
            </div>

            <div className="animate-fade-up delay-2">
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#8892a7]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0c1425] px-4 py-2.5 text-sm text-[#f0f2f5] placeholder-[#515c72] transition-all focus:border-[#00ddb3] focus:outline-none focus:ring-1 focus:ring-[#00ddb3]"
                placeholder="you@example.com"
              />
            </div>

            <div className="animate-fade-up delay-3">
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#8892a7]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0c1425] px-4 py-2.5 text-sm text-[#f0f2f5] placeholder-[#515c72] transition-all focus:border-[#00ddb3] focus:outline-none focus:ring-1 focus:ring-[#00ddb3]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-[#ff6b6b]">{error}</p>
            )}

            <div className="animate-fade-up delay-4">
              <button
                type="submit"
                disabled={loading}
                className="glow-teal flex w-full items-center justify-center gap-2 rounded-lg bg-[#00ddb3] px-4 py-2.5 text-sm font-semibold text-[#060b18] transition-all hover:brightness-110 hover:shadow-[0_0_24px_rgba(0,221,179,0.3)] disabled:opacity-40 disabled:hover:shadow-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create Account
              </button>
            </div>
          </form>

          <p className="animate-fade-up delay-5 mt-6 text-center text-sm text-[#515c72]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#00ddb3] transition-colors hover:text-[#00ddb3]/80">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
