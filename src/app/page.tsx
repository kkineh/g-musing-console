import Link from "next/link";
import { askAction } from "./actions";
import { Composer } from "@/components/composer";
import { listChats } from "@/lib/chats";
import { listMembers } from "@/lib/session";
import { chatNo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AskPage() {
  const [members, recent] = await Promise.all([listMembers(), listChats(10)]);

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6">
        <h1 className="mb-1.5 text-[27px] leading-[1.25] font-bold tracking-[-0.03em]">
          무엇을 확인할까요
        </h1>
        <p className="text-[14.5px] text-text-3">
          SR 내용을 그대로 붙여넣으면 저장소와 DB를 읽어 근거와 함께 답합니다.
        </p>
      </div>

      <Composer action={askAction} members={members} />

      {recent.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-[13px] font-semibold text-text-3">
            최근 질의
          </h2>
          <div className="flex flex-col gap-2">
            {recent.map((chat) => (
              <Link
                key={chat.id}
                href={`/c/${chat.id}`}
                className="rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-card-sm hover:border-gray-node-line"
              >
                <div className="mb-1 flex items-center gap-2.5">
                  <span className="font-mono text-[13px] text-text-3">
                    {chatNo(chat.id)}
                  </span>
                  <span className="rounded-md bg-surface-3 px-2.5 py-0.5 text-[12.5px] text-text-2">
                    {chat.member.name}
                  </span>
                </div>
                <div className="line-clamp-1 text-[14.5px] text-text-2">
                  {chat.title ?? chat.turns[0]?.question ?? "제목 없음"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
