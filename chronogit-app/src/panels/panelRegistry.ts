import type { PanelType } from "../core/chronogitWorkspaceTypes";

export type PanelDefinition = {
  type: PanelType;
  title: string;
  description: string;
};

export const PANEL_REGISTRY: PanelDefinition[] = [
  { type: "current-state", title: "Current State", description: "Human Git state summary." },
  { type: "commit-preflight", title: "Commit Preflight", description: "Prepared-file commit boundary." },
  { type: "change-lists", title: "Change Lists", description: "Working and prepared files with actions." },
  { type: "time-machine", title: "Time Machine", description: "History, file diffs, A/B comparison, restore." },
  { type: "remote-actions", title: "Remote Actions", description: "Fetch, push/pull preview, guarded sync." },
  { type: "remote-status", title: "Remote Status", description: "Ahead/behind and upstream truth." },
  { type: "local-llm", title: "Local LLM", description: "Local model selector and explanation controls." },
  { type: "system-log", title: "System Log", description: "Deterministic session events." },
  { type: "llm-log", title: "LLM Log", description: "Advisory local LLM responses." },
  { type: "notes", title: "Notes", description: "Freeform operator notes placeholder." },
  { type: "empty", title: "Empty", description: "Blank panel slot." },
];

export function panelDefinition(type: PanelType): PanelDefinition {
  return PANEL_REGISTRY.find((panel) => panel.type === type) || PANEL_REGISTRY[PANEL_REGISTRY.length - 1];
}
