import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import Starfield from "../components/Starfield";
import { api } from "../lib/api";
import { importPrivateKeyPem, decryptMessage } from "../lib/crypto";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Hollows" },
      {
        name: "description",
        content:
          "Your encrypted dead drop inbox. Upload your private key to decrypt messages locally — it never leaves your browser.",
      },
      { property: "og:title", content: "Inbox — Hollows" },
      {
        property: "og:description",
        content: "Decrypt your dead drop messages locally in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inbox,
});

function Inbox() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState(null); // null = loading
  const [privateKey, setPrivateKey] = useState(null);
  const [decrypted, setDecrypted] = useState({}); // message_id -> text | "__failed__"
  const [decrypting, setDecrypting] = useState(false);
  const [keyError, setKeyError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("hollows_user");
    if (!stored) {
      navigate({ to: "/login" });
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    api
      .getMessages(u.user_id)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [navigate]);

  async function handleKeyFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setKeyError("");
    try {
      const pem = await file.text();
      const key = await importPrivateKeyPem(pem);
      setPrivateKey(key);
    } catch {
      setKeyError("That file doesn't look like a valid private key.");
    }
  }

  async function decryptAll() {
    if (!privateKey || !messages) return;
    setDecrypting(true);
    const out = {};
    for (const m of messages) {
      try {
        out[m.message_id] = await decryptMessage(privateKey, m.cipher_text);
      } catch {
        out[m.message_id] = "__failed__";
      }
    }
    setDecrypted(out);
    setDecrypting(false);
  }

  useEffect(() => {
    if (privateKey && messages) decryptAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateKey, messages]);

  if (!user) return null;

  return (
    <div className="relative min-h-screen bg-background">
      <Starfield />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono-display text-xs tracking-[0.3em] text-accent uppercase">
              // secure inbox
            </p>
            <h1 className="font-mono-display mt-2 text-3xl font-bold text-foreground">
              {user.username}'s drops
            </h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("hollows_user");
              navigate({ to: "/" });
            }}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Log out
          </button>
        </div>

        {!privateKey && (
          <div className="glass-card mt-8 p-6 text-center">
            <div className="font-mono-display text-3xl">🔐</div>
            <h2 className="font-mono-display mt-3 text-lg font-semibold text-foreground">
              Upload your private key
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Decryption happens entirely in your browser. The key is never sent
              to the server.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".key,.pem"
              className="hidden"
              onChange={handleKeyFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-glow mt-4 rounded-lg px-6 py-3 font-mono-display text-sm font-semibold"
            >
              Choose private.key
            </button>
            {keyError && (
              <p className="mt-3 text-sm text-destructive">{keyError}</p>
            )}
          </div>
        )}

        {decrypting && (
          <div className="mt-8 flex items-center gap-3 text-accent">
            <span className="animate-lock inline-block text-xl">🔒</span>
            <p className="font-mono-display text-sm">Decrypting messages…</p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {messages === null ? (
            <p className="text-sm text-muted-foreground">Loading messages…</p>
          ) : messages.length === 0 ? (
            <div className="glass-card p-6 text-center text-sm text-muted-foreground">
              No messages yet. The void is quiet.
            </div>
          ) : (
            messages.map((m) => {
              const text = decrypted[m.message_id];
              return (
                <div key={m.message_id} className="glass-card p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono-display text-xs text-muted-foreground">
                      drop #{m.message_id} · {new Date(m.created_at).toLocaleString()}
                    </p>
                    <span className="text-accent">{text ? "🔓" : "🔒"}</span>
                  </div>
                  {text === undefined ? (
                    <p className="font-mono-display mt-3 break-all text-xs text-muted-foreground">
                      {m.cipher_text.slice(0, 120)}…
                    </p>
                  ) : text === "__failed__" ? (
                    <p className="mt-3 text-sm text-destructive">
                      Could not decrypt — this message wasn't encrypted with
                      your public key.
                    </p>
                  ) : (
                    <p className="mt-3 text-sm whitespace-pre-wrap text-foreground">
                      {text}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          <Link to="/" className="text-accent underline-offset-4 hover:underline">
            ← Back to Hollows
          </Link>
        </p>
      </main>
    </div>
  );
}
