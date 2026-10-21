import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "暖桌 · 今天玩什么？",
  description: "浏览桌游、投出想玩的一票，为喜欢的游戏打分。好游戏，围桌见。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
