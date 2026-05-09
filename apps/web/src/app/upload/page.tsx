import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";

export default function UploadPage() {
  return (
    <PhoneShell>
      <div>
        <div className="eyebrow">Step 1</div>
        <h1 className="title">Upload jewelry photos</h1>
      </div>
      <div className="panel" aria-label="Upload dropzone placeholder">
        <strong>JPG or PNG, up to 20MB</strong>
        <p className="copy">
          The implementation will upload directly to private R2 storage using a
          signed URL, then create a compressed working copy for generation.
        </p>
        <button className="button secondary" type="button">
          Choose photo
        </button>
      </div>
      <Link className="button" href="/generating">
        Continue to generation
      </Link>
    </PhoneShell>
  );
}
