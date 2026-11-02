import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/*
 * Inter — primary UI font
 * Using `variable` mode so the CSS variable --font-inter is injected
 * into the document and Tailwind's `font-sans` maps to it via @theme.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/*
 * JetBrains Mono — code / monospace font
 * Injected as --font-jetbrains-mono; Tailwind's `font-mono` maps to it.
 */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Senitor",
    template: "%s · Senitor",
  },
  description:
    "AI-powered personalized DSA learning assistant. Track your progress, understand your weaknesses, and get intelligent recommendations.",
  keywords: ["DSA", "algorithms", "data structures", "learning", "AI tutor"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      /*
       * Font CSS variables are applied here so every descendant
       * (including Server Components rendered in parallel routes)
       * has access to --font-inter and --font-jetbrains-mono.
       *
       * bg-bg-base  → Tailwind utility backed by var(--color-bg-base)
       * text-text-primary → backed by var(--color-text-primary)
       * antialiased → font smoothing
       * h-full      → allows full-height layouts
       */
      className={`${inter.variable} ${jetbrainsMono.variable} min-h-full antialiased bg-bg-base text-text-primary`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
