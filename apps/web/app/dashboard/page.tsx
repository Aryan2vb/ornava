import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PhoneShell } from "@/components/PhoneShell";

export default function DashboardPage() {
  return (
    <PhoneShell>
      <div className="screen-header-row">
        <div className="screen-header">
          <h1 className="title">Ornava</h1>
          <p className="copy">WhatsApp-ready catalog images.</p>
        </div>
        <span className="credit-pill">
          <Icon name="plus" size={14} />
          18 credits
        </span>
      </div>
      <div className="soft-panel">
        <div className="screen-header-row">
          <div className="screen-header">
            <h2 className="title" style={{ fontSize: 22, lineHeight: "27px" }}>
              Create from a phone photo
            </h2>
            <p className="copy">
              Upload, choose style, and send the finished image to a buyer.
            </p>
          </div>
          <span className="icon-tile">
            <Icon name="camera" size={25} />
          </span>
        </div>
        <Link className="button" href="/upload">
          <Icon name="plus" size={17} />
          Start new image
        </Link>
      </div>
      <div className="screen-header-row">
        <strong style={{ fontSize: 17, lineHeight: "23px" }}>Recent work</strong>
        <span className="status-text" style={{ color: "var(--success)" }}>
          View all
        </span>
      </div>
      <div className="row-card">
        <span className="icon-tile" style={{ width: 58, height: 58 }}>
          <Icon name="image" size={25} />
        </span>
        <div className="row-card-body">
          <span className="row-title">Kundan choker</span>
          <span className="row-subtitle">Studio · 58 sec</span>
        </div>
        <span className="status-pill">
          <Icon name="check" size={13} />
          Usable
        </span>
      </div>
      <div className="row-card">
        <span
          className="icon-tile"
          style={{ width: 58, height: 58, background: "var(--ink)", color: "var(--gold-bright)" }}
        >
          <Icon name="spark" size={25} />
        </span>
        <div className="row-card-body">
          <span className="row-title">Ruby necklace</span>
        <span className="row-subtitle">On-model · running</span>
        </div>
        <span className="status-text">
          <span className="pulse-dot" aria-hidden="true" />
          Running
        </span>
      </div>
    </PhoneShell>
  );
}
