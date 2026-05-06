import type { ReactNode } from "react";

type Props = {
  gitVersion: string;
  branch: string;
  lastRefresh: string;
  onRefresh: () => void;
  beginnerTitle: (text: string) => string | undefined;
  actionHelp: ReactNode;
};

export function StatusPanel({
  gitVersion,
  branch,
  lastRefresh,
  onRefresh,
  beginnerTitle,
  actionHelp,
}: Props) {
  return (
    <div className="status-box">
      <div className="status-box__label">Git</div>
      <div>{gitVersion}</div>
      <div className="status-box__label">Branch</div>
      <div>{branch}</div>
      <div className="status-box__label">State</div>
      <div>{lastRefresh || "not refreshed yet"}</div>
      <div className="button-with-help">
        <button
          className="status-refresh-button"
          title={beginnerTitle("Refresh app state\n\nReloads repository status, remote awareness, and Time Machine history. This does not change files.")}
          onClick={onRefresh}
        >
          Refresh app state
        </button>
        {actionHelp}
      </div>
    </div>
  );
}
