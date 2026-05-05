import type { RepoInfo } from "../core/chronogitRuntimeTypes";
import type { WorkspaceTab } from "../core/chronogitWorkspaceTypes";
import { TabBar } from "../tabs/TabBar";
import "./ChronoGitShell.css";

type Props = {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  beginnerMode: boolean;
  onToggleBeginnerMode: () => void;
  repoPath: string;
  repos: RepoInfo[];
  onRepoChange: (repoPath: string) => void;
  onScanRepos: () => void;
  gitVersion: string;
  branch: string;
  remoteLabel: string;
  lastRefresh: string;
  onRefresh: () => void;
};

export function ChronoGitShell({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onCloseTab,
  beginnerMode,
  onToggleBeginnerMode,
  repoPath,
  repos,
  onRepoChange,
  onScanRepos,
  gitVersion,
  branch,
  remoteLabel,
  lastRefresh,
  onRefresh,
}: Props) {
  return (
    <section className="chronogit-shell">
      <div className="chronogit-shell__titlebar">
        <div className="chronogit-shell__identity">
          <div className="chronogit-shell__eyebrow">Deterministic Git Workspace</div>
          <h1>ChronoGit</h1>
          <span>Git is truth · layouts are projections</span>
        </div>

        <div className="chronogit-shell__controls">
          <label className="chronogit-shell__repo">
            <span>Repository</span>
            <select value={repoPath} onChange={(event) => onRepoChange(event.target.value)}>
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
          </label>

          <button onClick={onScanRepos}>Scan repos</button>

          <button
            className={`chronogit-shell__beginner ${beginnerMode ? "chronogit-shell__beginner--on" : ""}`}
            onClick={onToggleBeginnerMode}
          >
            Beginner: {beginnerMode ? "ON" : "OFF"}
          </button>

          <button onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      <div className="chronogit-shell__truth">
        <span><strong>Git</strong>{gitVersion}</span>
        <span><strong>Branch</strong>{branch}</span>
        <span><strong>Remote</strong>{remoteLabel}</span>
        <span><strong>Refreshed</strong>{lastRefresh || "not yet"}</span>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={onSelectTab}
        onAddTab={onAddTab}
        onRenameTab={onRenameTab}
        onCloseTab={onCloseTab}
      />
    </section>
  );
}
