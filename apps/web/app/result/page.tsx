import { Suspense } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { ResultView } from "@/components/ResultView";

export default function ResultPage() {
  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Step 3</div>
        <h1 className="title">Review output</h1>
      </div>
      <Suspense fallback={<p className="copy">Loading result...</p>}>
        <ResultView />
      </Suspense>
    </PhoneShell>
  );
}
