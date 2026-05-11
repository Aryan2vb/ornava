"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export default function InvitePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/invite/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (res.ok) {
        // Force session refresh by reloading — token will now have hasInviteCode=true
        window.location.href = "/onboarding";
        return;
      }

      const data = await res.json();
      if (data.error === "invalid_or_used_code") {
        setError("Invalid or already used invite code.");
      } else {
        setError("Something went wrong. Try again.");
      }
    });
  }

  return (
    <main className="screen">
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
            <h1 className="title title-xl">Enter your invite code</h1>
            <p className="copy">
              Ornava is in private beta. Enter the invite code you received to get access.
            </p>
          </div>
          <div className="panel">
            <input
              aria-label="Invite code"
              className="input"
              placeholder="e.g. jeweler-beta-2026"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.trim()) handleSubmit();
              }}
            />
            <button
              className="button"
              type="button"
              disabled={isPending || !code.trim()}
              onClick={handleSubmit}
            >
              {isPending ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                <Icon name="arrow-right" size={16} />
              )}
              {isPending ? "Verifying..." : "Activate beta access"}
            </button>
            {error && <p className="status-text error">{error}</p>}
          </div>
          <p className="copy" style={{ textAlign: "center", fontSize: "12px" }}>
            Don&apos;t have a code? Ask an existing beta user to invite you.
          </p>
        </div>
      </section>
    </main>
  );
}
