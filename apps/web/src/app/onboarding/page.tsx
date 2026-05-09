import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";

export default function OnboardingPage() {
  return (
    <PhoneShell showNav={false}>
      <div>
        <div className="eyebrow">Ornava Phase 1</div>
        <h1 className="title">Create your first jewelry catalog image.</h1>
      </div>
      <p className="copy">
        Upload a raw jewelry photo, choose a catalog mode, and review the first AI
        output in one mobile-first flow.
      </p>
      <div className="panel">
        <strong>Activation target</strong>
        <p className="copy">
          First trusted generation within 90 seconds from signup.
        </p>
      </div>
      <Link className="button" href="/upload">
        Start with a photo
      </Link>
    </PhoneShell>
  );
}
