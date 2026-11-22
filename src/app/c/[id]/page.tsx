import { notFound } from "next/navigation";
import { followUpAction } from "@/app/actions";
import { Composer } from "@/components/composer";
import { TurnCard } from "@/components/turn-card";
import { requireMember } from "@/lib/auth";
import { getChat } from "@/lib/chats";
import { chatTypeLabel } from "@/lib/engine";
import { chatNo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const [chat, me] = await Promise.all([getChat(id), requireMember()]);
  if (!chat) notFound();
  /// 삭제된 대화는 채점 재료로 관리자에게만 남긴다.
  if (chat.deletedAt && me.role !== "admin") notFound();

  const last = chat.turns.at(-1);
  const canFollowUp =
    !chat.deletedAt &&
    (last?.status === "DONE" ||
    last?.status === "FAILED" ||
    last?.status === "CANCELED");

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="font-mono text-label text-text-3">
          {chatNo(chat.id)}
        </span>
        <span className="rounded-md bg-surface-3 px-2.5 py-0.5 text-caption text-text-2">
          {chat.companyName ?? "공통"}
        </span>
        <span className="rounded-md bg-surface-3 px-2.5 py-0.5 text-caption text-text-2">
          {chatTypeLabel(chat.type)}
        </span>
      </div>

      {chat.deletedAt && (
        <p className="mb-4.5 rounded-xl bg-surface-3 px-4 py-3 text-body-sm text-text-2">
          삭제된 대화입니다. 관리자에게만 보이며 이어서 질의할 수 없습니다.
        </p>
      )}

      <div className="flex flex-col gap-4.5">
        {chat.turns.map((turn) => (
          <TurnCard
            key={turn.id}
            turn={turn}
            memberName={chat.memberName}
            chatId={chat.id}
            chatType={chat.type}
          />
        ))}
      </div>

      {canFollowUp && (
        <Composer
          action={followUpAction}
          hidden={{ chatId: chat.id }}
          placeholder="이어서 물어보세요"
        />
      )}
    </div>
  );
}
