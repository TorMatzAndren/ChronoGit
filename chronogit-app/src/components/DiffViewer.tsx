import { diffLineClass } from "../lib/diffUtils";

export function renderPrettyDiff(diff: string, selectedLines: Set<number>, onToggleLine: (line: number) => void) {
  if (!diff.trim()) return <div className="diff-placeholder">No diff for this file.</div>;
  const lines = diff.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return (
    <div className="diff-pretty">
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        return (
          <div
            key={`${index}-${line.slice(0, 18)}`}
            className={`${diffLineClass(line)} ${selectedLines.has(lineNumber) ? "diff-line--selected" : ""}`}
            onClick={() => onToggleLine(lineNumber)}
          >
            <span className="diff-line__num">{lineNumber}</span>
            <code className="diff-line__text">{line || " "}</code>
          </div>
        );
      })}
    </div>
  );
}
