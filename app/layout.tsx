import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const headingFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "MCQ Hub",
  description: "Practice MCQs with timer, scoring, and answer review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        <div className="site-disclaimer-banner" role="note">
          <strong>Disclaimer:</strong> Questions and answers may contain mistakes. After you press{" "}
          <strong>Check Answer</strong>, review the <strong>Why</strong> reference and verify it with your lecture
          material.
        </div>
        {children}
      </body>
    </html>
  );
}
