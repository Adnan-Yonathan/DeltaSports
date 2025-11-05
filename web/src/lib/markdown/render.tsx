import type { Config } from "dompurify";
import createDOMPurify from "dompurify";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const allowedSchemes = ["http", "https", "mailto"];

function getDOMPurify() {
  if (typeof window === "undefined") {
    return {
      sanitize(value: string) {
        return value;
      },
    };
  }
  return createDOMPurify(window as unknown as Window);
}

export function sanitizeMarkdown(markdown: string, config: Config = {}) {
  const purifier = getDOMPurify();
  return purifier.sanitize(markdown, {
    ALLOWED_URI_REGEXP: new RegExp(`^(${allowedSchemes.join("|")})`),
    ...config,
  });
}

type MarkdownProps = {
  children: string;
  className?: string;
};

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      linkTarget="_blank"
    >
      {sanitizeMarkdown(children)}
    </ReactMarkdown>
  );
}
