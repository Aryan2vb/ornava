import { Suspense } from "react";
import { BriefPanel } from "@/components/BriefPanel";
import { PhoneShell } from "@/components/PhoneShell";

export default function BriefPage() {
  return (
    <PhoneShell>
      <Suspense fallback={<p className="copy">Loading...</p>}>
        <BriefPanel />
      </Suspense>
    </PhoneShell>
  );
}
