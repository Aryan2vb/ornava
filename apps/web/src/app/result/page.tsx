import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";

export default function ResultPage() {
  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Step 3</div>
        <h1 className="title">Review the output</h1>
      </div>
      <div className="panel">
        <strong>Original vs generated</strong>
        <p className="copy">
          The production view will show a mobile-friendly comparison and capture
          usable or not usable feedback before download/share.
        </p>
      </div>
      <div className="panel">
        <button className="button" type="button">
          Mark usable
        </button>
        <button className="button secondary" type="button">
          Not usable
        </button>
      </div>
      <Link className="button secondary" href="/dashboard">
        Finish onboarding
      </Link>
    </PhoneShell>
  );
}
