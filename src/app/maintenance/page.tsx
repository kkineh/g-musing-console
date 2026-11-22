import Link from "next/link";
import { ErrorScreen, primaryButton } from "@/components/error-art";

export default function Maintenance() {
  return (
    <ErrorScreen
      code="503"
      title="점검 중입니다"
      description="잠시 후 다시 접속하면 됩니다."
    >
      <Link href="/" className={primaryButton}>
        다시 접속하기
      </Link>
    </ErrorScreen>
  );
}
