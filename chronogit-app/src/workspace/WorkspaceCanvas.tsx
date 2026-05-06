import type { ReactNode } from "react";
import type { WorkspaceTab } from "../core/chronogitWorkspaceTypes";
import "./WorkspaceCanvas.css";

type Props = {
  activeTab: WorkspaceTab;
  children: ReactNode;
};

export function WorkspaceCanvas({ children }: Props) {
  return <section className="chronogit-workspace-canvas">{children}</section>;
}
