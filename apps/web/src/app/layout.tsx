import type { Metadata } from "next";
import { Providers } from "@/providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Trustdsource — Verify. Trace. Trust.",
  description:
    "GenLayer-powered misinformation detection and credibility verification platform. Submit any content, get an immutable on-chain credibility score.",
  keywords: [
    "fact check",
    "misinformation",
    "credibility",
    "GenLayer",
    "blockchain verification",
    "source analysis",
  ],
  openGraph: {
    title: "Trustdsource",
    description: "AI-powered credibility verification on GenLayer",
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
