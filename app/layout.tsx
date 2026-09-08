import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '米克大叔 YouTube 創作台',
  description:
    '以現金流為核心，從選題、縮圖、本人訪談到腳本定稿，幫助普通上班族降低薪水依賴。',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
