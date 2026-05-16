"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
import { LogoSettings } from "@/components/LogoSettings";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  credits: number;
  createdAt: string;
  inviteCodes: { id: string; code: string; max_uses: number; use_count: number; created_at: string }[];
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setProfile);
  }, []);

  function createInviteCode() {
    startTransition(async () => {
      const res = await fetch("/api/invite/codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) {
        const updated = await fetch("/api/profile").then((r) => r.json());
        setProfile(updated);
      }
    });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!profile) {
    return (
      <div className="app-shell">
        <SidebarNav />
        <main className="app-main"><div className="app-content"><p className="copy">Loading...</p></div></main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="app-main">
        <div className="app-content">
          <div className="screen-header-row">
            <div className="brand-row">
              <span className="brand-mark"><Icon name="user" size={22} /></span>
              <strong style={{ fontSize: "22px", lineHeight: "27px" }}>Profile</strong>
            </div>
          </div>

          <div className="panel" style={{ marginTop: "16px" }}>
            <strong>{profile.name || profile.email}</strong>
            <p className="copy">{profile.email}</p>
            <p className="copy" style={{ fontSize: "12px" }}>Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Credits</strong>
              <span className="status-pill">{profile.credits} remaining</span>
            </div>
            <p className="copy">Each generation uses 1 credit. You received 20 free credits with your invite code.</p>
          </div>

          <LogoSettings />

          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Invite Codes</strong>
              <button className="button secondary" type="button" disabled={isPending} onClick={createInviteCode} style={{ fontSize: "13px", padding: "6px 12px" }}>
                {isPending ? "..." : "+ New code"}
              </button>
            </div>
            <p className="copy">Share codes with other jewelers to give them beta access.</p>
            {profile.inviteCodes.length === 0 && <p className="copy" style={{ fontStyle: "italic" }}>No codes created yet.</p>}
            {profile.inviteCodes.map((ic) => (
              <div key={ic.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div>
                  <code style={{ fontSize: "14px", fontWeight: 600 }}>{ic.code}</code>
                  <span className="copy" style={{ marginLeft: "8px", fontSize: "12px" }}>{ic.use_count}/{ic.max_uses} used</span>
                </div>
                <button className="button secondary" type="button" onClick={() => copyCode(ic.code)} style={{ fontSize: "12px", padding: "4px 8px" }}>
                  {copied === ic.code ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </main>
    </div>
  );
}
