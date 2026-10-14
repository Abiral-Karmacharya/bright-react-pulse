import { createFileRoute, Link } from "@tanstack/react-router";
import Starfield from "../components/Starfield";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hollows — Secure. Anonymous. Encrypted." },
      {
        name: "description",
        content:
          "A secure dead drop platform for journalists and anonymous sources. Messages are encrypted in your browser — the server never sees plaintext.",
      },
      { property: "og:title", content: "Hollows — Secure. Anonymous. Encrypted." },
      {
        property: "og:description",
        content:
          "A secure dead drop platform for journalists and anonymous sources. End-to-end encrypted in the browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen bg-background">
      <Starfield />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-mono-display text-xs tracking-[0.4em] text-accent uppercase">
          // dead drop protocol
        </p>
        <h1 className="font-mono-display text-glow-purple mt-6 text-6xl font-bold tracking-tight text-foreground sm:text-8xl">
          Hollows
        </h1>
        <p className="font-mono-display mt-4 text-lg text-muted-foreground sm:text-xl">
          Secure. Anonymous. Encrypted.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/register"
            className="btn-glow rounded-lg px-8 py-3 font-mono-display text-sm font-semibold"
          >
            I am a Journalist
          </Link>
          <Link
            to="/sources"
            className="btn-glow-cyan rounded-lg px-8 py-3 font-mono-display text-sm font-semibold"
          >
            Send a Message
          </Link>
        </div>

        <div className="glass-card mt-16 max-w-xl p-6 text-left">
          <h2 className="font-mono-display text-sm font-semibold text-accent">
            How it works
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground">Zero-knowledge by design.</span>{" "}
              Messages are encrypted in your browser with the journalist's
              public key before they ever leave your device.
            </li>
            <li>
              <span className="text-foreground">The server never sees plaintext.</span>{" "}
              Only ciphertext is stored — unreadable to anyone without the
              private key.
            </li>
            <li>
              <span className="text-foreground">The private key never leaves the journalist's browser.</span>{" "}
              Decryption happens locally, every time.
            </li>
          </ul>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="text-accent underline-offset-4 hover:underline">
            Journalist login
          </Link>
        </p>
      </main>
    </div>
  );
}
