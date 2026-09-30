export const dynamic = "force-dynamic";

export default function WikiLayout({ children }: LayoutProps<"/wiki">) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1.5 text-[27px] leading-[1.25] font-bold tracking-[-0.03em]">
          지식베이스
        </h1>
        <p className="text-[14.5px] text-text-3">
          엔진이 참조하는 도메인 문서입니다.
        </p>
      </div>

      {children}
    </div>
  );
}
