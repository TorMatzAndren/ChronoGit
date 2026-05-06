import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import jarriLogo from "./assets/jarri-logo.png";
import { PANEL_REGISTRY } from "./panels/panelRegistry";
import { LlmLogPanel } from "./panels/LlmLogPanel";
import { SystemLogPanel } from "./panels/SystemLogPanel";
import { NotesPanel } from "./panels/NotesPanel";
import { CurrentStatePanel } from "./panels/CurrentStatePanel";
import { CommitPreflightPanel } from "./panels/CommitPreflightPanel";
import { ChangeListsPanel } from "./panels/ChangeListsPanel";
import { RemoteStatusPanel } from "./panels/RemoteStatusPanel";
import { RemoteActionsPanel } from "./panels/RemoteActionsPanel";
import { LocalLlmPanel } from "./panels/LocalLlmPanel";
import { TimeMachinePanel } from "./panels/TimeMachinePanel";
import type { PanelInstance, PanelType, WorkspaceTab } from "./core/chronogitWorkspaceTypes";
import type {
  CommitPreflight,
  CommitResult,
  ExplainContext,
  FileChange,
  GitRemoteStatus,
  LlmLogEntry,
  LocalModel,
  SystemLogEntry,
} from "./core/chronogitRuntimeTypes";

type GitStatusResponse = {
  branch: string;
  staged: FileChange[];
  working: FileChange[];
};

type RepoInfo = {
  path: string;
  name: string;
  root: string;
};

type GitOperationState = {
  rebase_in_progress: boolean;
  merge_in_progress: boolean;
  cherry_pick_in_progress: boolean;
  revert_in_progress: boolean;
  conflicted_files: string[];
  warning: string;
};

type ChangedFile = {
  path: string;
  status: string;
};

type RemotePullResult = {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
};

type RemotePushResult = {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
};

type MergeSafetyPrediction = {
  classification: string;
  risk_level: string;
  summary: string;
  local_touched_files: number;
  remote_touched_files: number;
  local_files: string[];
  remote_files: string[];
  shared_files: string[];
  working_changes: number;
  warning: string;
};

type RemoteOperationPreview = {
  operation: string;
  repo_path: string;
  branch: string;
  upstream: string | null;
  remote: string | null;
  ahead: number;
  behind: number;
  commit_count: number;
  commits: string[];
  changed_files: ChangedFile[];
  consequence: string;
  warning: string;
  merge_safety: MergeSafetyPrediction;
};

type ExplainDiffResult = {
  model: string;
  explanation: string;
  tdp_before_watts: string;
  tdp_active_watts: string;
  tdp_reset_watts: string;
};

type ConfirmAction = {
  title: string;
  body: string;
  confirmLabel: string;
  danger: boolean;
  action: () => Promise<void>;
  requiredText?: string;
  requiredTextLabel?: string;
};

type LlmStreamEvent = {
  stream_id: string;
  chunk: string;
  done: boolean;
  error: string | null;
};

type AppState = {
  activeTabId: string;
  beginnerMode: boolean;
  repoPath: string;
  tabs: WorkspaceTab[];
};

const STORAGE_KEY = "chronogit_workspace_state_v3";
const OLD_STORAGE_KEY = "chronogit_workspace_state_v2";
const DEFAULT_REPO = "/home/dretski/projects/ChronoGit";
const GRID = 12;

function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}

function ui(beginnerMode: boolean, beginner: string, pro: string) {
  return beginnerMode ? beginner : pro;
}

function titleFor(type: PanelType) {
  return PANEL_REGISTRY.find((panel) => panel.type === type)?.title || "Panel";
}

function makePanel(type: PanelType, index = 0): PanelInstance {
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

function normalizePanel(panel: Partial<PanelInstance>, index: number): PanelInstance {
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

function normalizeState(input: unknown): AppState {
  if (!input || typeof input !== "object") return defaultState();
  const raw = input as Partial<AppState>;
  if (!Array.isArray(raw.tabs) || !raw.tabs.length) return defaultState();

  const tabs = raw.tabs.map((tab, tabIndex) => ({
    id: String(tab.id || `tab-${tabIndex}`),
    name: String(tab.name || `Tab ${tabIndex + 1}`),
    panels: Array.isArray(tab.panels) && tab.panels.length
      ? tab.panels.map(normalizePanel)
      : [makePanel("current-state")],
  }));

  return {
    activeTabId: tabs.some((tab) => tab.id === raw.activeTabId) ? String(raw.activeTabId) : tabs[0].id,
    beginnerMode: raw.beginnerMode !== false,
    repoPath: String(raw.repoPath || DEFAULT_REPO),
    tabs,
  };
}

function loadState(): AppState {
  for (const key of [STORAGE_KEY, OLD_STORAGE_KEY]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return normalizeState(JSON.parse(raw));
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

function RepoDropdown({
  value,
  repos,
  onChange,
  beginnerMode,
}: {
  value: string;
  repos: RepoInfo[];
  onChange: (repoPath: string) => void;
  beginnerMode: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedRepo = repos.find((repo) => repo.path === value);
  const filteredRepos = repos.filter((repo) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return `${repo.name} ${repo.path}`.toLowerCase().includes(needle);
  });

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="cg-repo-dropdown" ref={rootRef}>
      <button
        type="button"
        className="cg-repo-dropdown__button"
        onClick={() => setOpen((current) => !current)}
        title={beginnerMode ? "Select which local Git repository ChronoGit should inspect." : "repo selector"}
      >
        <span>
          <strong>{selectedRepo?.name || "Selected repository"}</strong>
          <em>{value}</em>
        </span>
        <b>{open ? "▲" : "▼"}</b>
      </button>

      {open ? (
        <div className="cg-repo-dropdown__menu">
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories..." />
          <div className="cg-repo-dropdown__list">
            {filteredRepos.length ? filteredRepos.map((repo) => (
              <button
                type="button"
                key={repo.path}
                className={repo.path === value ? "cg-repo-dropdown__item cg-repo-dropdown__item--active cg-repo-dropdown__item--selected" : "cg-repo-dropdown__item"}
                onClick={() => {
                  onChange(repo.path);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <strong>{repo.name}</strong>
                <span>{repo.path}</span>
              </button>
            )) : <div className="cg-repo-dropdown__empty">No repositories match this search.</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PanelDropdown({
  value,
  onChange,
  beginnerMode,
}: {
  value: PanelType;
  onChange: (type: PanelType) => void;
  beginnerMode: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selected = PANEL_REGISTRY.find((panel) => panel.type === value) || PANEL_REGISTRY[0];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="cg-panel-dropdown" ref={rootRef}>
      <button type="button" className="cg-panel-dropdown__button" onClick={() => setOpen((current) => !current)}>
        <span>{selected.title}</span>
        <b>{open ? "▲" : "▼"}</b>
      </button>
      {open ? (
        <div className="cg-panel-dropdown__menu">
          <div className="cg-panel-dropdown__list">
            {PANEL_REGISTRY.map((panel) => (
              <button
                type="button"
                key={panel.type}
                className={panel.type === value ? "cg-panel-dropdown__item cg-panel-dropdown__item--active" : "cg-panel-dropdown__item"}
                title={beginnerMode ? panel.description : panel.type}
                onClick={() => {
                  onChange(panel.type);
                  setOpen(false);
                }}
              >
                <strong>{panel.title}</strong>
                <span>{beginnerMode ? panel.description : panel.type}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [gitVersion, setGitVersion] = useState("Checking Git...");
  const [data, setData] = useState<GitStatusResponse | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [remote, setRemote] = useState<GitRemoteStatus | null>(null);
  const [operationState, setOperationState] = useState<GitOperationState | null>(null);
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [llmEngine, setLlmEngine] = useState("ollama");
  const [llmModel, setLlmModel] = useState("qwen3:8b");
  const [message, setMessage] = useState("");
  const [systemLog, setSystemLog] = useState<SystemLogEntry[]>([]);
  const [llmLog, setLlmLog] = useState<LlmLogEntry[]>([]);
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
    await Promise.allSettled([detectGit(), refresh(), loadRepos(), loadLocalModels()]);
  }

  function appendSystemLog(level: SystemLogEntry["level"], text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSystemLog((current) => {
      if (current[0]?.message === trimmed) return current;
      const now = new Date();
      return [{
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        level,
        message: trimmed,
      }, ...current].slice(0, 120);
    });
  }

  function appendLlmEntry(entry: Omit<LlmLogEntry, "id" | "timestamp">) {
    if (!entry.content.trim()) return;
    setLlmLog((current) => [{
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toLocaleTimeString(),
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

  async function executeFileAction(action: "git_stage" | "git_unstage" | "git_restore" | "git_remove_untracked" | "git_ignore_path", path: string) {
    try {
      setBusyPath(path);
      setMessage("");
      const result = await invoke<string>(action, { repoPath: state.repoPath, path });
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

  async function runFileAction(action: "git_stage" | "git_unstage" | "git_restore" | "git_remove_untracked" | "git_ignore_path", path: string) {
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
      const result = await invoke<CommitPreflight>("git_commit_preflight", { repoPath: state.repoPath });
      setCommitPreflight(result);
      setShowPreflight(true);
    } catch (err) {
      setMessage(`Preflight failed: ${err}`);
      appendSystemLog("error", `Preflight failed: ${err}`);
    }
  }

  async function confirmSnapshot() {
    try {
      const result = await invoke<CommitResult>("git_commit", { repoPath: state.repoPath, message: commitMessage });
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
      const result = await invoke<string>("git_fetch_remote", { repoPath: state.repoPath });
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
      const command = kind === "push" ? "git_push_preview" : "git_pull_preview";
      const result = await invoke<RemoteOperationPreview>(command, { repoPath: state.repoPath });
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
      const result = await invoke<RemotePushResult>("git_push_execute", { repoPath: state.repoPath, overrideToken: guardedRemoteToken(preview) });
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
      const result = await invoke<RemotePullResult>("git_pull_rebase_execute", { repoPath: state.repoPath, overrideToken: guardedRemoteToken(preview) });
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
      const result = await invoke<string>("git_rebase_abort", { repoPath: state.repoPath });
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
        <div className="confirm-overlay">
          <div className={`confirm-modal ${confirmAction.danger ? "confirm-modal--danger" : ""}`}>
            <div className="confirm-modal__eyebrow">{confirmAction.danger ? "Destructive action" : "Confirmation"}</div>
            <h2>{confirmAction.title}</h2>
            <pre>{confirmAction.body}</pre>
            {confirmAction.requiredText ? (
              <label className="confirm-required-text">
                <span>{confirmAction.requiredTextLabel || `Type ${confirmAction.requiredText} to continue.`}</span>
                <input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder={confirmAction.requiredText} />
              </label>
            ) : null}
            <div className="confirm-modal__actions">
              <button onClick={() => { setConfirmAction(null); setConfirmText(""); }}>Cancel</button>
              <button
                className={confirmAction.danger ? "danger-button" : "confirm"}
                disabled={Boolean(confirmAction.requiredText && confirmText.trim() !== confirmAction.requiredText)}
                onClick={async () => {
                  const action = confirmAction.action;
                  setConfirmAction(null);
                  setConfirmText("");
                  await action();
                }}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPreflight ? (
        <div className="preflight-overlay">
          <div className="preflight-modal">
            <h2>{ui(state.beginnerMode, "Snapshot Preflight", "git commit preflight")}</h2>
            <p>{ui(state.beginnerMode, "Only prepared files will be included.", "Only index/staged files are committed.")}</p>
            <div className="snapshot-boundary-box">
              <h3>{ui(state.beginnerMode, "Next snapshot contains", "git diff --cached --stat")}</h3>
              <div className="snapshot-boundary-grid">
                <div><strong>{commitPreflight?.staged_files ?? data?.staged.length ?? 0}</strong><span>files</span></div>
                <div><strong>+{commitPreflight?.insertions ?? 0}</strong><span>insertions</span></div>
                <div><strong>-{commitPreflight?.deletions ?? 0}</strong><span>deletions</span></div>
              </div>
              <p>{snapshotRemoteSentence(remote)}</p>
              {snapshotImpact ? <div className="snapshot-impact-warning"><strong>{snapshotImpact.label}</strong><span>{snapshotImpact.text}</span></div> : null}
            </div>
            <h3>Included files ({data?.staged.length ?? 0})</h3>
            <div className="preflight-list">{data?.staged.map((file) => <div key={file.path} className="preflight-item">✔ {file.path}</div>)}</div>
            {preflightWarnings.length ? (
              <div className="preflight-warnings">{preflightWarnings.map((file) => <div key={file.path} className="warning-item">⚠ {file.path} — {file.risk}</div>)}</div>
            ) : <p>No dangerous prepared files detected.</p>}
            <input className="preflight-input" value={commitMessage} onChange={(event) => setCommitMessage(event.target.value)} placeholder={ui(state.beginnerMode, "Describe this snapshot...", "commit message")} />
            <div className="preflight-actions">
              <button onClick={() => setShowPreflight(false)}>Cancel</button>
              <button className="confirm" disabled={!commitMessage.trim() || hasCritical} onClick={confirmSnapshot}>{ui(state.beginnerMode, "Create snapshot", "git commit")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

