import Link from "next/link";
import { GENERATION_MODES } from "@ornava/shared";
import { PhoneShell } from "@/components/PhoneShell";

const modeLabels = {
  on_model: "On-Model",
  studio: "Studio",
  close_up: "Close-Up",
} as const;

export default function GeneratingPage() {
  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Step 2</div>
        <h1 className="title">Choose output mode</h1>
      </div>
      <div className="panel">
        {GENERATION_MODES.map((mode) => (
          <button className="button secondary" key={mode} type="button">
            {modeLabels[mode]}
          </button>
        ))}
      </div>
      <div className="panel">
        <strong>Generation job</strong>
        <p className="copy">
          This will create a queued job using the selected Ornava model route,
          not a hard-coded provider model.
        </p>
      </div>
      <Link className="button" href="/result">
        View result placeholder
      </Link>
    </PhoneShell>
  );
}
