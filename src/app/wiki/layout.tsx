export const dynamic = "force-dynamic";

export default function WikiLayout({ children }: LayoutProps<"/wiki">) {
  return (
    <div>
      <h1 className="mb-6 text-title leading-[1.25] font-bold tracking-[-0.03em]">
        Wiki
      </h1>

      {children}
    </div>
  );
}
