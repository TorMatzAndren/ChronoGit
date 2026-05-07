import type { LlmLogEntry } from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  llmLog: LlmLogEntry[];
  toggleLlmEntry: (id: string) => void;
  clearLlmLog: () => void;
  backupAndClearLlmLog: () => void;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

export function LlmLogPanel({
  beginnerMode,
  llmLog,
  toggleLlmEntry,
  clearLlmLog,
  backupAndClearLlmLog,
  ui,
}: Props) {
  return (
    <div className="cg-panel-content cg-llm-log-panel">
      <div className="cg-action-row">
        <button disabled={!llmLog.length} onClick={backupAndClearLlmLog}>
          {ui(beginnerMode, "Backup log file + clear", "export log + clear")}
        </button>
        <button disabled={!llmLog.length} onClick={clearLlmLog}>
          {ui(beginnerMode, "Clear LLM log", "clear llm log")}
        </button>
      </div>

      {llmLog.length ? llmLog.map((entry) => (
        <article className={`llm-log-entry ${entry.streaming ? "llm-log-entry--streaming" : ""}`} key={entry.id}>
          <button className="llm-log-entry__header" onClick={() => toggleLlmEntry(entry.id)}>
            <span>{entry.collapsed ? "▶" : "▼"}</span>
            <strong>{entry.title}</strong>
            <em>{entry.streaming ? "streaming" : entry.timestamp}</em>
          </button>
          <div className="llm-log-entry__meta"><span>{entry.timestamp}</span><strong>{entry.source}</strong><code>{entry.model}</code></div>
          {!entry.collapsed ? <pre>{entry.content || "Waiting for local LLM output..."}</pre> : null}
          <button onClick={() => navigator.clipboard.writeText(entry.content)}>{ui(beginnerMode, "Copy message", "clipboard.writeText")}</button>
        </article>
      )) : <p>No LLM responses yet.</p>}
    </div>
  );
}
