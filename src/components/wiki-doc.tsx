import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDate } from "@/lib/format";

export function WikiDocView({
  category,
  title,
  body,
  updatedAt,
}: {
  category: string;
  title: string;
  body: string;
  updatedAt: Date;
}) {
  return (
    <article className="rounded-2xl bg-surface px-9 pt-8 pb-10 shadow-card">
      <div className="mb-6">
        <div className="mb-2 text-[13.5px] text-text-3">
          {category} › {title}
        </div>
        <h2 className="mb-3.5 text-[29px] leading-[1.25] font-bold tracking-[-0.03em]">
          {title}
        </h2>
        <div className="text-[13.5px] text-text-3">
          최종 수정 {formatDate(updatedAt)}
        </div>
      </div>

      <div className="text-[15.5px] leading-[1.9] text-text-2">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (props) => (
              <h3
                className="mt-7 mb-3 text-[18px] font-semibold tracking-[-0.015em] text-text first:mt-0"
                {...props}
              />
            ),
            h2: (props) => (
              <h3
                className="mt-7 mb-3 text-[18px] font-semibold tracking-[-0.015em] text-text first:mt-0"
                {...props}
              />
            ),
            h3: (props) => (
              <h4
                className="mt-6 mb-2.5 text-[16px] font-semibold text-text first:mt-0"
                {...props}
              />
            ),
            p: (props) => <p className="mb-3.5" {...props} />,
            ul: (props) => (
              <ul className="mb-3.5 list-disc pl-5.5" {...props} />
            ),
            ol: (props) => (
              <ol className="mb-3.5 list-decimal pl-5.5" {...props} />
            ),
            li: (props) => <li className="mb-1" {...props} />,
            strong: (props) => (
              <strong className="font-semibold text-text" {...props} />
            ),
            a: (props) => (
              <a
                className="border-b border-accent-line text-accent no-underline"
                {...props}
              />
            ),
            code: (props) => (
              <code
                className="rounded-[5px] bg-surface-3 px-1.5 py-0.5 font-mono text-[13.5px] text-text"
                {...props}
              />
            ),
            pre: (props) => (
              <pre
                className="mb-4 overflow-x-auto rounded-xl bg-surface-2 p-4 font-mono text-[13px] leading-[1.7] text-text"
                {...props}
              />
            ),
            blockquote: (props) => (
              <blockquote
                className="mb-4 rounded-xl bg-accent-soft px-5 py-4 text-[14.5px] leading-[1.75]"
                {...props}
              />
            ),
            table: (props) => (
              <div className="mb-5 overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-sm" {...props} />
              </div>
            ),
            th: (props) => (
              <th
                className="bg-surface-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-text-2 first:rounded-tl-lg last:rounded-tr-lg"
                {...props}
              />
            ),
            td: (props) => (
              <td
                className="border-t border-line-soft px-3.5 py-2.5 text-text-2"
                {...props}
              />
            ),
            hr: () => <hr className="my-6 border-line-soft" />,
          }}
        >
          {body}
        </Markdown>
      </div>
    </article>
  );
}
