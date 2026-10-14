import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import Starfield from "../components/Starfield";
import { api } from "../lib/api";
import { importPublicKeyPem, encryptMessage } from "../lib/crypto";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Send a Message — Hollows" },
      {
        name: "description",
        content:
          "Send an anonymous, end-to-end encrypted message to a journalist. Encryption happens in your browser — the server never sees plaintext.",
      },
      { property: "og:title", content: "Send a Message — Hollows" },
      {
        property: "og:description",
        content: "Send an anonymous, end-to-end encrypted message to a journalist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sources,
});

function Sources() {
  const [username, setUsername] = useState("");
  const [verified, setVerified] = useState(null); // null | { user_id }
  const [verifyError, setVerifyError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  async function handleVerify(e) {
    e.preventDefault();
    setVerified(null);
    setVerifyError(false);
    setSent(false);
    setChecking(true);
    try {
      const res = await api.verify(username.trim());
      setVerified({ user_id: res.user_id });
    } catch {
      setVerifyError(true);
    } finally {
      setChecking(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    setSendError("");
    setSending(true);
    try {
      const { public_key } = await api.getPubKey(verified.user_id);
      const publicKey = await importPublicKeyPem(public_key);
      const ciphertext = await encryptMessage(publicKey, message);
      await api.drop({ user_id: verified.user_id, message: ciphertext });
      setSent(true);
      setMessage("");
    } catch (err) {
      setSendError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Starfield />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="glass-card w-full max-w-lg p-8">
          <p className="font-mono-display text-xs tracking-[0.3em] text-accent uppercase">
            // anonymous source
          </p>
          <h1 className="font-mono-display mt-2 text-2xl font-bold text-foreground">
            Send a Message
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your message is encrypted in this browser before it goes anywhere.
          </p>

          <form onSubmit={handleVerify} className="mt-6 flex gap-2">
            <input
              className="input-space flex-1 px-4 py-3 text-sm"
              placeholder="Journalist username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setVerified(null);
                setVerifyError(false);
                setSent(false);
              }}
              required
            />
            <button
              type="submit"
              disabled={checking}
              className="btn-glow-cyan rounded-lg px-5 py-3 font-mono-display text-sm font-semibold disabled:opacity-50"
            >
              {checking ? "…" : "Verify"}
            </button>
          </form>

          {verifyError && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="font-mono-display text-sm font-semibold text-destructive">
                ✕ This journalist's identity could not be verified. Do not send
                messages.
              </p>
            </div>
          )}

          {verified && (
            <>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-success/50 bg-success/10 px-4 py-3">
                <span className="text-success">✓</span>
                <p className="font-mono-display text-sm font-semibold text-success">
                  Identity Verified
                </p>
              </div>

              {sent ? (
                <div className="mt-6 rounded-lg border border-success/50 bg-success/10 p-4">
                  <p className="text-sm text-success">
                    Your message has been delivered. It is encrypted and cannot
                    be read by anyone except the journalist.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="mt-6 space-y-4">
                  <textarea
                    className="input-space w-full px-4 py-3 text-sm"
                    rows={6}
                    placeholder="Write your message. Keep it under ~190 characters — RSA-2048 can only encrypt small payloads directly."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={190}
                    required
                  />
                  {sendError && (
                    <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {sendError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-glow w-full rounded-lg px-6 py-3 font-mono-display text-sm font-semibold disabled:opacity-50"
                  >
                    {sending ? "Encrypting & sending…" : "Encrypt & send"}
                  </button>
                </form>
              )}
            </>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="text-accent underline-offset-4 hover:underline">
              ← Back to Hollows
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
