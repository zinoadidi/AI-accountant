import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MuiTheme } from "@/components/MuiTheme";

export const metadata: Metadata = {
  title: "AI Accountant",
  description: "AI-assisted bookkeeping and tax filing, starting with Estonia.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Accountant",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <Providers>
          <MuiTheme>{children}</MuiTheme>
        </Providers>
      </body>
    </html>
  );
}
