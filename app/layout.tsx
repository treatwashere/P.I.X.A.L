import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nova AI — Think beyond",
  description: "Your creative space for ideas, code, research, and conversation.",
  applicationName: "Nova AI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}