import {
  createCompanyAction,
  deleteCompanyAction,
  renameCompanyAction,
} from "../actions";
import { listCompaniesWithCounts } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await listCompaniesWithCounts();

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6">
        <h1 className="mb-1.5 text-title leading-[1.25] font-bold tracking-[-0.03em]">
          회원사 관리
        </h1>
        <p className="text-body text-text-3">
          질의가 묶일 회원사를 등록하고 이름을 고칩니다.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-2">
        {companies.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-card-sm"
          >
            <div className="w-[120px] shrink-0">
              <span className="inline-block max-w-full truncate rounded-md bg-surface-3 px-2.5 py-0.5 align-middle font-mono text-caption text-text-2">
                {c.id}
              </span>
            </div>

            <form action={renameCompanyAction} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input
                name="name"
                defaultValue={c.name}
                className="min-w-[140px] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-body-sm outline-none focus:outline-2 focus:outline-accent-line"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-surface-3 px-2.5 py-1.5 text-caption font-medium text-text-2 hover:bg-line hover:text-text"
              >
                저장
              </button>
            </form>

            <div className="flex shrink-0 items-center gap-3">
              <span className="w-[80px] shrink-0 text-right font-mono text-caption text-text-3 tabular-nums">
                대화 {c._count.chats}건
              </span>

              <div className="w-[52px] shrink-0">
                {c._count.chats === 0 && (
                  <form action={deleteCompanyAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-lg px-2.5 py-1.5 text-caption text-text-3 hover:bg-danger-soft hover:text-danger"
                    >
                      삭제
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form
        action={createCompanyAction}
        className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm"
      >
        <h2 className="mb-3 text-label font-semibold text-text-3">회원사 추가</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="id"
            required
            pattern="[a-z0-9-]+"
            placeholder="식별자 (영소문자·숫자·-)"
            className="w-[190px] rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-label outline-none focus:outline-2 focus:outline-accent-line"
          />
          <input
            name="name"
            required
            placeholder="회원사 이름"
            className="min-w-[180px] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-body-sm outline-none focus:outline-2 focus:outline-accent-line"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-label font-semibold text-on-accent hover:bg-accent-deep"
          >
            추가
          </button>
        </div>
        <p className="mt-2 text-caption text-text-3">
          식별자는 엔진이 저장소·DB를 찾는 키입니다. 만든 뒤에는 바꿀 수 없습니다.
        </p>
      </form>
    </div>
  );
}
