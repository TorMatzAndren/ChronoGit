import type {
  CommitPreflight,
  FileChange,
  GitRemoteStatus,
} from "../core/chronogitRuntimeTypes";

type SnapshotImpact = {
  label: string;
  text: string;
} | null;

type Props = {
  beginnerMode: boolean;
  commitPreflight: CommitPreflight | null;
  staged: FileChange[];
  preflightWarnings: FileChange[];
  hasCritical: boolean;
  snapshotImpact: SnapshotImpact;
  remote: GitRemoteStatus | null;
  commitMessage: string;
  setCommitMessage: (message: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  snapshotRemoteSentence: (remote: GitRemoteStatus | null) => string;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

export function SnapshotPreflightModal({
  beginnerMode,
  commitPreflight,
  staged,
  preflightWarnings,
  hasCritical,
  snapshotImpact,
  remote,
  commitMessage,
  setCommitMessage,
  onCancel,
  onConfirm,
  snapshotRemoteSentence,
  ui,
}: Props) {
  return (
    <div className="preflight-overlay">
      <div className="preflight-modal">
        <h2>{ui(beginnerMode, "Snapshot Preflight", "git commit preflight")}</h2>
        <p>{ui(beginnerMode, "Only prepared files will be included.", "Only index/staged files are committed.")}</p>

        <div className="snapshot-boundary-box">
          <h3>{ui(beginnerMode, "Next snapshot contains", "git diff --cached --stat")}</h3>
          <div className="snapshot-boundary-grid">
            <div><strong>{commitPreflight?.staged_files ?? staged.length}</strong><span>files</span></div>
            <div><strong>+{commitPreflight?.insertions ?? 0}</strong><span>insertions</span></div>
            <div><strong>-{commitPreflight?.deletions ?? 0}</strong><span>deletions</span></div>
          </div>
          <p>{snapshotRemoteSentence(remote)}</p>
          {snapshotImpact ? <div className="snapshot-impact-warning"><strong>{snapshotImpact.label}</strong><span>{snapshotImpact.text}</span></div> : null}
        </div>

        <h3>Included files ({staged.length})</h3>
        <div className="preflight-list">{staged.map((file) => <div key={file.path} className="preflight-item">✔ {file.path}</div>)}</div>

        {preflightWarnings.length ? (
          <div className="preflight-warnings">{preflightWarnings.map((file) => <div key={file.path} className="warning-item">⚠ {file.path} — {file.risk}</div>)}</div>
        ) : <p>No dangerous prepared files detected.</p>}

        <input
          className="preflight-input"
          value={commitMessage}
          onChange={(event) => setCommitMessage(event.target.value)}
          placeholder={ui(beginnerMode, "Describe this snapshot...", "commit message")}
        />

        <div className="preflight-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="confirm" disabled={!commitMessage.trim() || hasCritical} onClick={onConfirm}>{ui(beginnerMode, "Create snapshot", "git commit")}</button>
        </div>
      </div>
    </div>
  );
}
