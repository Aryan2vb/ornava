"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

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
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDevSignIn() {
    startTransition(() => {
      void signIn("credentials", {
        email,
        code,
        callbackUrl,
      });
    });
  }

  return (
    <section className="phone-frame">
      <div className="content">
        <div>
          <div className="eyebrow">Sign in</div>
          <h1 className="title">Access your Ornava workspace</h1>
        </div>
        <p className="copy">
          Phase 1 starts with one reliable beta path. Google sign-in is wired
          first; magic link can follow once SMTP is ready.
        </p>
        <div className="panel">
          <strong>Auth path</strong>
          <p className="copy">
            {googleConfigured
              ? "Google OAuth is configured and ready for beta users."
              : "Google OAuth env vars are not configured yet."}
          </p>
          <button
            className="button"
            type="button"
            disabled={!googleConfigured}
            onClick={() => signIn("google", { callbackUrl })}
          >
            Continue with Google
          </button>
        </div>
        <div className="panel">
          <strong>Development access</strong>
          <p className="copy">
            Use this only for local testing. It lets you verify route
            protection before Google OAuth is configured.
          </p>
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
            disabled={!devCredentialsConfigured || isPending}
            onClick={handleDevSignIn}
          >
            Continue with dev code
          </button>
        </div>
      </div>
    </section>
  );
}
