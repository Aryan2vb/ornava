import { PhoneShell } from "@/components/PhoneShell";

export default function AdminGenerationsPage() {
  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Admin</div>
        <h1 className="title">Generation debug</h1>
      </div>
      <div className="panel">
        <strong>Minimal beta support view</strong>
        <p className="copy">
          This route will show generation status, model route, provider model,
          duration, failure code, feedback reason, and retry actions.
        </p>
      </div>
    </PhoneShell>
  );
}
