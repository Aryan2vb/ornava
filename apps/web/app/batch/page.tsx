import { Suspense } from "react";
import { BatchPanel } from "@/components/BatchPanel";
import { PhoneShell } from "@/components/PhoneShell";

export default function BatchPage() {
  return (
    <PhoneShell>
      <Suspense fallback={<p className="copy">Loading...</p>}>
        <BatchPanel />
      </Suspense>
    </PhoneShell>
  );
}
