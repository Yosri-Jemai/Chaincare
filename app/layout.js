import "./globals.css";

export const metadata = {
  title: "TrustGive — Real-time donation transparency",
  description: "Every step of your donation, verifiable on Hedera.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <a href="/" className="nav-brand">TrustGive</a>
          <div className="nav-links">
            <a href="/donate">Donate</a>
            <a href="/feed">Feed</a>
            <a href="/ngo">NGO</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}