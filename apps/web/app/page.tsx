import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="landing">
      <div className="landing-container">
        <span className="landing-eyebrow">Ornava</span>
        <h1 className="landing-headline">
          Phone photo to catalog image in 60 seconds
        </h1>
        <p className="landing-subhead">
          Upload your jewelry photo. We give you a studio-quality result — ready to send on WhatsApp.
        </p>
        <Link href="/login" className="landing-cta-primary">
          Get Started Free
        </Link>
        <div className="landing-steps">
          <span>Upload</span>
          <span className="landing-arrow">→</span>
          <span>Style</span>
          <span className="landing-arrow">→</span>
          <span>Share</span>
        </div>
      </div>
    </main>
  );
}
