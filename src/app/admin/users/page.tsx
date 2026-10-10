import {
  createUserAction,
  deleteUserAction,
  resetPasswordAction,
  updateUserRoleAction,
} from "../actions";
import { listMembers, recentAudit, ROLES } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [members, me, audit] = await Promise.all([
    listMembers(),
    requireAdmin(),
    recentAudit(10),
  ]);

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6">
        <h1 className="mb-1.5 text-[27px] leading-[1.25] font-bold tracking-[-0.03em]">
          계정 관리
        </h1>
        <p className="text-[14.5px] text-text-3">
          회원가입은 없습니다. 여기서 계정을 발급하고 권한을 정합니다.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-2">
        {members.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-card-sm"
          >
            <div className="min-w-[180px] flex-1">
              <div className="text-[14.5px] font-medium text-text">
                {u.name}
                {u.id === me.id && (
                  <span className="ml-2 text-[12px] text-text-3">나</span>
                )}
              </div>
              <div className="font-mono text-[12.5px] text-text-3">
                {u.loginId} · {u.email}
              </div>
            </div>

            <span className="font-mono text-[12.5px] text-text-3">
              대화 {u._count.chats} · 채점 {u._count.scores}
            </span>

            <form action={updateUserRoleAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={u.id} />
              <select
                name="role"
                defaultValue={u.role}
                className="cursor-pointer rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-text-2 outline-none focus:outline-2 focus:outline-accent-line"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-surface-3 px-2.5 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-line hover:text-text"
              >
                변경
              </button>
            </form>

            <form action={resetPasswordAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={u.id} />
              <input
                name="password"
                type="password"
                required
                placeholder="새 비밀번호"
                autoComplete="new-password"
                className="w-[128px] rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[12.5px] outline-none focus:outline-2 focus:outline-accent-line"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-surface-3 px-2.5 py-1.5 text-[12.5px] font-medium text-text-2 hover:bg-line hover:text-text"
              >
                재설정
              </button>
            </form>

            {u.id !== me.id && u._count.chats === 0 && u._count.scores === 0 && (
              <form action={deleteUserAction}>
                <input type="hidden" name="id" value={u.id} />
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
        action={createUserAction}
        className="mb-8 rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm"
      >
        <h2 className="mb-3 text-[13px] font-semibold text-text-3">계정 추가</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="name"
            required
            placeholder="이름"
            className="w-[140px] rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13.5px] outline-none focus:outline-2 focus:outline-accent-line"
          />
          <input
            name="loginId"
            required
            pattern="[a-z0-9._-]+"
            placeholder="로그인 아이디"
            title="영소문자, 숫자, . _ - 만"
            className="w-[140px] rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13.5px] outline-none focus:outline-2 focus:outline-accent-line"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="회사 이메일"
            className="min-w-[180px] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13.5px] outline-none focus:outline-2 focus:outline-accent-line"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="초기 비밀번호"
            autoComplete="new-password"
            className="w-[140px] rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13.5px] outline-none focus:outline-2 focus:outline-accent-line"
          />
          <select
            name="role"
            defaultValue="user"
            className="cursor-pointer rounded-lg border border-line bg-surface px-2.5 py-2 text-[13px] text-text-2 outline-none"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-on-accent hover:bg-accent-deep"
          >
            추가
          </button>
        </div>
      </form>

      {audit.length > 0 && (
        <div>
          <h2 className="mb-2.5 text-[13px] font-semibold text-text-3">
            최근 변경
          </h2>
          <div className="flex flex-col gap-1">
            {audit.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px]"
              >
                <span className="font-mono text-text-3">
                  {formatDateTime(a.createdAt)}
                </span>
                <span className="text-text-2">{a.actor.name}</span>
                <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11.5px] text-text-2">
                  {a.action}
                </span>
                <span className="text-text-3">{a.target}</span>
                {a.detail && <span className="text-text-3">{a.detail}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
