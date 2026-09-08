import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '米克大叔 YouTube 創作台',
  description: '從選題判斷、縮圖包裝、本人訪談到腳本定稿的個人化 YouTube 創作工作台。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
