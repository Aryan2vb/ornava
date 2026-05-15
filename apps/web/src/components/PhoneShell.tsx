import { BottomNav } from "./BottomNav";
import { SidebarNav } from "./SidebarNav";

type PhoneShellProps = {
  children: React.ReactNode;
  showNav?: boolean;
};

export function PhoneShell({ children, showNav = true }: PhoneShellProps) {
  return (
    <div className="app-shell">
      {showNav && <SidebarNav />}
      <main className="app-main">
        <div className="app-content">{children}</div>
        {showNav && <BottomNav />}
      </main>
    </div>
  );
}
