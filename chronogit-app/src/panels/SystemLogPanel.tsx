import type { SystemLogEntry } from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  systemLog: SystemLogEntry[];
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

export function SystemLogPanel({
  beginnerMode,
  systemLog,
  ui,
}: Props) {
  return (
    <div className="cg-panel-content">
      {systemLog.length ? systemLog.map((entry) => (
        <article className={`system-log-entry system-log-entry--${entry.level}`} key={entry.id}>
          <strong>{entry.level}</strong>
          <span>{entry.date} {entry.time}</span>
          <p>{entry.message}</p>
          <button onClick={() => navigator.clipboard.writeText(entry.message)}>{ui(beginnerMode, "Copy", "clipboard.writeText")}</button>
        </article>
      )) : <p>No system log events yet.</p>}
    </div>
  );
}
