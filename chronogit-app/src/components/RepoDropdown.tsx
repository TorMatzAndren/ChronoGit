import { useEffect, useRef, useState } from "react";
import type { RepoInfo } from "../core/chronogitRuntimeTypes";

type Props = {
  value: string;
  repos: RepoInfo[];
  onChange: (repoPath: string) => void;
  beginnerMode: boolean;
};

export function RepoDropdown({
  value,
  repos,
  onChange,
  beginnerMode,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedRepo = repos.find((repo) => repo.path === value);

  const filteredRepos = repos.filter((repo) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return `${repo.name} ${repo.path}`.toLowerCase().includes(needle);
  });

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="cg-repo-dropdown" ref={rootRef}>
      <button
        type="button"
        className="cg-repo-dropdown__button"
        onClick={() => setOpen((current) => !current)}
        title={beginnerMode ? "Select which local Git repository ChronoGit should inspect." : "repo selector"}
      >
        <span>
          <strong>{selectedRepo?.name || "Selected repository"}</strong>
          <em>{value}</em>
        </span>
        <b>{open ? "▲" : "▼"}</b>
      </button>

      {open ? (
        <div className="cg-repo-dropdown__menu">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search repositories..."
          />

          <div className="cg-repo-dropdown__list">
            {filteredRepos.length ? filteredRepos.map((repo) => (
              <button
                type="button"
                key={repo.path}
                className={repo.path === value ? "cg-repo-dropdown__item cg-repo-dropdown__item--active cg-repo-dropdown__item--selected" : "cg-repo-dropdown__item"}
                onClick={() => {
                  onChange(repo.path);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <strong>{repo.name}</strong>
                <span>{repo.path}</span>
              </button>
            )) : <div className="cg-repo-dropdown__empty">No repositories match this search.</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
