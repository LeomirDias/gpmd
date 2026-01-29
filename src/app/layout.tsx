import "./globals.css";

import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/providers/react-query";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iGenda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${roboto.className} antialiased`}>
        <ReactQueryProvider>
          <NuqsAdapter>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
            <SpeedInsights />
          </NuqsAdapter>
        </ReactQueryProvider>
        <Toaster position="bottom-center" richColors theme="light" />
      </body>
    </html>
  );
}
