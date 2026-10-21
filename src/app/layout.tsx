import type { Metadata } from "next";
import {
  Lexend,
  Nunito,
  Playfair_Display,
  Noto_Serif_Display,
} from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import NextAuthErrorBoundary from "@/components/auth/NextAuthErrorBoundary";
import { ToasterProvider } from "@/components/ui/ToasterProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeScript } from "@/components/theme/ThemeScript";
import "./globals.css";

/**
 * FONT SYSTEM: Hướng 3 — Lexend + Nunito (thân thiện)
 * ──────────────────────────────────────────────────────────────
 * Lexend           → Body / UI / app chrome  (đọc rõ, có vietnamese)
 * Nunito           → Headings / section titles (bo tròn, gần vibe cũ)
 * Playfair Display → Decorative / hero
 * Noto Serif Display → Badge / label serif
 * ──────────────────────────────────────────────────────────────
 */

/** Body + UI + student/mentor/admin chrome */
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

/** Headings / section titles */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

/** Decorative / display serif */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

/** Decorative label / badge serif */
const notoSerifDisplay = Noto_Serif_Display({
  variable: "--font-noto-serif-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const fontVariables = [
  lexend.variable,
  nunito.variable,
  playfair.variable,
  notoSerifDisplay.variable,
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://holyann.com",
  ),
  title: {
    default: "Holyann Explore (Holyann Explore) - Nền Tảng Holie Mate Hỗ Trợ Du Học Toàn Diện",
    template: "%s | Holyann Explore",
  },
  description:
    "Nền tảng Holie Mate hỗ trợ du học toàn diện với phân tích hồ sơ SWOT, bài test RIASEC/MBTI/Grit Scale, gợi ý trường DREAM/MATCH/SAFETY, tư vấn trực tiếp với Cố vấn, và cải thiện CV/luận văn.",
  keywords: [
    "du học",
    "study abroad",
    "Holie Mate du học",
    "tư vấn du học",
    "học bổng",
    "RIASEC",
    "MBTI",
    "Grit Scale",
    "SWOT analysis",
    "Holyann",
    "Holyann Explore",
    "du học Mỹ",
    "du học Châu Á",
    "du học Châu Âu",
  ],
  authors: [{ name: "HolyAnn Team" }],
  creator: "HolyAnn",
  publisher: "HolyAnn",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "Holyann Explore",
    title: "Holyann Explore (Holyann Explore) - Nền Tảng Holie Mate Hỗ Trợ Du Học Toàn Diện",
    description:
      "Nền tảng Holie Mate hỗ trợ du học toàn diện với phân tích hồ sơ SWOT, bài test RIASEC/MBTI/Grit Scale, gợi ý trường DREAM/MATCH/SAFETY, tư vấn trực tiếp với Cố vấn, và cải thiện CV/luận văn.",
    images: [
      {
        url: "/images/logos/logo HoEx (3).png",
        width: 1200,
        height: 630,
        alt: "Holyann Explore Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Holyann Explore (Holyann Explore) - Nền Tảng Holie Mate Hỗ Trợ Du Học Toàn Diện",
    description:
      "Nền tảng Holie Mate hỗ trợ du học toàn diện với phân tích hồ sơ SWOT, bài test RIASEC/MBTI/Grit Scale, gợi ý trường DREAM/MATCH/SAFETY, tư vấn trực tiếp với Cố vấn, và cải thiện CV/luận văn.",
    images: ["/images/logos/logo HoEx (3).png"],
    creator: "@holyann",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/logos/Logo Holyann nhỏ.png",
    shortcut: "/images/logos/Logo Holyann nhỏ.png",
    apple: "/images/logos/Logo Holyann nhỏ.png",
  },
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  category: "Education",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link
          rel="icon"
          href="/images/logos/Logo Holyann nhỏ.png"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href="/images/logos/Logo Holyann nhỏ.png"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${fontVariables} antialiased font-sans transition-colors duration-300`}
      >
        <ThemeProvider>
          <AuthProvider>
            <NextAuthErrorBoundary>{children}</NextAuthErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
