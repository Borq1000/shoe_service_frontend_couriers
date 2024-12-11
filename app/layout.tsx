import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import NavBar from "@/components/NavBar";
import { NotificationProvider } from "@/providers/notification-provider";
import { QueryClientProvider } from "@/providers/query-client-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Курьерское приложение",
  description: "Приложение для курьеров сервиса ремонта обуви",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="ru">
        <body className={inter.className}>
          <QueryClientProvider>
            <NotificationProvider>
              <div className="min-h-screen bg-gray-50">
                <NavBar />
                <main>{children}</main>
              </div>
            </NotificationProvider>
          </QueryClientProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
