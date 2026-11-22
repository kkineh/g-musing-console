"use client";

import "./globals.css";
import { ErrorScreen, primaryButton } from "@/components/error-art";
import { ThemeSync } from "@/components/theme-sync";

/// 루트 레이아웃이 터지면 레이아웃도 폰트도 없으므로 문서와 스타일을 여기서 직접 잡는다.
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <ThemeSync />
        <ErrorScreen
          code="500"
          title="문제가 생겼습니다"
          description="일시적인 오류일 수 있으니 다시 시도하면 됩니다."
        >
          <button
            type="button"
            onClick={() => retry()}
            className={primaryButton}
          >
            다시 시도
          </button>
        </ErrorScreen>
      </body>
    </html>
  );
}
