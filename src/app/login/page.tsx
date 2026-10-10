import Image from "next/image";
import { redirect } from "next/navigation";
import { currentMember } from "@/lib/auth";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  if (await currentMember()) redirect("/");

  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* 수학적 정중앙은 눈에 아래로 치우쳐 보인다. 로고+폼 묶음을 살짝 올린다. */}
      <div className="w-full max-w-[332px] -translate-y-[4vh]">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="musing"
            width={26}
            height={25}
            priority
            className="logo-light shrink-0"
          />
          <Image
            src="/logo-dark.svg"
            alt="musing"
            width={26}
            height={25}
            priority
            className="logo-dark shrink-0"
          />
          <span className="text-[19px] font-bold tracking-[-0.02em]">
            musing
          </span>
        </div>

        <LoginForm next={next} />
      </div>
    </main>
  );
}
