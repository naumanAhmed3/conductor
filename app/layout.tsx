import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conductor — Browser Automation Control Plane',
  description:
    'Author declarative browser-automation flows, run them with real headless Chromium, and observe every step, screenshot, and extracted value.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
