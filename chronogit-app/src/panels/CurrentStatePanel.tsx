import type { GitRemoteStatus } from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  branch: string;
  remote: GitRemoteStatus | null;
  lastAction: string;
  message: string;
  remoteLabel: (remote: GitRemoteStatus | null) => string;
  remoteHuman: (remote: GitRemoteStatus | null) => string;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

export function CurrentStatePanel({
  beginnerMode,
  branch,
  remote,
  lastAction,
  message,
  remoteLabel,
  remoteHuman,
  ui,
}: Props) {
  return (
    <div className="cg-panel-content">
      <h3>{remoteLabel(remote)}</h3>
      <p>{remoteHuman(remote)}</p>
      <p><strong>{ui(beginnerMode, "Branch", "HEAD branch")}:</strong> {branch || "unknown"}</p>
      <p><strong>{ui(beginnerMode, "Last action", "last mutation")}:</strong> {lastAction}</p>
      <p><strong>{ui(beginnerMode, "Message", "last message")}:</strong> {message || "No message yet."}</p>
    </div>
  );
}
