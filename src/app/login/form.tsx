"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [error, action] = useActionState(loginAction, null);

  return (
    <form
      action={action}
      className="rounded-2xl border border-line bg-surface px-6 py-6 shadow-card-sm"
    >
      <input type="hidden" name="next" value={next} />

      <label className="mb-3.5 block">
        <span className="mb-1.5 block text-caption font-medium text-text-2">
          아이디
        </span>
        <input
          name="loginId"
          autoComplete="username"
          autoFocus
          required
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-body-sm outline-none focus:outline-2 focus:outline-accent-line"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-caption font-medium text-text-2">
          비밀번호
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-body-sm outline-none focus:outline-2 focus:outline-accent-line"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="mt-3.5 rounded-lg bg-danger-soft px-3 py-2.5 text-label leading-[1.6] text-danger"
        >
          {error}
        </p>
      )}

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 w-full cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-body-sm font-semibold text-on-accent hover:bg-accent-deep disabled:opacity-60"
    >
      {pending ? "확인 중…" : "로그인"}
    </button>
  );
}
