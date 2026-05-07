import type { SystemLogEntry } from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  systemLog: SystemLogEntry[];
  clearSystemLog: () => void;
  backupAndClearSystemLog: () => Promise<void>;
  openLogBackupFolder: () => Promise<void>;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

export function SystemLogPanel({
  beginnerMode,
  systemLog,
  clearSystemLog,
  backupAndClearSystemLog,
  openLogBackupFolder,
  ui,
}: Props) {
  return (
    <div className="cg-panel-content">
      <div className="cg-action-row">
        <button disabled={!systemLog.length} onClick={() => { void backupAndClearSystemLog(); }}>
          {ui(beginnerMode, "Backup log file + clear", "export log + clear")}
        </button>
        <button onClick={() => { void openLogBackupFolder(); }}>
          {ui(beginnerMode, "Open backup folder", "open backup dir")}
        </button>
        <button disabled={!systemLog.length} onClick={clearSystemLog}>
          {ui(beginnerMode, "Clear system log", "clear system log")}
        </button>
      </div>

      {systemLog.length ? systemLog.map((entry) => (
        <article className={`system-log-entry system-log-entry--${entry.level}`} key={entry.id}>
          <strong>{entry.level}</strong>
          <span>{entry.date}</span>
          <p>{entry.message}</p>
          <button onClick={() => navigator.clipboard.writeText(entry.message)}>{ui(beginnerMode, "Copy", "clipboard.writeText")}</button>
        </article>
      )) : <p>No system log events yet.</p>}
    </div>
  );
}
