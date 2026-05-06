type RepoInfo = {
  path: string;
  name: string;
  root: string;
};

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
  repos: RepoInfo[];
  repoPath: string;
  branch: string;
  remoteStatus: GitRemoteStatus | null;
  lastAction: string;
  remoteStateLabel: (remote: GitRemoteStatus | null) => string;
  explainRemoteHuman: (remote: GitRemoteStatus | null) => string;
};

export function CurrentStatePanel({
  repos,
  repoPath,
  branch,
  remoteStatus,
  lastAction,
  remoteStateLabel,
  explainRemoteHuman,
}: Props) {
  return (
    <div className="current-state-card">
      <div>
        <div className="current-state-card__label">Current state</div>
        <h2>{remoteStateLabel(remoteStatus)}</h2>
        <p>{explainRemoteHuman(remoteStatus)}</p>
      </div>

      <div className="current-state-card__facts">
        <span><strong>Repo</strong>{repos.find((repo) => repo.path === repoPath)?.name || "Selected repository"}</span>
        <span><strong>Branch</strong>{remoteStatus?.branch || branch}</span>
        <span><strong>Upstream</strong>{remoteStatus?.upstream || "none"}</span>
      </div>

      <div className="current-state-card__last">
        <strong>Last action</strong>
        <span>{lastAction}</span>
      </div>
    </div>
  );
}
