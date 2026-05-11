import { Suspense } from "react";
import { GenerationPanel } from "@/components/GenerationPanel";
import { PhoneShell } from "@/components/PhoneShell";

export default function GeneratingPage() {
  return (
    <PhoneShell>
      <Suspense fallback={<p className="copy">Loading generation options...</p>}>
        <GenerationPanel />
      </Suspense>
    </PhoneShell>
  );
}
