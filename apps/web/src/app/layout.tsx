import type { Metadata } from "next";
import { Providers } from "@/providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "TrustDSource - Verify. Trace. Trust.",
  description:
    "GenLayer-powered claim verification with evidence-bounded scoring, immutable snapshots, and on-chain report records.",
  keywords: [
    "fact check",
    "misinformation",
    "credibility",
    "GenLayer",
    "blockchain verification",
    "source analysis",
  ],
  openGraph: {
    title: "TrustDSource",
    description: "Evidence-bounded credibility verification on GenLayer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-primaryText antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
