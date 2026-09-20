import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import CursorGlow from "./components/CursorGlow";
import Nav from "./components/Nav";

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
  title: "ChainCare",
  description: "Every step of your donation, verifiable on Hedera.",
  icons: {
    icon: "/chaincare-logo.png",
    shortcut: "/chaincare-logo.png",
    apple: "/chaincare-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <CursorGlow />
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}