import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "P.I.X.A.L. — Think beyond limits",
  description: "Your creative space for ideas, code, research, and conversation.",
  applicationName: "P.I.X.A.L.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}