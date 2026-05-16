export type RepoInfo = {
  path: string;
  name: string;
  root: string;
};

export type GitStatusResponse = {
  branch: string;
  staged: FileChange[];
  working: FileChange[];
};

export type GitOperationState = {
  rebase_in_progress: boolean;
  merge_in_progress: boolean;
  cherry_pick_in_progress: boolean;
  revert_in_progress: boolean;
  conflicted_files: string[];
  warning: string;
};

export type LlmStreamEvent = {
  stream_id: string;
  chunk: string;
  done: boolean;
  error: string | null;
};

export type FileChange = {
  path: string;
  index_status?: string;
  worktree_status?: string;
  status: string;
  risk: string;
  staged: boolean;
  explanation: string;
};

export type CommitPreflight = {
  staged_files: number;
  insertions: number;
  deletions: number;
  is_empty: boolean;
};

export type ExplainContext = {
  kind: string;
  title: string;
  plainText: string;
  rawTruth: string;
};

export type HistoryCommit = {
  hash: string;
  short_hash: string;
  author: string;
  timestamp: string;
  message: string;
};

export type FileHistoryEntry = {
  hash: string;
  short_hash: string;
  author: string;
  timestamp: string;
  message: string;
  status: string;
  path: string;
};

export type FileRenameEvent = {
  hash: string;
  old_path: string;
  new_path: string;
};

export type FileLineage = {
  path: string;
  commits: FileHistoryEntry[];
  first_commit: FileHistoryEntry | null;
  last_commit: FileHistoryEntry | null;
  renamed: boolean;
  deleted: boolean;
  rename_events: FileRenameEvent[];
};

export type ChangedFile = {
  path: string;
  status: string;
};

export type DiffResult = {
  commit_hash: string;
  path: string;
  diff: string;
};

export type CommitComparison = {
  left_commit: string;
  right_commit: string;
  left_label: string;
  right_label: string;
  changed_files: ChangedFile[];
  insertions: number;
  deletions: number;
  diff: string;
};

export type ExplainDiffResult = {
  model: string;
  explanation: string;
  tdp_before_watts: string;
  tdp_active_watts: string;
  tdp_reset_watts: string;
};

export type CommitResult = {
  ok: boolean;
  message: string;
  commit_hash: string;
};

export type LocalModel = {
  name: string;
  engine: string;
  size: number;
  modified_at?: string;
  family: string;
  parameter_size: string;
  quantization_level: string;
};

export type GitRemoteStatus = {
  repo_path?: string;
  branch: string;
  upstream: string | null;
  remote?: string | null;
  remote_url: string | null;
  ahead: number;
  behind: number;
  has_remote: boolean;
  is_diverged: boolean;
  is_clean?: boolean;
};

export type RemotePullResult = {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
};

export type RemotePushResult = {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
};

export type MergeSafetyPrediction = {
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

export type RemoteOperationPreview = {
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

export type ConfirmAction = {
  title: string;
  body: string;
  confirmLabel: string;
  danger: boolean;
  action: () => Promise<void>;
  requiredText?: string;
  requiredTextLabel?: string;
};

export type SystemLogEntry = {
  id: string;
  date: string;
  time: string;
  level: "info" | "warning" | "error" | "action";
  message: string;
};

export type LlmLogEntry = {
  id: string;
  timestamp: string;
  source: "diff" | "ui" | "remote" | "preflight" | "system_log";
  model: string;
  title: string;
  content: string;
  streaming?: boolean;
  collapsed?: boolean;
};

export type BranchInfo = {
  name: string;
  full_name: string;
  short_hash: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  is_current: boolean;
  is_remote: boolean;
  is_detached: boolean;
};

export type BranchOverview = {
  current_branch: string;
  detached_head: boolean;
  local_branches: BranchInfo[];
  remote_branches: BranchInfo[];
};

export type BranchGraphCommit = {
  hash: string;
  short_hash: string;
  parents: string[];
  refs: string[];
  author: string;
  date: string;
  subject: string;
  is_head: boolean;
};

export type BranchGraphRef = {
  name: string;
  full_name: string;
  kind: "local" | "remote" | "tag" | "other";
  target_short_hash: string;
};

export type BranchGraph = {
  commits: BranchGraphCommit[];
  refs: BranchGraphRef[];
};



export type BranchMergePreview = {
  repo_path: string;
  current_branch: string;
  target_branch: string;
  mode: string;
  risk_level: string;
  allowed: boolean;
  required_confirmation: string;
  blockers: string[];
  consequence: string;
  warning: string;
  relationship: BranchRelationshipPreview;
};

export type BranchMergeResult = {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
};

export type BranchRelationshipPreview = {
  repo_path: string;
  left_branch: string;
  right_branch: string;
  left_head: string;
  right_head: string;
  merge_base: string;
  left_only_commits: string[];
  right_only_commits: string[];
  left_only_files: string[];
  right_only_files: string[];
  shared_touched_files: string[];
  insertions: number;
  deletions: number;
  left_ahead: number;
  right_ahead: number;
  can_fast_forward_left: boolean;
  can_fast_forward_right: boolean;
  classification: string;
  risk_level: string;
  working_changes: number;
  summary: string;
  warning: string;
};

