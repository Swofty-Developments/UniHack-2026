import "~/styles/globals.css";

import { type Metadata } from "next";
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "~/components/providers/SessionProvider";
import { Navbar } from "~/components/layout/Navbar";

export const metadata: Metadata = {
  title: "AccessScan — LiDAR Accessibility Intelligence",
  description:
    "Scan any space with LiDAR, detect accessibility hazards with AI, get personalised routes based on your needs.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jakarta.variable} ${jetbrains.variable} dark`}
    >
      <body className="min-h-screen antialiased">
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
