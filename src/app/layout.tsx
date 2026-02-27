import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Black-Scholes Lab | Options Pricing Laboratory",
  description:
    "Interactive Black-Scholes options pricing calculator with Greeks, surfaces, payoff diagrams, and implied volatility tools.",
  keywords: [
    "Black-Scholes",
    "options pricing",
    "Greeks",
    "implied volatility",
    "financial engineering",
    "derivatives",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 min-h-screen`}
      >
        <NavBar />
        <main>{children}</main>
        <footer className="border-t border-zinc-800/50 py-6 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-xs text-zinc-600">
              Black-Scholes Lab &mdash; An interactive options pricing laboratory.
              Built with Next.js, Plotly, and KaTeX. All computations performed
              client-side.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
