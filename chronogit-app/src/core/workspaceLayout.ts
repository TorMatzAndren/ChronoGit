import { PANEL_REGISTRY } from "../panels/panelRegistry";
import type {
  PanelInstance,
  PanelType,
  WorkspaceTab,
} from "./chronogitWorkspaceTypes";

const GRID = 12;

export function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}

export function titleFor(type: PanelType) {
  return PANEL_REGISTRY.find((panel) => panel.type === type)?.title || "Panel";
}

export function makePanel(type: PanelType, index = 0): PanelInstance {
  return {
    id: `panel-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title: titleFor(type),
    x: 24 + index * 32,
    y: 24 + index * 32,
    w:
      type === "change-lists" ? 860 :
      type === "time-machine" ? 1040 :
      type === "remote-actions" ? 860 :
      type === "commit-preflight" ? 520 :
      390,
    h:
      type === "change-lists" ? 420 :
      type === "time-machine" ? 620 :
      type === "remote-actions" ? 520 :
      240,
  };
}

export function normalizePanel(panel: Partial<PanelInstance>, index: number): PanelInstance {
  const type = (panel.type || "empty") as PanelType;

  return {
    id: String(panel.id || `panel-${Date.now()}-${index}`),
    type,
    title: String(panel.title || titleFor(type)),
    x: Number.isFinite(panel.x) ? Number(panel.x) : 24 + index * 32,
    y: Number.isFinite(panel.y) ? Number(panel.y) : 24 + index * 32,
    w: Number.isFinite(panel.w) ? Math.max(240, Number(panel.w)) : makePanel(type, index).w,
    h: Number.isFinite(panel.h) ? Math.max(140, Number(panel.h)) : makePanel(type, index).h,
  };
}

export function normalizeState(
  input: unknown,
  defaultStateFactory: () => {
    activeTabId: string;
    beginnerMode: boolean;
    repoPath: string;
    tabs: WorkspaceTab[];
  },
) {
  if (!input || typeof input !== "object") return defaultStateFactory();

  const raw = input as {
    activeTabId?: string;
    beginnerMode?: boolean;
    repoPath?: string;
    tabs?: WorkspaceTab[];
  };

  if (!Array.isArray(raw.tabs) || !raw.tabs.length) {
    return defaultStateFactory();
  }

  const tabs = raw.tabs.map((tab, tabIndex) => ({
    id: String(tab.id || `tab-${tabIndex}`),
    name: String(tab.name || `Tab ${tabIndex + 1}`),
    panels: Array.isArray(tab.panels) && tab.panels.length
      ? tab.panels.map(normalizePanel)
      : [makePanel("current-state")],
  }));

  return {
    activeTabId: tabs.some((tab) => tab.id === raw.activeTabId)
      ? String(raw.activeTabId)
      : tabs[0].id,
    beginnerMode: raw.beginnerMode !== false,
    repoPath: String(raw.repoPath || "/home/dretski/projects/ChronoGit"),
    tabs,
  };
}
