import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import jarriLogo from "./assets/jarri-logo.png";
import { RepoDropdown } from "./components/RepoDropdown";
import { PanelDropdown } from "./components/PanelDropdown";
import { SnapshotPreflightModal } from "./components/SnapshotPreflightModal";
import { ConfirmModal } from "./components/ConfirmModal";

import {
  abortRebase as abortRebaseRuntime,
  confirmSnapshot as confirmSnapshotRuntime,
  executeFileAction as executeFileActionRuntime,
  executePullRebase as executePullRebaseRuntime,
  executePush as executePushRuntime,
  fetchRemoteKnowledge as fetchRemoteKnowledgeRuntime,
  loadRemotePreview as loadRemotePreviewRuntime,
  openSnapshotPreflight as openSnapshotPreflightRuntime,
} from "./core/gitActions";
import { LlmLogPanel } from "./panels/LlmLogPanel";
import { SystemLogPanel } from "./panels/SystemLogPanel";
import { NotesPanel } from "./panels/NotesPanel";
import { CurrentStatePanel } from "./panels/CurrentStatePanel";
import { CommitPreflightPanel } from "./panels/CommitPreflightPanel";
import { ChangeListsPanel } from "./panels/ChangeListsPanel";
import { RemoteStatusPanel } from "./panels/RemoteStatusPanel";
import { RemoteActionsPanel } from "./panels/RemoteActionsPanel";
import { BranchPanel } from "./panels/BranchPanel";
import { LocalLlmPanel } from "./panels/LocalLlmPanel";
import { TimeMachinePanel } from "./panels/TimeMachinePanel";
import type { PanelInstance, PanelType, WorkspaceTab } from "./core/chronogitWorkspaceTypes";
import {
  makePanel,
  normalizeState,
  snap,
} from "./core/workspaceLayout";

import {
  backupLlmLog,
  backupSystemLog,
  loadLlmLog,
  loadSystemLog,
  openLogBackupFolder,
  saveLlmLog,
  saveSystemLog,
} from "./core/persistence";
import type {
  CommitPreflight,
  ConfirmAction,
  ExplainContext,
  ExplainDiffResult,
  BranchGraph,
  BranchInfo,
  BranchOverview,
  GitOperationState,
  GitRemoteStatus,
  GitStatusResponse,
  LlmLogEntry,
  LlmStreamEvent,
  LocalModel,
  RemoteOperationPreview,
  RepoInfo,
  SystemLogEntry,
} from "./core/chronogitRuntimeTypes";

type AppState = {
  activeTabId: string;
  beginnerMode: boolean;
  repoPath: string;
  tabs: WorkspaceTab[];
};

const STORAGE_KEY = "chronogit_workspace_state_v3";
const OLD_STORAGE_KEY = "chronogit_workspace_state_v2";
const DEFAULT_REPO = "/home/dretski/projects/ChronoGit";
function ui(beginnerMode: boolean, beginner: string, pro: string) {
  return beginnerMode ? beginner : pro;
}

function defaultState(): AppState {
  return {
    activeTabId: "home",
    beginnerMode: true,
    repoPath: DEFAULT_REPO,
    tabs: [
      {
        id: "home",
        name: "Home",
        panels: [
          { id: "state", type: "current-state", title: "Current State", x: 24, y: 24, w: 520, h: 220 },
          { id: "preflight", type: "commit-preflight", title: "Commit Preflight", x: 568, y: 24, w: 520, h: 220 },
          { id: "changes", type: "change-lists", title: "Change Lists", x: 24, y: 268, w: 900, h: 420 },
          { id: "remote-actions", type: "remote-actions", title: "Remote Actions", x: 948, y: 268, w: 760, h: 420 },
          { id: "time", type: "time-machine", title: "Time Machine", x: 24, y: 720, w: 1120, h: 620 },
          { id: "llm", type: "local-llm", title: "Local LLM", x: 1170, y: 720, w: 420, h: 260 },
        ],
      },
    ],
  };
}

function loadState(): AppState {
  for (const key of [STORAGE_KEY, OLD_STORAGE_KEY]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return normalizeState(JSON.parse(raw), defaultState);
    } catch {
      // fall through
    }
  }
  return defaultState();
}

function remoteLabel(remote: GitRemoteStatus | null) {
  if (!remote || !remote.has_remote) return "LOCAL ONLY";
  if (remote.is_diverged) return "DIVERGED";
  if (remote.ahead > 0) return "AHEAD";
  if (remote.behind > 0) return "BEHIND";
  return "IN SYNC";
}

function remoteHuman(remote: GitRemoteStatus | null) {
  if (!remote || !remote.has_remote) return "This repository is local-only. Commits stay on this computer until a remote is added and pushed.";
  if (remote.is_diverged) return "Local and remote both have commits the other side does not have.";
  if (remote.ahead > 0) return "You have local commits that are not uploaded.";
  if (remote.behind > 0) return "The remote has commits you do not have locally.";
  return "Local branch and remote tracking branch are in sync.";
}

function operationLabel(state: GitOperationState | null) {
  if (!state) return "UNKNOWN";
  if (state.conflicted_files.length > 0) return "CONFLICTS";
  if (state.rebase_in_progress) return "REBASE IN PROGRESS";
  if (state.merge_in_progress) return "MERGE IN PROGRESS";
  if (state.cherry_pick_in_progress) return "CHERRY-PICK IN PROGRESS";
  if (state.revert_in_progress) return "REVERT IN PROGRESS";
  return "CLEAR";
}

function hasInterruptedOperation(state: GitOperationState | null) {
  return Boolean(
    state &&
    (state.rebase_in_progress ||
      state.merge_in_progress ||
      state.cherry_pick_in_progress ||
      state.revert_in_progress ||
      state.conflicted_files.length > 0)
  );
}

function classifySnapshotImpact(preflight: CommitPreflight | null) {
  if (!preflight) return null;
  const churn = preflight.insertions + preflight.deletions;
  const flags: string[] = [];
  if (churn >= 500) flags.push("Large snapshot");
  if (preflight.insertions >= preflight.deletions * 5 && preflight.insertions >= 100) flags.push("Additive-heavy");
  if (preflight.deletions >= 50) flags.push("Deletion-heavy");
  if (!flags.length) return null;
  return {
    label: flags.join(" · "),
    text: churn >= 500
      ? "This snapshot contains a large amount of changed text. Review included files before creating history."
      : "This snapshot has an unusual change shape. Review included files before creating history.",
  };
}

function snapshotRemoteSentence(remote: GitRemoteStatus | null) {
  if (!remote || !remote.has_remote) return "No remote is attached. This snapshot stays only on this computer.";
  if (remote.is_diverged) return `Remote context: diverged (+${remote.ahead} / -${remote.behind}). This snapshot remains local until pushed.`;
  if (remote.ahead > 0) return `Remote context: ${remote.ahead} local snapshot(s) not uploaded. This snapshot increases that count.`;
  if (remote.behind > 0) return `Remote context: remote has ${remote.behind} snapshot(s) you do not have locally.`;
  return "Remote context: local and remote are in sync. This snapshot remains local until pushed.";
}

function guardedRemoteToken(preview: RemoteOperationPreview) {
  return preview.merge_safety.risk_level === "HIGH" ? "override" : "confirm";
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [gitVersion, setGitVersion] = useState("Checking Git...");
  const [data, setData] = useState<GitStatusResponse | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [remote, setRemote] = useState<GitRemoteStatus | null>(null);
  const [branchOverview, setBranchOverview] = useState<BranchOverview | null>(null);
  const [branchGraph, setBranchGraph] = useState<BranchGraph | null>(null);
  const [operationState, setOperationState] = useState<GitOperationState | null>(null);
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [llmEngine, setLlmEngine] = useState("ollama");
  const [llmModel, setLlmModel] = useState("qwen3:8b");
  const [message, setMessage] = useState("");
  const [systemLog, setSystemLog] = useState<SystemLogEntry[]>(() => loadSystemLog());
  const [llmLog, setLlmLog] = useState<LlmLogEntry[]>(() => loadLlmLog());
  const [selectedPanelType, setSelectedPanelType] = useState<PanelType>("current-state");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [renameTabId, setRenameTabId] = useState("");
  const [renameTabText, setRenameTabText] = useState("");
  const [busyPath, setBusyPath] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [showPreflight, setShowPreflight] = useState(false);
  const [commitPreflight, setCommitPreflight] = useState<CommitPreflight | null>(null);
  const [remotePreview, setRemotePreview] = useState<RemoteOperationPreview | null>(null);
  const [remoteBusy, setRemoteBusy] = useState("");
  const [armedRemoteUploadKey, setArmedRemoteUploadKey] = useState("");
  const [historyRefreshTick, setHistoryRefreshTick] = useState(0);
  const [lastAction, setLastAction] = useState("No file-changing action performed in this session.");
  const [uiExplainBusy] = useState(false);
  const autoRefreshBusyRef = useRef(false);
  const lastKnownStateSignatureRef = useRef("");

  const activeTab = useMemo(
    () => state.tabs.find((tab) => tab.id === state.activeTabId) || state.tabs[0] || defaultState().tabs[0],
    [state],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    saveLlmLog(llmLog);
  }, [llmLog]);

  useEffect(() => {
    saveSystemLog(systemLog);
  }, [systemLog]);

  useEffect(() => {
    void initialLoad();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (autoRefreshBusyRef.current || busyPath || remoteBusy || confirmAction || showPreflight) return;
      try {
        autoRefreshBusyRef.current = true;
        const [statusResult, remoteResult, operationResult] = await Promise.all([
          invoke<GitStatusResponse>("git_status", { repoPath: state.repoPath }),
          invoke<GitRemoteStatus>("git_remote_status", { repoPath: state.repoPath }),
          invoke<GitOperationState>("git_operation_state", { repoPath: state.repoPath }),
        ]);
        const signature = JSON.stringify({ statusResult, remoteResult, operationResult });
        if (lastKnownStateSignatureRef.current && signature !== lastKnownStateSignatureRef.current) {
          setData(statusResult);
          setRemote(remoteResult);
          setOperationState(operationResult);
          setHistoryRefreshTick((value) => value + 1);
          appendSystemLog("info", "Auto-refresh detected repository changes.");
        }
        lastKnownStateSignatureRef.current = signature;
      } catch (err) {
        appendSystemLog("warning", `Auto-refresh skipped: ${err}`);
      } finally {
        autoRefreshBusyRef.current = false;
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [state.repoPath, busyPath, remoteBusy, confirmAction, showPreflight]);

  async function initialLoad() {
    await Promise.allSettled([detectGit(), refresh(), loadRepos(), loadLocalModels(), loadBranchOverview(), loadBranchGraph()]);
  }

  function appendSystemLog(level: SystemLogEntry["level"], text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSystemLog((current) => {
      if (current[0]?.message === trimmed) return current;
      const now = new Date();

      const timestamp =
        `${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, "0")}-` +
        `${String(now.getDate()).padStart(2, "0")} ` +
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}:` +
        `${String(now.getSeconds()).padStart(2, "0")}`;

      return [{
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: timestamp,
        time: "",
        level,
        message: trimmed,
      }, ...current].slice(0, 120);
    });
  }

  function appendLlmEntry(entry: Omit<LlmLogEntry, "id" | "timestamp">) {
    if (!entry.content.trim()) return;
    setLlmLog((current) => [{
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: (() => {
        const now = new Date();

        return (
          `${now.getFullYear()}-` +
          `${String(now.getMonth() + 1).padStart(2, "0")}-` +
          `${String(now.getDate()).padStart(2, "0")} ` +
          `${String(now.getHours()).padStart(2, "0")}:` +
          `${String(now.getMinutes()).padStart(2, "0")}:` +
          `${String(now.getSeconds()).padStart(2, "0")}`
        );
      })(),
      collapsed: false,
      streaming: false,
      ...entry,
    }, ...current].slice(0, 80));
  }

  function beginLlmEntry(entry: Omit<LlmLogEntry, "id" | "timestamp" | "content">) {
    const id = `llm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setLlmLog((current) => [{
      id,
      timestamp: new Date().toLocaleTimeString(),
      content: "",
      collapsed: false,
      streaming: true,
      ...entry,
    }, ...current].slice(0, 80));
    return id;
  }

  function appendLlmChunk(id: string, chunk: string) {
    if (!chunk) return;
    setLlmLog((current) => current.map((entry) =>
      entry.id === id ? { ...entry, content: `${entry.content}${chunk}` } : entry
    ));
  }

  function finishLlmEntry(id: string, finalContent?: string) {
    setLlmLog((current) => current.map((entry) =>
      entry.id === id ? { ...entry, streaming: false, content: finalContent || entry.content } : entry
    ));
  }

  function toggleLlmEntry(id: string) {
    setLlmLog((current) => current.map((entry) =>
      entry.id === id ? { ...entry, collapsed: !entry.collapsed } : entry
    ));
  }

  async function streamLlmEntry(entry: Omit<LlmLogEntry, "id" | "timestamp" | "content">, prompt: string) {
    if (!llmModel) {
      setMessage("Local LLM unavailable: no model selected.");
      return;
    }

    const streamId = beginLlmEntry({ ...entry, model: llmModel });

    const unlisten = await listen<LlmStreamEvent>("chronogit://llm-stream", (event) => {
      if (event.payload.stream_id !== streamId) return;
      if (event.payload.error) {
        appendLlmChunk(streamId, `\n[STREAM ERROR] ${event.payload.error}`);
        finishLlmEntry(streamId);
        return;
      }
      appendLlmChunk(streamId, event.payload.chunk);
      if (event.payload.done) finishLlmEntry(streamId);
    });

    try {
      const result = await invoke<ExplainDiffResult>("explain_prompt_with_ollama_stream", {
        model: llmModel,
        streamId,
        title: entry.title,
        prompt,
      });
      finishLlmEntry(streamId, result.explanation);
      appendSystemLog("action", `Streamed local ${result.model} explanation: ${entry.title}`);
    } catch (err) {
      appendLlmChunk(streamId, `\n[ERROR] ${err}`);
      finishLlmEntry(streamId);
      appendSystemLog("error", `Local LLM streaming failed: ${err}`);
    } finally {
      unlisten();
    }
  }

  async function detectGit() {
    try {
      setGitVersion(await invoke<string>("detect_git"));
    } catch (err) {
      setGitVersion(`Git error: ${err}`);
    }
  }

  async function refresh(repoPath = state.repoPath) {
    try {
      const [statusResult, remoteResult, operationResult] = await Promise.all([
        invoke<GitStatusResponse>("git_status", { repoPath }),
        invoke<GitRemoteStatus>("git_remote_status", { repoPath }),
        invoke<GitOperationState>("git_operation_state", { repoPath }),
      ]);
      setData(statusResult);
      setRemote(remoteResult);
      setOperationState(operationResult);
      void loadBranchOverview(repoPath);
      void loadBranchGraph(repoPath);
      lastKnownStateSignatureRef.current = JSON.stringify({ statusResult, remoteResult, operationResult });
      appendSystemLog("info", "Refreshed Git status.");
      setHistoryRefreshTick((value) => value + 1);
    } catch (err) {
      setMessage(`Refresh failed: ${err}`);
      appendSystemLog("error", `Refresh failed: ${err}`);
    }
  }

  async function loadRepos() {
    try {
      setRepos(await invoke<RepoInfo[]>("discover_git_repos"));
    } catch (err) {
      setMessage(`Repository scan failed: ${err}`);
      appendSystemLog("error", `Repository scan failed: ${err}`);
    }
  }

  async function loadBranchOverview(repoPath = state.repoPath) {
    try {
      setBranchOverview(await invoke<BranchOverview>("git_branch_overview", { repoPath }));
    } catch (err) {
      setBranchOverview(null);
      appendSystemLog("warning", `Branch overview failed: ${err}`);
    }
  }

  async function loadBranchGraph(repoPath = state.repoPath) {
    try {
      setBranchGraph(await invoke<BranchGraph>("git_branch_graph", { repoPath }));
    } catch (err) {
      setBranchGraph(null);
      appendSystemLog("warning", `Branch graph failed: ${err}`);
    }
  }

  async function createBranch(branchName: string) {
    try {
      const result = await invoke<string>("git_create_branch", {
        repoPath: state.repoPath,
        branchName,
      });

      setMessage(result);
      setLastAction(result);
      appendSystemLog("action", result);
      await loadBranchOverview();
      await loadBranchGraph();
    } catch (err) {
      setMessage(`Create branch failed: ${err}`);
      appendSystemLog("error", `Create branch failed: ${err}`);
    }
  }

  function requestSwitchBranch(branch: BranchInfo) {
    setConfirmAction({
      title: "Switch active branch timeline",
      body: [
        "This switches ChronoGit to another local Git branch.",
        "",
        "Git truth:",
        "- The active branch pointer changes.",
        "- Visible working files may change to match that branch.",
        "- Future commits will be created on the selected branch.",
        "- ChronoGit blocks the switch if the working tree is dirty.",
        "",
        `Target branch: ${branch.name}`,
        `Target snapshot: ${branch.short_hash}`,
      ].join("\n"),
      confirmLabel: ui(state.beginnerMode, "Switch timeline", "git checkout"),
      danger: false,
      action: async () => {
        try {
          const result = await invoke<string>("git_switch_branch", {
            repoPath: state.repoPath,
            branchName: branch.name,
          });

          setMessage(result);
          setLastAction(result);
          appendSystemLog("action", result);

          await refresh();
          await loadBranchOverview();
          await loadBranchGraph();
        } catch (err) {
          setMessage(`Switch branch failed: ${err}`);
          appendSystemLog("error", `Switch branch failed: ${err}`);
        }
      },
    });
  }

  async function loadLocalModels(engine = llmEngine) {
    try {
      const models = await invoke<LocalModel[]>("list_local_llm_models", { engine });
      setLocalModels(models);
      if (models.length && !models.some((model) => model.name === llmModel)) {
        setLlmModel(models[0].name);
      }
    } catch (err) {
      setLocalModels([]);
      appendSystemLog("warning", `Local LLM model discovery failed: ${err}`);
    }
  }

  async function explainUiContext(context: ExplainContext) {
    const prompt = `/no_think
You are ChronoGit, a local-only Git learning assistant.
Return ONLY the final explanation. Do not include thinking, prelude, self-talk, or reasoning narration.

Explain this ChronoGit UI concept or action for a beginner, while keeping enough technical detail for an advanced developer.

Use this exact format:

Summary:
- ...

What it means:
- ...

Safe action guidance:
- ...

Risk notes:
- ...

Suggested review:
- ...

Hard rules:
- Do not invent context beyond the supplied UI context and raw truth.
- If something is not visible in the supplied context, say: not visible in this context.
- ChronoGit is local-only. Do not claim cloud behavior unless explicitly visible.
- Git truth and deterministic UI state are authoritative; the LLM explanation is advisory.

Metadata:
Kind: ${context.kind}
Title: ${context.title}

User-facing context:
${context.plainText.slice(0, 8000)}

Raw truth:
${context.rawTruth.slice(0, 12000)}`;

    await streamLlmEntry({
      source: context.kind === "preflight" ? "preflight" : context.kind === "remote" ? "remote" : context.kind === "system_log" ? "system_log" : "ui",
      model: llmModel,
      title: context.title,
      collapsed: false,
      streaming: true,
    }, prompt);
  }

  function setRepoPath(repoPath: string) {
    setState((current) => ({ ...current, repoPath }));
    void refresh(repoPath);
  }

  function updateActiveTab(mutator: (tab: WorkspaceTab) => WorkspaceTab) {
    setState((current) => ({
      ...current,
      tabs: current.tabs.map((tab) => tab.id === current.activeTabId ? mutator(tab) : tab),
    }));
  }

  function addTab() {
    const id = `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setState((current) => ({
      ...current,
      activeTabId: id,
      tabs: [...current.tabs, { id, name: `Tab ${current.tabs.length + 1}`, panels: [makePanel("current-state")] }],
    }));
  }

  function openRenameTab(tabId: string) {
    const current = state.tabs.find((tab) => tab.id === tabId);
    setRenameTabId(tabId);
    setRenameTabText(current?.name || "Tab");
  }

  function cancelRenameTab() {
    setRenameTabId("");
    setRenameTabText("");
  }

  function confirmRenameTab() {
    const name = renameTabText.trim();
    if (!renameTabId || !name) return;
    setState((old) => ({ ...old, tabs: old.tabs.map((tab) => tab.id === renameTabId ? { ...tab, name } : tab) }));
    cancelRenameTab();
  }

  function closeTab(tabId: string) {
    setState((current) => {
      if (current.tabs.length <= 1) return current;
      const tabs = current.tabs.filter((tab) => tab.id !== tabId);
      return { ...current, tabs, activeTabId: current.activeTabId === tabId ? tabs[0].id : current.activeTabId };
    });
  }

  function addPanel(type: PanelType) {
    updateActiveTab((tab) => ({ ...tab, panels: [...tab.panels, makePanel(type, tab.panels.length)] }));
  }

  function openOrAddPanel(type: PanelType) {
    updateActiveTab((tab) => {
      if (tab.panels.some((panel) => panel.type === type)) {
        return tab;
      }

      return {
        ...tab,
        panels: [...tab.panels, makePanel(type, tab.panels.length)],
      };
    });
  }

  function closePanel(panelId: string) {
    updateActiveTab((tab) => ({
      ...tab,
      panels: tab.panels.length <= 1 ? tab.panels : tab.panels.filter((panel) => panel.id !== panelId),
    }));
  }

  function movePanel(panelId: string, x: number, y: number) {
    updateActiveTab((tab) => ({
      ...tab,
      panels: tab.panels.map((panel) =>
        panel.id === panelId ? { ...panel, x: snap(Math.max(0, x)), y: snap(Math.max(0, y)) } : panel
      ),
    }));
  }

  function resizePanel(panelId: string, w: number, h: number) {
    updateActiveTab((tab) => ({
      ...tab,
      panels: tab.panels.map((panel) =>
        panel.id === panelId ? { ...panel, w: snap(Math.max(240, w)), h: snap(Math.max(140, h)) } : panel
      ),
    }));
  }

  function beginDrag(event: ReactPointerEvent, panel: PanelInstance) {
    if ((event.target as HTMLElement).closest("button,input,.cg-panel__resize")) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = panel.x;
    const originY = panel.y;

    const onMove = (moveEvent: PointerEvent) => {
      movePanel(panel.id, originX + moveEvent.clientX - startX, originY + moveEvent.clientY - startY);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function beginResize(event: ReactPointerEvent, panel: PanelInstance) {
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const originW = panel.w;
    const originH = panel.h;

    const onMove = (moveEvent: PointerEvent) => {
      resizePanel(panel.id, originW + moveEvent.clientX - startX, originH + moveEvent.clientY - startY);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function executeFileAction(action: "git_stage" | "git_unstage" | "git_unstage_prefix" | "git_restore" | "git_remove_untracked" | "git_ignore_path", path: string) {
    try {
      setBusyPath(path);
      setMessage("");
      const result =
        await executeFileActionRuntime(
          state.repoPath,
          action,
          path,
        );
      setMessage(result);
      setLastAction(`${result}.`);
      appendSystemLog("action", result);
      await refresh();
    } catch (err) {
      setMessage(`Action failed: ${err}`);
      appendSystemLog("error", `Action failed: ${err}`);
    } finally {
      setBusyPath("");
    }
  }

  async function runFileAction(action: "git_stage" | "git_unstage" | "git_unstage_prefix" | "git_restore" | "git_remove_untracked" | "git_ignore_path", path: string) {
    if (action === "git_restore" || action === "git_remove_untracked") {
      setConfirmAction({
        title: action === "git_restore" ? "Restore / discard local change" : "Remove untracked file",
        body: action === "git_restore"
          ? `This discards the local working-folder edit and restores the last committed version.\n\nPath:\n${path}`
          : `This deletes an untracked file. Git cannot restore it from history.\n\nPath:\n${path}`,
        confirmLabel: action === "git_restore" ? ui(state.beginnerMode, "Restore / discard", "git restore") : ui(state.beginnerMode, "Remove untracked file", "rm"),
        danger: true,
        action: async () => executeFileAction(action, path),
      });
      return;
    }
    await executeFileAction(action, path);
  }

  async function openSnapshotPreflight() {
    try {
      setMessage("");
      const result =
        await openSnapshotPreflightRuntime(
          state.repoPath,
        );
      setCommitPreflight(result);
      setShowPreflight(true);
    } catch (err) {
      setMessage(`Preflight failed: ${err}`);
      appendSystemLog("error", `Preflight failed: ${err}`);
    }
  }

  async function confirmSnapshot() {
    try {
      const result =
        await confirmSnapshotRuntime(
          state.repoPath,
          commitMessage,
        );
      setMessage(result.message);
      setLastAction(`${result.message}. This snapshot is local until pushed.`);
      appendSystemLog(result.ok ? "action" : "error", result.message);
      setCommitMessage("");
      setShowPreflight(false);
      await refresh();
    } catch (err) {
      setMessage(`SNAPSHOT FAILED: ${err}`);
      appendSystemLog("error", `SNAPSHOT FAILED: ${err}`);
    }
  }

  function remotePreviewKey(preview: RemoteOperationPreview) {
    return [
      preview.operation,
      preview.branch,
      preview.upstream || "none",
      preview.ahead,
      preview.behind,
      preview.commit_count,
      preview.changed_files.map((file) => `${file.status}:${file.path}`).join("|"),
    ].join("::");
  }

  function isUploadPreviewArmed(preview: RemoteOperationPreview) {
    return preview.operation === "upload_snapshots_preview" && armedRemoteUploadKey === remotePreviewKey(preview);
  }

  async function fetchRemoteKnowledge() {
    try {
      setRemoteBusy("fetch");
      const result =
        await fetchRemoteKnowledgeRuntime(
          state.repoPath,
        );
      setMessage(result);
      setLastAction(`${result} This updated remote-tracking knowledge only.`);
      appendSystemLog("action", result);
      await refresh();
    } catch (err) {
      setMessage(`Fetch remote knowledge failed: ${err}`);
      appendSystemLog("error", `Fetch remote knowledge failed: ${err}`);
    } finally {
      setRemoteBusy("");
    }
  }

  async function loadRemotePreview(kind: "push" | "pull") {
    try {
      setRemoteBusy(kind);
      const result =
        await loadRemotePreviewRuntime(
          state.repoPath,
          kind,
        );
      setRemotePreview(result);
      setArmedRemoteUploadKey("");
      appendSystemLog("info", `${kind === "push" ? "Upload" : "Download"} preview loaded.`);
    } catch (err) {
      setRemotePreview(null);
      setMessage(`${kind === "push" ? "Upload" : "Download"} preview failed: ${err}`);
      appendSystemLog("error", `${kind === "push" ? "Upload" : "Download"} preview failed: ${err}`);
    } finally {
      setRemoteBusy("");
    }
  }

  async function executePush(preview: RemoteOperationPreview) {
    try {
      setRemoteBusy("push_execute");
      const result =
        await executePushRuntime(
          state.repoPath,
          guardedRemoteToken(preview),
        );
      setRemotePreview(null);
      setArmedRemoteUploadKey("");
      setMessage(`${result.message}${result.stderr ? ` stderr: ${result.stderr}` : ""}`);
      setLastAction(result.message);
      appendSystemLog(result.ok ? "action" : "error", result.message);
      await refresh();
    } catch (err) {
      setMessage(`Upload snapshots failed: ${err}`);
      appendSystemLog("error", `Upload snapshots failed: ${err}`);
    } finally {
      setRemoteBusy("");
    }
  }

  async function executePullRebase(preview: RemoteOperationPreview) {
    try {
      setRemoteBusy("pull_execute");
      const result =
        await executePullRebaseRuntime(
          state.repoPath,
          guardedRemoteToken(preview),
        );
      setRemotePreview(null);
      setMessage(`${result.message}${result.stderr ? ` stderr: ${result.stderr}` : ""}`);
      setLastAction(result.message);
      appendSystemLog(result.ok ? "action" : "error", result.message);
      await refresh();
    } catch (err) {
      setMessage(`Download updates failed: ${err}`);
      appendSystemLog("error", `Download updates failed: ${err}`);
    } finally {
      setRemoteBusy("");
    }
  }

  async function abortRebase() {
    try {
      setRemoteBusy("abort_rebase");
      const result =
        await abortRebaseRuntime(
          state.repoPath,
        );
      setRemotePreview(null);
      setArmedRemoteUploadKey("");
      setMessage(result);
      setLastAction(result);
      appendSystemLog("action", result);
      await refresh();
    } catch (err) {
      setMessage(`Abort rebase failed: ${err}`);
      appendSystemLog("error", `Abort rebase failed: ${err}`);
    } finally {
      setRemoteBusy("");
    }
  }

  function renderPanel(panel: PanelInstance) {
    if (panel.type === "current-state") {
      return (
        <CurrentStatePanel
          beginnerMode={state.beginnerMode}
          branch={data?.branch || "unknown"}
          remote={remote}
          lastAction={lastAction}
          message={message}
          remoteLabel={remoteLabel}
          remoteHuman={remoteHuman}
          ui={ui}
        />
      );
    }

    if (panel.type === "remote-status") {
      return (
        <RemoteStatusPanel
          branch={data?.branch || "unknown"}
          remote={remote}
          remoteLabel={remoteLabel}
        />
      );
    }

    if (panel.type === "commit-preflight") {
      return (
        <CommitPreflightPanel
          beginnerMode={state.beginnerMode}
          staged={data?.staged || []}
          working={data?.working || []}
          remote={remote}
          llmModel={llmModel}
          uiExplainBusy={uiExplainBusy}
          explainUiContext={explainUiContext}
          openSnapshotPreflight={openSnapshotPreflight}
          snapshotRemoteSentence={snapshotRemoteSentence}
          ui={ui}
        />
      );
    }

    if (panel.type === "change-lists") {
      return (
        <ChangeListsPanel
          beginnerMode={state.beginnerMode}
          staged={data?.staged || []}
          working={data?.working || []}
          busyPath={busyPath}
          uiExplainBusy={uiExplainBusy}
          llmModel={llmModel}
          runFileAction={runFileAction}
          explainUiContext={explainUiContext}
          ui={ui}
        />
      );
    }

    if (panel.type === "branches") {
      return (
        <BranchPanel
          beginnerMode={state.beginnerMode}
          repoPath={state.repoPath}
          branchOverview={branchOverview}
          branchGraph={branchGraph}
          loadBranchOverview={() => Promise.all([loadBranchOverview(), loadBranchGraph()]).then(() => undefined)}
          createBranch={createBranch}
          requestSwitchBranch={requestSwitchBranch}
          openOrAddPanel={openOrAddPanel}
          ui={ui}
        />
      );
    }

    if (panel.type === "remote-actions") {
      return (
        <RemoteActionsPanel
          beginnerMode={state.beginnerMode}
          remoteBusy={remoteBusy}
          remotePreview={remotePreview}
          fetchRemoteKnowledge={fetchRemoteKnowledge}
          loadRemotePreview={loadRemotePreview}
          abortRebase={abortRebase}
          isUploadPreviewArmed={isUploadPreviewArmed}
          setConfirmAction={setConfirmAction}
          setConfirmText={setConfirmText}
          setArmedRemoteUploadKey={setArmedRemoteUploadKey}
          setLastAction={setLastAction}
          setMessage={setMessage}
          executePush={executePush}
          executePullRebase={executePullRebase}
          explainUiContext={explainUiContext}
          uiExplainBusy={uiExplainBusy}
          llmModel={llmModel}
        />
      );
    }

    if (panel.type === "time-machine") {
      return (
        <TimeMachinePanel
          repoPath={state.repoPath}
          refreshTick={historyRefreshTick}
          beginnerMode={state.beginnerMode}
          llmModel={llmModel}
          appendLlmEntry={appendLlmEntry}
          setConfirmAction={setConfirmAction}
        />
      );
    }

    if (panel.type === "local-llm") {
      return (
        <LocalLlmPanel
          beginnerMode={state.beginnerMode}
          localModels={localModels}
          llmEngine={llmEngine}
          llmModel={llmModel}
          setLlmEngine={setLlmEngine}
          setLlmModel={setLlmModel}
          loadLocalModels={() => loadLocalModels()}
          ui={ui}
        />
      );
    }

    if (panel.type === "system-log") {
      return (
        <SystemLogPanel
          beginnerMode={state.beginnerMode}
          systemLog={systemLog}
          clearSystemLog={() => setSystemLog([])}
          backupAndClearSystemLog={async () => {
            const path = await backupSystemLog(systemLog);
            setSystemLog([]);
            setMessage(`System log backed up to: ${path}`);
          }}
          openLogBackupFolder={async () => {
            const path = await openLogBackupFolder();
            setMessage(`Opened log backup folder: ${path}`);
          }}
          ui={ui}
        />
      );
    }

    if (panel.type === "llm-log") {
      return (
        <LlmLogPanel
          beginnerMode={state.beginnerMode}
          llmLog={llmLog}
          toggleLlmEntry={toggleLlmEntry}
          clearLlmLog={() => setLlmLog([])}
          backupAndClearLlmLog={async () => {
            const path = await backupLlmLog(llmLog);
            setLlmLog([]);
            setMessage(`LLM log backed up to: ${path}`);
          }}
          openLogBackupFolder={async () => {
            const path = await openLogBackupFolder();
            setMessage(`Opened log backup folder: ${path}`);
          }}
          ui={ui}
        />
      );
    }

    if (panel.type === "repository" || panel.type === "git-status") {
      return <div className="cg-panel-content"><p>This truth now lives in the title bar.</p></div>;
    }

    if (panel.type === "notes") return <NotesPanel setConfirmAction={setConfirmAction} />;
    return <div className="cg-panel-content"><p>Empty panel.</p></div>;
  }

  const preflightWarnings = data?.staged.filter((file) => ["danger", "critical", "evidence"].includes(file.risk)) || [];
  const hasCritical = data?.staged.some((file) => file.risk === "critical") || false;
  const snapshotImpact = classifySnapshotImpact(commitPreflight);

  return (
    <main className="app-shell">
      <div className="chronogit-titlebar">
        <div className="chronogit-titlebar__brand">
          <img src={jarriLogo} alt="Jarri" className="chronogit-titlebar__logo" />
          <div>
            <h1>ChronoGit</h1>
            <p>Git is truth · panels are projections.</p>
          </div>
        </div>

        <div className="chronogit-titlebar__truth">
          <label>
            Repository
            <RepoDropdown value={state.repoPath} repos={repos} onChange={setRepoPath} beginnerMode={state.beginnerMode} />
          </label>
          <div className="chronogit-titlebar__fact"><strong>Git</strong><span>{gitVersion}</span></div>
          <div className="chronogit-titlebar__fact"><strong>Branch</strong><span>{data?.branch || "unknown"}</span></div>
          <div className="chronogit-titlebar__fact"><strong>Changes</strong><span>{data ? `${data.working.length} working · ${data.staged.length} prepared` : "not loaded"}</span></div>
          <div className="chronogit-titlebar__fact"><strong>Remote</strong><span>{remoteLabel(remote)} {remote ? `+${remote.ahead} / -${remote.behind}` : ""}</span></div>
          <button onClick={loadRepos}>{ui(state.beginnerMode, "Scan repositories", "discover_git_repos")}</button>
          <button onClick={() => refresh()}>{ui(state.beginnerMode, "Refresh Git state", "git status")}</button>
          <button className="chronogit-titlebar__mode" onClick={() => setState((current) => ({ ...current, beginnerMode: !current.beginnerMode }))}>
            {ui(state.beginnerMode, "Beginner: ON", "Beginner: OFF")}
          </button>
        </div>
      </div>

      <div className="cg-tabs">
        {state.tabs.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === activeTab.id ? "cg-tab cg-tab--active" : "cg-tab"}
            onClick={() => setState((current) => ({ ...current, activeTabId: tab.id }))}
            onDoubleClick={() => openRenameTab(tab.id)}
            title={ui(state.beginnerMode, "Double-click to rename tab", "rename tab")}
          >
            {tab.name}
            <span onClick={(event) => { event.stopPropagation(); openRenameTab(tab.id); }}>✎</span>
            <span onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }}>×</span>
          </button>
        ))}
        <button className="cg-tab cg-tab--add" onClick={addTab}>+ Tab</button>
        <div className="cg-panel-add">
          <PanelDropdown value={selectedPanelType} onChange={setSelectedPanelType} beginnerMode={state.beginnerMode} />
          <button onClick={() => addPanel(selectedPanelType)}>+ Panel</button>
        </div>
      </div>

      {hasInterruptedOperation(operationState) ? (
        <section className="operation-state-banner">
          <strong>{operationLabel(operationState)}</strong>
          <span>{operationState?.warning}</span>
          {operationState?.conflicted_files.map((file) => <code key={file}>{file}</code>)}
          {operationState?.rebase_in_progress ? <button className="danger-button" onClick={abortRebase}>{ui(state.beginnerMode, "Abort rebase", "git rebase --abort")}</button> : null}
        </section>
      ) : null}

      <section className="cg-canvas">
        {activeTab.panels.map((panel) => (
          <section key={panel.id} className="cg-panel" style={{ left: panel.x, top: panel.y, width: panel.w, height: panel.h }}>
            <header className="cg-panel__header" onPointerDown={(event) => beginDrag(event, panel)}>
              <strong>{panel.title}</strong>
              <button onClick={() => closePanel(panel.id)}>×</button>
            </header>
            {renderPanel(panel)}
            <div className="cg-panel__resize" onPointerDown={(event) => beginResize(event, panel)} />
          </section>
        ))}
      </section>

      {renameTabId ? (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal__eyebrow">Workspace tab</div>
            <h2>Rename tab</h2>
            <label className="confirm-required-text">
              <span>Choose a clear name for this ChronoGit workspace tab.</span>
              <input
                autoFocus
                value={renameTabText}
                onChange={(event) => setRenameTabText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") confirmRenameTab();
                  if (event.key === "Escape") cancelRenameTab();
                }}
                placeholder="Tab name"
              />
            </label>
            <div className="confirm-modal__actions">
              <button onClick={cancelRenameTab}>Cancel</button>
              <button className="confirm" disabled={!renameTabText.trim()} onClick={confirmRenameTab}>Rename tab</button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <ConfirmModal
          action={confirmAction}
          confirmText={confirmText}
          setConfirmText={setConfirmText}
          onCancel={() => {
            setConfirmAction(null);
            setConfirmText("");
          }}
          onConfirm={async () => {
            const action = confirmAction.action;

            setConfirmAction(null);
            setConfirmText("");

            await action();
          }}
        />
      ) : null}

      {showPreflight ? (
        <SnapshotPreflightModal
          beginnerMode={state.beginnerMode}
          commitPreflight={commitPreflight}
          staged={data?.staged || []}
          preflightWarnings={preflightWarnings}
          hasCritical={hasCritical}
          snapshotImpact={snapshotImpact}
          remote={remote}
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          onCancel={() => setShowPreflight(false)}
          onConfirm={confirmSnapshot}
          snapshotRemoteSentence={snapshotRemoteSentence}
          ui={ui}
        />
      ) : null}
    </main>
  );
}

