const escapeHtml = (input: string) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html = lines
    .map((line) => {
      if (line.startsWith("# ")) {
        return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      }
      if (line.startsWith("## ")) {
        return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      }
      if (line.startsWith("### ")) {
        return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      }
      if (line.startsWith("- ")) {
        return `<li>${escapeHtml(line.slice(2))}</li>`;
      }
      if (line.trim().startsWith("|")) {
        return line; // handled separately for tables
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");

  return html;
}

export interface MarkdownTable {
  headers: string[];
  rows: string[][];
}

export function extractTables(markdown: string): MarkdownTable[] {
  const tables: MarkdownTable[] = [];
  const lines = markdown.split(/\r?\n/);
  let current: string[][] = [];

  const pushCurrent = () => {
    if (current.length > 0) {
      const [headerLine, ...rows] = current;
      tables.push({
        headers: headerLine,
        rows,
      });
      current = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("|")) {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
      if (cells.every((cell) => cell.startsWith("-"))) {
        // separator row
        continue;
      }
      current.push(cells);
    } else {
      pushCurrent();
    }
  }
  pushCurrent();

  return tables;
}
