import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import Starfield from "../components/Starfield";
import { api } from "../lib/api";
import {
  generateKeyPair,
  exportPublicKeyPem,
  exportPrivateKeyPem,
  generateCsr,
  downloadPrivateKey,
} from "../lib/crypto";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Hollows" },
      {
        name: "description",
        content:
          "Register as a journalist on Hollows. Your encryption keypair is generated in your browser — the private key never leaves your device.",
      },
      { property: "og:title", content: "Register — Hollows" },
      {
        property: "og:description",
        content: "Create a journalist account with browser-generated encryption keys.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | working | done
  const [step, setStep] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("working");
    try {
      setStep("Generating RSA-2048 keypair in your browser…");
      const keyPair = await generateKeyPair();

      setStep("Exporting public key…");
      const publicKeyPem = await exportPublicKeyPem(keyPair.publicKey);

      setStep("Building certificate signing request…");
      const csr = await generateCsr(publicKeyPem, username);

      setStep("Registering with the server…");
      await api.register({
        username,
        email,
        password,
        public_key: publicKeyPem,
        csr,
      });

      setStep("Downloading your private key…");
      const privatePem = await exportPrivateKeyPem(keyPair.privateKey);
      downloadPrivateKey(privatePem);

      setStatus("done");
    } catch (err) {
      setError(err.message || "Registration failed");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="relative min-h-screen bg-background">
        <Starfield />
        <main className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="glass-card max-w-md p-8 text-center">
            <div className="font-mono-display text-4xl">🛰️</div>
            <h1 className="font-mono-display mt-4 text-2xl font-bold text-foreground">
              Transmission received
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is live and your private key has been downloaded as{" "}
              <code className="font-mono-display text-accent">private.key</code>.
            </p>
            <div className="mt-6 rounded-lg border border-warning/50 bg-warning/10 p-4 text-left">
              <p className="font-mono-display text-sm font-semibold text-warning">
                ⚠ Save this. It never leaves your browser. We cannot recover it.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Without your private key, your messages are permanently
                unreadable — even to us.
              </p>
            </div>
            <button
              onClick={() => navigate({ to: "/login" })}
              className="btn-glow mt-6 w-full rounded-lg px-6 py-3 font-mono-display text-sm font-semibold"
            >
              Continue to login
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Starfield />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="glass-card w-full max-w-md p-8">
          <p className="font-mono-display text-xs tracking-[0.3em] text-accent uppercase">
            // new journalist
          </p>
          <h1 className="font-mono-display mt-2 text-2xl font-bold text-foreground">
            Register
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your keypair is generated locally before anything is sent.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              className="input-space w-full px-4 py-3 text-sm"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
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
              disabled={status === "working"}
              className="btn-glow w-full rounded-lg px-6 py-3 font-mono-display text-sm font-semibold disabled:opacity-50"
            >
              {status === "working" ? "Working…" : "Generate keys & register"}
            </button>

            {status === "working" && (
              <p className="font-mono-display text-xs text-accent">{step}</p>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-accent underline-offset-4 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
