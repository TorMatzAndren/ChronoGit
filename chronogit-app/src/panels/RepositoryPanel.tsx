type RepoInfo = {
  path: string;
  name: string;
  root: string;
};

type Props = {
  repoPath: string;
  repos: RepoInfo[];
  onRepoChange: (repoPath: string) => void;
  onScanRepos: () => void;
  beginnerTitle: (text: string) => string | undefined;
};

export function RepositoryPanel({
  repoPath,
  repos,
  onRepoChange,
  onScanRepos,
  beginnerTitle,
}: Props) {
  return (
    <div className="repo-main-card">
      <div className="repo-main-card__title">Repository</div>
      <div className="repo-main-card__note">Select a discovered local Git project.</div>

      <select
        value={repoPath}
        onChange={(event) => onRepoChange(event.target.value)}
      >
        {repos.length ? (
          repos.map((repo) => (
            <option key={repo.path} value={repo.path}>
              {repo.name} · {repo.path}
            </option>
          ))
        ) : (
          <option value={repoPath}>{repoPath}</option>
        )}
      </select>

      <div className="repo-main-card__path">{repoPath}</div>

      <button
        className="status-refresh-button"
        title={beginnerTitle("Scan repositories\n\nSearches safe local folders for Git projects and updates the repository selector.")}
        onClick={onScanRepos}
      >
        Scan repositories
      </button>
    </div>
  );
}
