import {
  createMemberAction,
  deleteMemberAction,
  renameMemberAction,
} from "../actions";
import { listMembersWithCounts } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await listMembersWithCounts();

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6">
        <h1 className="mb-1.5 text-[27px] leading-[1.25] font-bold tracking-[-0.03em]">
          회원사 관리
        </h1>
        <p className="text-[14.5px] text-text-3">
          질의는 항상 하나의 회원사에 묶입니다. 저장소와 DB가 회원사마다 다릅니다.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-card-sm"
          >
            <span className="rounded-md bg-surface-3 px-2.5 py-0.5 font-mono text-[12.5px] text-text-2">
              {m.id}
            </span>

            <form action={renameMemberAction} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={m.id} />
              <input
                name="name"
                defaultValue={m.name}
                className="min-w-[140px] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[13.5px] outline-none focus:outline-2 focus:outline-accent-line"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-surface-3 px-2.5 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-line hover:text-text"
              >
                저장
              </button>
            </form>

            <span className="font-mono text-[12.5px] text-text-3">
              대화 {m._count.chats}
            </span>

            {m._count.chats === 0 && (
              <form action={deleteMemberAction}>
                <input type="hidden" name="id" value={m.id} />
                <button
                  type="submit"
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[12.5px] text-text-3 hover:bg-danger-soft hover:text-danger"
                >
                  삭제
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <form
        action={createMemberAction}
        className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm"
      >
        <h2 className="mb-3 text-[13px] font-semibold text-text-3">회원사 추가</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="id"
            required
            pattern="[a-z0-9-]+"
            placeholder="식별자 (영소문자·숫자·-)"
            className="w-[190px] rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[13px] outline-none focus:outline-2 focus:outline-accent-line"
          />
          <input
            name="name"
            required
            placeholder="회원사 이름"
            className="min-w-[180px] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13.5px] outline-none focus:outline-2 focus:outline-accent-line"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-on-accent hover:bg-accent-deep"
          >
            추가
          </button>
        </div>
        <p className="mt-2 text-[12px] text-text-3">
          식별자는 엔진이 저장소·DB를 찾는 키입니다. 만든 뒤에는 바꿀 수 없습니다.
        </p>
      </form>
    </div>
  );
}
