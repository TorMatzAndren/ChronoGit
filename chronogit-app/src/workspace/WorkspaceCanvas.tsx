import type { ReactNode } from "react";
import type { WorkspaceTab } from "../core/chronogitWorkspaceTypes";
import "./WorkspaceCanvas.css";

type Props = {
  activeTab: WorkspaceTab;
  children: ReactNode;
};

function placeholderText(tabId: string) {
  if (tabId === "history") return "History will become the Time Machine projection panel.";
  if (tabId === "remote") return "Remote will become the guarded synchronization projection panel.";
  if (tabId === "logs") return "Logs will become the deterministic system and LLM log projection panel.";
  return "This tab is an empty layout context. Future panels will project central Git truth here.";
}

export function WorkspaceCanvas({ activeTab, children }: Props) {
  if (activeTab.id === "home") {
    return (
      <section className="chronogit-workspace-canvas chronogit-workspace-canvas--legacy">
        {children}
      </section>
    );
  }

  return (
    <section className="chronogit-workspace-canvas">
      <div className="chronogit-workspace-placeholder">
        <div className="chronogit-workspace-placeholder__eyebrow">Projection layer</div>
        <h2>{activeTab.name}</h2>
        <p>{placeholderText(activeTab.id)}</p>
        <p>
          This tab stores layout intent only. It does not own Git status, selected commits,
          remote state, prepared files, or mutation logic.
        </p>
      </div>
    </section>
  );
}
