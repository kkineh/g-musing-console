import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { currentMember } from "@/lib/auth";
import { roleLabel } from "@/lib/admin";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Musing",
  description: "SR 대응 자동화 콘솔",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /// 로그인 화면도 이 레이아웃을 타므로 requireMember를 쓰면 리다이렉트가 돈다.
  const member = await currentMember();

  return (
    <html
      lang="ko"
      className={`${inter.variable} ${notoSansKr.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        <AppShell
          name={member?.name ?? ""}
          role={member ? roleLabel(member.role) : ""}
          isAdmin={member?.role === "admin"}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
