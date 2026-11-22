import Link from "next/link";
import { ErrorScreen, primaryButton } from "@/components/error-art";

export default function Forbidden() {
  return (
    <ErrorScreen
      code="403"
      title="이 화면을 볼 권한이 없습니다"
      description="관리자만 볼 수 있는 화면입니다."
    >
      <Link href="/" className={primaryButton}>
        홈으로 돌아가기
      </Link>
    </ErrorScreen>
  );
}
