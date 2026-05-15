"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

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
  const [showDev, setShowDev] = useState(false);
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
        setError("Invalid credentials. Check your email and code.");
      });
    });
  }

  return (
    <section className="login-page">
      <div className="login-card">
        {/* Brand */}
        <span className="login-eyebrow">Ornava</span>

        {/* Value prop */}
        <h1 className="login-title">
          Turn phone photos into catalog images
        </h1>
        <p className="login-subtitle">
          5 free images. No credit card. Ready in 90 seconds.
        </p>

        {/* Google CTA */}
        <button
          className="login-google-btn"
          type="button"
          disabled={!googleConfigured}
          onClick={() => signIn("google", { callbackUrl })}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Trust signals */}
        <p className="login-trust">Your uploaded photos stay private.</p>

        {/* Dev access (hidden by default) */}
        {devCredentialsConfigured && (
          <div className="login-dev-section">
            {!showDev ? (
              <button
                className="login-dev-toggle"
                type="button"
                onClick={() => setShowDev(true)}
              >
                Dev access →
              </button>
            ) : (
              <div className="login-dev-form">
                <input
                  aria-label="Email"
                  className="login-input"
                  placeholder="dev@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  aria-label="Code"
                  className="login-input"
                  placeholder="Access code"
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  className="login-dev-btn"
                  type="button"
                  disabled={isPending || !email.trim() || !code.trim()}
                  onClick={handleDevSignIn}
                >
                  {isPending ? "Checking..." : "Sign in"}
                </button>
                {error && <p className="login-error">{error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
