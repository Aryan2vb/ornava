import { PhoneShell } from "@/components/PhoneShell";
import { UploadPanel } from "@/components/UploadPanel";

export default function UploadPage() {
  return (
    <PhoneShell>
      <div className="screen-header">
        <h1 className="title">Upload photo</h1>
        <p className="copy">
          Start with a clear jewelry photo. We&apos;ll prepare it for faster
          generation.
        </p>
      </div>
      <UploadPanel />
    </PhoneShell>
  );
}
