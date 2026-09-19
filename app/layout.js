import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "TrustGive — Real-time donation transparency",
  description: "Every step of your donation, verifiable on Hedera.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <nav className="nav">
          <a href="/" className="nav-brand">TrustGive</a>
          <div className="nav-links">
            <a href="/donate">Donate</a>
            <a href="/donations">Donations</a>
            <a href="/feed">Feed</a>
            <a href="/ngo">NGO</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}