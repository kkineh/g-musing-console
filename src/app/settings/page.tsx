import { updateProfileAction } from "../admin/actions";
import { roleLabel } from "@/lib/admin";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="mb-6">
        <h1 className="mb-1.5 text-[27px] leading-[1.25] font-bold tracking-[-0.03em]">
          내 설정
        </h1>
        <p className="text-[14.5px] text-text-3">
          로그인은 회사 MS 계정으로 합니다. 비밀번호는 여기서 관리하지 않습니다.
        </p>
      </div>

      <form
        action={updateProfileAction}
        className="rounded-2xl border border-line bg-surface px-5 py-4.5 shadow-card-sm"
      >
        <label className="mb-1.5 block text-[13px] font-semibold text-text-3">
          이름
        </label>
        <div className="flex items-center gap-2">
          <input
            name="name"
            defaultValue={user.name}
            required
            className="flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[14px] outline-none focus:outline-2 focus:outline-accent-line"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-on-accent hover:bg-accent-deep"
          >
            저장
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-line pt-4 text-[13px]">
          <Row label="이메일" value={user.email} mono />
          <Row label="권한" value={roleLabel(user.role)} />
        </div>
      </form>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[56px] text-text-3">{label}</span>
      <span className={mono ? "font-mono text-text-2" : "text-text-2"}>
        {value}
      </span>
    </div>
  );
}
