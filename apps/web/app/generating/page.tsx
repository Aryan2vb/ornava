import { Suspense } from "react";
import { GenerationPanel } from "@/components/GenerationPanel";
import { PhoneShell } from "@/components/PhoneShell";

export default function GeneratingPage() {
  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Step 2</div>
        <h1 className="title">Choose output mode</h1>
      </div>
      <Suspense fallback={<p className="copy">Loading generation options...</p>}>
        <GenerationPanel />
      </Suspense>
    </PhoneShell>
  );
}
