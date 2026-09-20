import { notFound } from "next/navigation";
import { followUpAction } from "@/app/actions";
import { Composer } from "@/components/composer";
import { TurnCard } from "@/components/turn-card";
import { getChat } from "@/lib/chats";
import { chatNo } from "@/lib/format";

export default async function ChatPage({ params }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const chatId = Number(id);
  if (!Number.isInteger(chatId)) notFound();

  const chat = await getChat(chatId);
  if (!chat) notFound();

  const last = chat.turns.at(-1);
  const canFollowUp = last?.status === "DONE" || last?.status === "FAILED";

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="font-mono text-[13px] text-text-3">
          {chatNo(chat.id)}
        </span>
        <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[12.5px] text-text-2">
          {chat.memberName}
        </span>
      </div>

      <div className="flex flex-col gap-4.5">
        {chat.turns.map((turn) => (
          <TurnCard key={turn.id} turn={turn} userName={chat.userName} />
        ))}
      </div>

      {canFollowUp && (
        <Composer
          action={followUpAction}
          memberName={chat.memberName}
          hidden={{ chatId: chat.id }}
          placeholder="이어서 물어보세요"
        />
      )}
    </div>
  );
}
