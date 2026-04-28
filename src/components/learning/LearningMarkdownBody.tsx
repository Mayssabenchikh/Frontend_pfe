import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema, type Schema } from "hast-util-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "loading", "decoding"],
  },
};

const markdownComponents: Components = {
  img: ({ node: _n, ...props }) => (
    <img
      {...props}
      loading="lazy"
      decoding="async"
      className="my-5 block max-h-[min(70vh,720px)] w-auto max-w-full rounded-xl border border-slate-200/90 object-contain shadow-sm"
    />
  ),
  a: ({ node: _n, ...props }) => (
    <a {...props} className="font-semibold text-sky-700 underline decoration-sky-300/70 underline-offset-2 hover:text-sky-900" rel="noopener noreferrer" target="_blank" />
  ),
  p: ({ node: _n, ...props }) => <p {...props} className="mb-3 last:mb-0" />,
  ul: ({ node: _n, ...props }) => <ul {...props} className="mb-3 list-disc pl-5 last:mb-0" />,
  ol: ({ node: _n, ...props }) => <ol {...props} className="mb-3 list-decimal pl-5 last:mb-0" />,
  h1: ({ node: _n, ...props }) => <h1 {...props} className="mb-3 text-xl font-bold text-slate-900" />,
  h2: ({ node: _n, ...props }) => <h2 {...props} className="mb-2 mt-5 text-lg font-bold text-slate-900 first:mt-0" />,
  h3: ({ node: _n, ...props }) => <h3 {...props} className="mb-2 mt-4 text-base font-bold text-slate-900 first:mt-0" />,
  code: ({ node: _n, className, children, ...props }) => {
    const isFenced = Boolean(className?.includes("language-"));
    if (isFenced) {
      return (
        <code className={`block w-full font-mono text-xs leading-relaxed text-slate-100 ${className ?? ""}`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ node: _n, children, ...props }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-3" {...props}>
      {children}
    </pre>
  ),
  blockquote: ({ node: _n, ...props }) => (
    <blockquote {...props} className="my-4 border-l-4 border-indigo-200 bg-indigo-50/50 py-2 pl-4 text-slate-700 italic" />
  ),
};

type LearningMarkdownBodyProps = {
  markdown: string;
  className?: string;
  linkBehavior?: "open" | "download";
};

/** Rendu Markdown sécurisé (GFM + sauts de ligne + images https). */
export function LearningMarkdownBody({ markdown, className, linkBehavior = "open" }: LearningMarkdownBodyProps) {
  if (!markdown.trim()) {
    return null;
  }
  const components: Components =
    linkBehavior === "download"
      ? {
          ...markdownComponents,
          a: ({ node: _n, ...props }) => (
            <a
              {...props}
              className="font-semibold text-sky-700 underline decoration-sky-300/70 underline-offset-2 hover:text-sky-900"
              download
              rel="noopener noreferrer"
              target="_self"
            />
          ),
        }
      : markdownComponents;
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
