import type { Metadata } from "next";
import "./globals.css";
import InstallApp from "./install-app";
export const viewport={themeColor:"#141810"};

export const metadata: Metadata = {
  title: "Diagrama de Estado | Banda",
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable:true,statusBarStyle:"black-translucent",title:"Diagrama"},
  description: "Agenda de shows, vídeos e bastidores da Diagrama de Estado.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: "/icons/icon-192.png",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased"><InstallApp/>{children}</body>
    </html>
  );
}
