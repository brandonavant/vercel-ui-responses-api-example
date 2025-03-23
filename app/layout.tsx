import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpenAI Responses API Chat',
  description: 'A chat interface using the OpenAI Responses API with streaming',
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
    <body className={`${inter.className} bg-gray-100 min-h-screen p-4`}>
    {children}
    </body>
    </html>
  );
}