import type { ReactNode } from "react";

function isBlockStart(line: string): boolean {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^\s*```/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line)
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={key}
            className="break-all rounded bg-bg-overlay px-1.5 py-0.5 font-mono text-[0.9em] text-accent-secondary sm:break-normal"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={key} className="font-semibold text-text-primary">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
}

export function LessonContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const codeFence = line.match(/^\s*```([\w+#.-]*)\s*$/);
    if (codeFence) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;

      blocks.push(
        <pre
          key={`code-${blocks.length}`}
          className="max-w-full overflow-x-auto rounded-xl border border-border bg-bg-base p-4 text-sm leading-relaxed"
        >
          <code className="font-mono text-text-primary">
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const headingContent = renderInline(heading[2], `heading-${blocks.length}`);
      const className =
        "text-xl font-semibold tracking-tight text-text-primary";
      const key = `heading-${blocks.length}`;
      if (heading[1].length <= 2) {
        blocks.push(<h2 key={key} className={className}>{headingContent}</h2>);
      } else if (heading[1].length === 3) {
        blocks.push(<h3 key={key} className={className}>{headingContent}</h3>);
      } else {
        blocks.push(<h4 key={key} className={className}>{headingContent}</h4>);
      }
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        const item = lines[index].replace(/^\s*[-*]\s+/, "");
        items.push(
          <li key={`unordered-${items.length}`}>
            {renderInline(item, `unordered-${index}`)}
          </li>
        );
        index += 1;
      }
      blocks.push(
        <ul
          key={`list-${blocks.length}`}
          className="list-disc space-y-2 pl-6 marker:text-accent-primary"
        >
          {items}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        const item = lines[index].replace(/^\s*\d+[.)]\s+/, "");
        items.push(
          <li key={`ordered-${items.length}`}>
            {renderInline(item, `ordered-${index}`)}
          </li>
        );
        index += 1;
      }
      blocks.push(
        <ol
          key={`ordered-list-${blocks.length}`}
          className="list-decimal space-y-2 pl-6 marker:text-accent-primary"
        >
          {items}
        </ol>
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p
        key={`paragraph-${blocks.length}`}
        className="break-words text-sm leading-7 text-text-secondary"
      >
        {renderInline(paragraph.join(" "), `paragraph-${blocks.length}`)}
      </p>
    );
  }

  return <div className="space-y-5">{blocks}</div>;
}
