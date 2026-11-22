"use client";

import Link from "next/link";
import {
  ErrorScreen,
  primaryButton,
  secondaryButton,
} from "@/components/error-art";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <ErrorScreen
      code="500"
      title="문제가 생겼습니다"
      description="일시적인 오류일 수 있으니 다시 시도하면 됩니다."
    >
      <button type="button" onClick={() => retry()} className={primaryButton}>
        다시 시도
      </button>
      <Link href="/" className={secondaryButton}>
        홈으로 돌아가기
      </Link>
    </ErrorScreen>
  );
}
