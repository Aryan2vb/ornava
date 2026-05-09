import { BottomNav } from "./BottomNav";

type PhoneShellProps = {
  children: React.ReactNode;
  showNav?: boolean;
};

export function PhoneShell({ children, showNav = true }: PhoneShellProps) {
  return (
    <main className="screen">
      <section className="phone-frame">
        <div className="content">{children}</div>
        {showNav ? <BottomNav /> : null}
      </section>
    </main>
  );
}
