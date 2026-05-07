export type PanelType =
  | "repository"
  | "git-status"
  | "remote-status"
  | "branches"
  | "local-llm"
  | "current-state"
  | "commit-preflight"
  | "change-lists"
  | "time-machine"
  | "remote-actions"
  | "system-log"
  | "llm-log"
  | "notes"
  | "empty";

export type PanelSize = "free";

export type PanelInstance = {
  id: string;
  type: PanelType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type WorkspaceTab = {
  id: string;
  name: string;
  panels: PanelInstance[];
};
