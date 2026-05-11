import { Suspense } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { ResultView } from "@/components/ResultView";

export default function ResultPage() {
  return (
    <PhoneShell>
      <Suspense fallback={<p className="copy">Loading result...</p>}>
        <ResultView />
      </Suspense>
    </PhoneShell>
  );
}
