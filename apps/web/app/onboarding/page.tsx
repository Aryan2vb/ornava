import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PhoneShell } from "@/components/PhoneShell";

export default function OnboardingPage() {
  return (
    <PhoneShell showNav={false}>
      <div className="screen-header-row">
        <div className="brand-row">
          <span className="brand-mark">
            <Icon name="diamond" size={22} />
          </span>
          <strong style={{ fontSize: "22px", lineHeight: "27px" }}>Ornava</strong>
        </div>
        <span className="eyebrow">Step 1 of 3</span>
      </div>
      <div className="screen-header" style={{ paddingTop: "30px" }}>
        <h1 className="title title-xl">Your first catalog image in minutes.</h1>
        <p className="copy">
          Upload one real jewelry photo. Choose a selling style. Review the result
          before sharing.
        </p>
      </div>
      <div className="soft-panel">
        <div className="row-card" style={{ border: 0, padding: 0, background: "transparent" }}>
          <span className="icon-tile">
            <Icon name="clock" size={24} />
          </span>
          <div className="row-card-body">
            <strong>Designed for the first 90 seconds</strong>
            <p className="copy">The fastest path is upload, style, result.</p>
          </div>
        </div>
      </div>
      <div className="panel">
        <strong>How beta works</strong>
        {[
          ["camera", "Upload one photo", "Raw phone photos are okay."],
          ["user", "Choose a style", "On model, studio, or close-up."],
          ["check", "Approve or retry", "You decide if the result is usable."],
        ].map(([icon, title, copy]) => (
          <div className="row-card" style={{ border: 0, padding: 0 }} key={title}>
            <span className="icon-tile" style={{ width: 32, height: 32 }}>
              <Icon name={icon as "camera"} size={17} />
            </span>
            <div className="row-card-body">
              <span className="row-title">{title}</span>
              <span className="row-subtitle">{copy}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="soft-panel">
        <div className="row-card" style={{ border: 0, padding: 0, background: "transparent" }}>
          <Icon name="image" size={18} />
          <div className="row-card-body">
            <strong>Use real sample images</strong>
            <p className="copy">
              Add raw necklace and generated model samples when available.
            </p>
          </div>
        </div>
      </div>
      <Link className="button" href="/upload">
        <Icon name="arrow-right" size={17} />
        Upload first photo
      </Link>
    </PhoneShell>
  );
}
