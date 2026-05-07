import type {
  PanelType,
  WorkspaceTab,
} from "./chronogitWorkspaceTypes";

import {
  makePanel,
  snap,
} from "./workspaceLayout";

type AppStateLike = {
  activeTabId: string;
  beginnerMode: boolean;
  repoPath: string;
  tabs: WorkspaceTab[];
};

export function setRepoPath(
  state: AppStateLike,
  repoPath: string,
): AppStateLike {
  return {
    ...state,
    repoPath,
  };
}

export function updateActiveTab(
  state: AppStateLike,
  mutator: (tab: WorkspaceTab) => WorkspaceTab,
): AppStateLike {
  return {
    ...state,
    tabs: state.tabs.map((tab) =>
      tab.id === state.activeTabId
        ? mutator(tab)
        : tab
    ),
  };
}

export function addTab(state: AppStateLike): AppStateLike {
  const id = `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    ...state,
    activeTabId: id,
    tabs: [
      ...state.tabs,
      {
        id,
        name: `Tab ${state.tabs.length + 1}`,
        panels: [makePanel("current-state")],
      },
    ],
  };
}

export function renameTab(
  state: AppStateLike,
  tabId: string,
  name: string,
): AppStateLike {
  return {
    ...state,
    tabs: state.tabs.map((tab) =>
      tab.id === tabId
        ? { ...tab, name }
        : tab
    ),
  };
}

export function closeTab(
  state: AppStateLike,
  tabId: string,
): AppStateLike {
  if (state.tabs.length <= 1) return state;

  const tabs = state.tabs.filter((tab) => tab.id !== tabId);

  return {
    ...state,
    tabs,
    activeTabId:
      state.activeTabId === tabId
        ? tabs[0].id
        : state.activeTabId,
  };
}

export function addPanel(
  state: AppStateLike,
  type: PanelType,
): AppStateLike {
  return updateActiveTab(state, (tab) => ({
    ...tab,
    panels: [
      ...tab.panels,
      makePanel(type, tab.panels.length),
    ],
  }));
}

export function closePanel(
  state: AppStateLike,
  panelId: string,
): AppStateLike {
  return updateActiveTab(state, (tab) => ({
    ...tab,
    panels:
      tab.panels.length <= 1
        ? tab.panels
        : tab.panels.filter((panel) => panel.id !== panelId),
  }));
}

export function movePanel(
  state: AppStateLike,
  panelId: string,
  x: number,
  y: number,
): AppStateLike {
  return updateActiveTab(state, (tab) => ({
    ...tab,
    panels: tab.panels.map((panel) =>
      panel.id === panelId
        ? {
            ...panel,
            x: snap(Math.max(0, x)),
            y: snap(Math.max(0, y)),
          }
        : panel
    ),
  }));
}

export function resizePanel(
  state: AppStateLike,
  panelId: string,
  w: number,
  h: number,
): AppStateLike {
  return updateActiveTab(state, (tab) => ({
    ...tab,
    panels: tab.panels.map((panel) =>
      panel.id === panelId
        ? {
            ...panel,
            w: snap(Math.max(240, w)),
            h: snap(Math.max(140, h)),
          }
        : panel
    ),
  }));
}
