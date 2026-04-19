import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dealo Hub',
  description: 'Premium C2C marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
