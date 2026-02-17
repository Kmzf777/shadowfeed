import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Shadowfeed - AI Generated Content",
  description: "Platforma de inteligencia artificial para criação de conteúdo",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

import { cookies } from "next/headers";
import { LanguageProvider } from "../contexts/LanguageContext";
import { Language } from "../i18n/translations";

// ... existing imports

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'en') as Language;

  return (
    <html lang={locale}>
      <body
        className={`${sora.variable} ${dmSans.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider initialLanguage={locale}>
          <AuthProvider>
            <SetupRequiredGuard>{children}</SetupRequiredGuard>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
