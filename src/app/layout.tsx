import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "词汇 · Vocab",
  description: "A personal Chinese vocabulary flashcard app.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <NavBar />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
