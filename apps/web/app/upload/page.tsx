import { PhoneShell } from "@/components/PhoneShell";
import { UploadPanel } from "@/components/UploadPanel";

export default function UploadPage() {
  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Step 1</div>
        <h1 className="title">Upload jewelry photos</h1>
      </div>
      <UploadPanel />
    </PhoneShell>
  );
}
