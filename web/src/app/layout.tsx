import type { Metadata } from "next";
import { Sora, DM_Sans, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";
import { SetupRequiredGuard } from "../components/SetupRequiredGuard";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sora",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Shadowfeed - AI Generated Content",
  description: "Platforma de inteligencia artificial para criação de conteúdo",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${spaceGrotesk.variable} ${sora.variable} ${dmSans.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <SetupRequiredGuard>{children}</SetupRequiredGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
