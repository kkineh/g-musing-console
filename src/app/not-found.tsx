import Link from "next/link";
import { ErrorScreen, primaryButton } from "@/components/error-art";

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="여기에는 아무것도 없습니다"
      description="주소가 잘못되었거나, 사라진 페이지입니다."
    >
      <Link href="/" className={primaryButton}>
        홈으로 돌아가기
      </Link>
    </ErrorScreen>
  );
}
