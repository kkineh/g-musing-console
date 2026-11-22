import { requireAdmin } from "@/lib/auth";

/// /admin 아래 페이지를 새로 만들 때 가드를 빼먹지 않도록 여기서 한 번 막는다.
/// 다만 Server Action은 이 레이아웃을 타지 않으므로 액션마다 따로 걸어야 한다.
export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  await requireAdmin();
  return <>{children}</>;
}
