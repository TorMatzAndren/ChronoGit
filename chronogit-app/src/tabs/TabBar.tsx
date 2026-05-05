import type { WorkspaceTab } from "../core/chronogitWorkspaceTypes";
import "./TabBar.css";

type Props = {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
};

export function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onCloseTab,
}: Props) {
  return (
    <nav className="chronogit-tabbar" aria-label="ChronoGit workspace tabs">
      <div className="chronogit-tabbar__tabs">
        {tabs.map((tab) => (
          <div
            className={`chronogit-tab ${tab.id === activeTabId ? "chronogit-tab--active" : ""}`}
            key={tab.id}
          >
            <button className="chronogit-tab__select" onClick={() => onSelectTab(tab.id)}>
              {tab.name}
            </button>
            <button className="chronogit-tab__rename" title="Rename tab" onClick={() => onRenameTab(tab.id)}>
              ✎
            </button>
            <button
              className="chronogit-tab__close"
              title={tabs.length <= 1 ? "Cannot close the last tab" : "Close tab"}
              disabled={tabs.length <= 1}
              onClick={() => onCloseTab(tab.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button className="chronogit-tabbar__add" onClick={onAddTab}>
        + New Tab
      </button>
    </nav>
  );
}
