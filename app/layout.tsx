import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TwinMind — Live Meeting Copilot',
  description: 'Real-time AI suggestions for your conversations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
