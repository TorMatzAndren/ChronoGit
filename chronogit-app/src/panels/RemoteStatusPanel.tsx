type GitRemoteStatus = {
  repo_path: string;
  branch: string;
  upstream: string | null;
  remote: string | null;
  remote_url: string | null;
  ahead: number;
  behind: number;
  has_remote: boolean;
  is_diverged: boolean;
  is_clean: boolean;
};

type Props = {
  remoteStatus: GitRemoteStatus | null;
  branch: string;
  remoteStateLabel: (remote: GitRemoteStatus | null) => string;
  remoteStateClass: (remote: GitRemoteStatus | null) => string;
};

export function RemoteStatusPanel({
  remoteStatus,
  branch,
  remoteStateLabel,
  remoteStateClass,
}: Props) {
  return (
    <div className={`remote-main-card remote-main-card--${remoteStateClass(remoteStatus)}`}>
      <div className="remote-main-card__title">Remote</div>
      <div className="remote-main-card__state">{remoteStateLabel(remoteStatus)}</div>
      <div className="remote-main-card__line">
        Branch: <span>{remoteStatus?.branch || branch}</span>
      </div>
      <div className="remote-main-card__line">
        Upstream: <span>{remoteStatus?.upstream || "none"}</span>
      </div>
      <div className="remote-main-card__line">
        Ahead / behind: <span>+{remoteStatus?.ahead ?? 0} / -{remoteStatus?.behind ?? 0}</span>
      </div>
      <div className="remote-main-card__url">
        {remoteStatus?.remote_url || "No remote URL detected"}
      </div>
    </div>
  );
}
