"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

type LoginCardProps = {
  callbackUrl: string;
  googleConfigured: boolean;
  devCredentialsConfigured: boolean;
};

export function LoginCard({
  callbackUrl,
  googleConfigured,
  devCredentialsConfigured,
}: LoginCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDevSignIn() {
    setError(null);
    startTransition(() => {
      void signIn("credentials", {
        redirect: false,
        email: email.trim(),
        code: code.trim(),
        callbackUrl,
      }).then((result) => {
        if (result?.ok) {
          router.push(callbackUrl as Route);
          return;
        }

        setError("Use the exact beta dev email and code.");
      });
    });
  }

  return (
    <section className="phone-frame">
      <div className="content">
        <div className="screen-header-row">
          <div className="brand-row">
            <span className="brand-mark">
              <Icon name="diamond" size={22} />
            </span>
            <strong style={{ fontSize: "22px", lineHeight: "27px" }}>Ornava</strong>
          </div>
          <span className="status-pill">Private beta</span>
        </div>
        <div className="screen-header" style={{ paddingTop: "12px" }}>
          <h1 className="title title-xl">Catalog photos without the photoshoot.</h1>
          <p className="copy">
            Sign in to generate WhatsApp-ready jewelry images from phone photos.
          </p>
        </div>
        <div className="asset-slot">
          <span className="icon-tile">
            <Icon name="image" size={28} />
          </span>
          <div>
            <strong>Raw photo to catalog result</strong>
            <p className="copy">
              Add real raw/generated samples here once assets are available.
            </p>
          </div>
        </div>
        <div className="panel">
          <strong>Google access</strong>
          <p className="copy">
            {googleConfigured
              ? "Google sign-in is ready for invited beta users."
              : "Google OAuth env vars are not configured yet."}
          </p>
          <button
            className="button"
            type="button"
            disabled={!googleConfigured}
            onClick={() => signIn("google", { callbackUrl })}
          >
            <Icon name="arrow-right" size={16} />
            Continue with Google
          </button>
        </div>
        <div className="panel">
          <strong>Development access</strong>
          <input
            aria-label="Development email"
            className="input"
            disabled={!devCredentialsConfigured}
            placeholder="dev@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            aria-label="Development code"
            className="input"
            disabled={!devCredentialsConfigured}
            placeholder="dev code"
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <button
            className="button secondary"
            type="button"
            disabled={
              !devCredentialsConfigured ||
              isPending ||
              !email.trim() ||
              !code.trim()
            }
            onClick={handleDevSignIn}
          >
            {isPending ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <Icon name="lock" size={16} />
            )}
            {isPending ? "Checking..." : "Continue with dev code"}
          </button>
          {error ? <p className="status-text error">{error}</p> : null}
        </div>
        <p className="copy" style={{ textAlign: "center", fontSize: "12px" }}>
          For invited jewelers only. Your uploaded images stay private.
        </p>
      </div>
    </section>
  );
}
