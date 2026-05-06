export type RepoInfo = {
  path: string;
  name: string;
  root: string;
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
