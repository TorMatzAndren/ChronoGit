export type RepoInfo = {
  path: string;
  name: string;
  root: string;
};

export type HistoryCommit = {
  hash: string;
  short_hash: string;
  author: string;
  timestamp: string;
  message: string;
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
