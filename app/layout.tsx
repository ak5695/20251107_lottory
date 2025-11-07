import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "彩票数据筛选工具",
  description: "彩票数据筛选和分析工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
