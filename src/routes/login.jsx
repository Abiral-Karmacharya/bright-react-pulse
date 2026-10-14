import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import Starfield from "../components/Starfield";
import { api } from "../lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Journalist Login — Hollows" },
      {
        name: "description",
        content: "Log in to your Hollows journalist inbox.",
      },
      { property: "og:title", content: "Journalist Login — Hollows" },
      { property: "og:description", content: "Log in to your Hollows journalist inbox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem(
        "hollows_user",
        JSON.stringify({ user_id: res.user_id, username: res.username })
      );
      navigate({ to: "/inbox" });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Starfield />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="glass-card w-full max-w-md p-8">
          <p className="font-mono-display text-xs tracking-[0.3em] text-accent uppercase">
            // returning journalist
          </p>
          <h1 className="font-mono-display mt-2 text-2xl font-bold text-foreground">
            Login
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              className="input-space w-full px-4 py-3 text-sm"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input-space w-full px-4 py-3 text-sm"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full rounded-lg px-6 py-3 font-mono-display text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Authenticating…" : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            No account yet?{" "}
            <Link to="/register" className="text-accent underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
