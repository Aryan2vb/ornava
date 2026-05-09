import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";

export default function DashboardPage() {
  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Home</div>
        <h1 className="title">Your catalog images</h1>
      </div>
      <p className="copy">
        Phase 1 dashboard placeholder. The first production focus is the
        activation loop, not full inventory management.
      </p>
      <Link className="button" href="/upload">
        Generate another image
      </Link>
    </PhoneShell>
  );
}
