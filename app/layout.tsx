import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "슬로우 트레인 태권도",
  description: "발달장애인의 성장과 사회적 연결을 위한 슬로우 트레인 태권도 수업 예약 앱입니다.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "슬로우 트레인", statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
