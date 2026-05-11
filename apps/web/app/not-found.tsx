export default function NotFound() {
  return (
    <main className="screen">
      <section className="phone-frame">
        <div className="content" style={{ textAlign: "center", paddingTop: "80px" }}>
          <h1 className="title">404</h1>
          <p className="copy">Page not found.</p>
          <a className="button" href="/dashboard">Go home</a>
        </div>
      </section>
    </main>
  );
}
