"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginCardProps = {
  callbackUrl: string;
  googleConfigured: boolean;
  oauthFailed: boolean;
};

type Mode = "sign-in" | "sign-up";

const MIN_PASSWORD_LENGTH = 6;

function authErrorMessage(message: string | undefined, mode: Mode) {
  const text = message?.toLowerCase() ?? "";
  if (text.includes("invalid login credentials")) return "Wrong email or password.";
  if (text.includes("already registered")) return "An account with this email already exists. Sign in instead.";
  if (text.includes("password")) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (text.includes("email")) return "Enter a valid email address.";
  if (text.includes("fetch") || text.includes("network")) return "Network error. Check your connection and try again.";
  return mode === "sign-up" ? "Could not create your account. Try again." : "Could not sign you in. Try again.";
}

export function LoginCard({ callbackUrl, googleConfigured, oauthFailed }: LoginCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthFailed ? "Google sign-in did not finish. Try again." : null,
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "sign-up" && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const credentials = { email: email.trim(), password };
      const { data, error: authError } =
        mode === "sign-up"
          ? await supabase.auth.signUp(credentials)
          : await supabase.auth.signInWithPassword(credentials);

      if (authError || !data.session) {
        setError(authErrorMessage(authError?.message, mode));
        return;
      }

      router.push(callbackUrl as Route);
      router.refresh();
    });
  }

  function handleGoogle() {
    setError(null);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", callbackUrl);

    void createSupabaseBrowserClient()
      .auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } })
      .then(({ error: oauthError }) => {
        if (oauthError) setError("Could not start Google sign-in. Try again.");
      });
  }

  function toggleMode() {
    setError(null);
    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
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

        {/* Google CTA: shown only when Google is enabled in Supabase Auth */}
        {googleConfigured && (
          <button
            className="login-google-btn"
            type="button"
            onClick={handleGoogle}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        )}

        {/* Trust signals */}
        <p className="login-trust">Your uploaded photos stay private.</p>

        {/* Email + password */}
        <div className="login-dev-section">
          <form className="login-dev-form" onSubmit={handleSubmit} noValidate>
            <input
              aria-label="Email"
              className="login-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              aria-label="Password"
              className="login-input"
              type="password"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              placeholder={mode === "sign-up" ? `Password (${MIN_PASSWORD_LENGTH}+ characters)` : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="login-dev-btn"
              type="submit"
              disabled={isPending || !email.trim() || !password}
            >
              {isPending
                ? mode === "sign-up" ? "Creating account..." : "Signing in..."
                : mode === "sign-up" ? "Create account" : "Sign in with email"}
            </button>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-dev-toggle" type="button" onClick={toggleMode}>
              {mode === "sign-in" ? "New to Ornava? Create an account" : "Already have an account? Sign in"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
