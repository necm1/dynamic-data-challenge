import { Geist, Geist_Mono } from 'next/font/google';

import '@repo/ui/globals.css';
import { Providers } from '../components/providers';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/ui/components/sidebar';
import { AppSidebar } from '../components/app-sidebar';
import { Separator } from '@repo/ui/components/separator';
import { Toaster } from '@repo/ui/components/sonner';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
        suppressHydrationWarning
      >
        <Providers>
          <SidebarProvider
            style={
              {
                '--sidebar-width': 'calc(var(--spacing) * 72)',
                '--header-height': 'calc(var(--spacing) * 12)',
              } as React.CSSProperties
            }
          >
            <AppSidebar />
            <SidebarInset>
              {/* Header with trigger
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Dynamic Data Challenge</span>
                </div>
              </header>

              <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
                {children}
              </main> */}

              <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    {children}
                  </div>
                </div>
              </div>
            </SidebarInset>

            <Toaster position="top-right" richColors />
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
