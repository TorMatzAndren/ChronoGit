export type PanelType =
  | "legacy-home"
  | "history"
  | "remote"
  | "logs"
  | "empty";

export type PanelSize = "full" | "wide" | "half" | "compact";

export type PanelInstance = {
  id: string;
  type: PanelType;
  size: PanelSize;
};

export type WorkspaceTab = {
  id: string;
  name: string;
  panels: PanelInstance[];
};

export function createDefaultWorkspaceTabs(): WorkspaceTab[] {
  return [
    {
      id: "home",
      name: "Home",
      panels: [{ id: "home-legacy", type: "legacy-home", size: "full" }],
    },
    {
      id: "history",
      name: "History",
      panels: [{ id: "history-seed", type: "history", size: "full" }],
    },
    {
      id: "remote",
      name: "Remote",
      panels: [{ id: "remote-seed", type: "remote", size: "full" }],
    },
    {
      id: "logs",
      name: "Logs",
      panels: [{ id: "logs-seed", type: "logs", size: "full" }],
    },
  ];
}
