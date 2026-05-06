import type { GitRemoteStatus } from "../core/chronogitRuntimeTypes";

type Props = {
  branch: string;
  remote: GitRemoteStatus | null;
  remoteLabel: (remote: GitRemoteStatus | null) => string;
};

export function RemoteStatusPanel({
  branch,
  remote,
  remoteLabel,
}: Props) {
  return (
    <div className="cg-panel-content">
      <h3>{remoteLabel(remote)}</h3>
      <p><strong>Branch:</strong> {remote?.branch || branch || "unknown"}</p>
      <p><strong>Upstream:</strong> {remote?.upstream || "none"}</p>
      <p><strong>Ahead / behind:</strong> +{remote?.ahead ?? 0} / -{remote?.behind ?? 0}</p>
      <code>{remote?.remote_url || "No remote URL detected"}</code>
    </div>
  );
}
