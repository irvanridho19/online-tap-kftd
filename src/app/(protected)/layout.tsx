import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body className="min-h-full bg-slate-50 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

