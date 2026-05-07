import type { LlmLogEntry } from "./chronogitRuntimeTypes";

const LLM_LOG_STORAGE_KEY = "chronogit_llm_log_v1";

export function loadLlmLog(): LlmLogEntry[] {
  try {
    const raw = localStorage.getItem(LLM_LOG_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry) =>
      entry &&
      typeof entry.id === "string" &&
      typeof entry.timestamp === "string" &&
      typeof entry.source === "string" &&
      typeof entry.model === "string" &&
      typeof entry.title === "string" &&
      typeof entry.content === "string"
    ) as LlmLogEntry[];
  } catch {
    return [];
  }
}

export function saveLlmLog(entries: LlmLogEntry[]) {
  localStorage.setItem(LLM_LOG_STORAGE_KEY, JSON.stringify(entries));
}

export function backupLlmLog(entries: LlmLogEntry[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `chronogit-llm-log-${timestamp}.json`;
  const body = JSON.stringify({
    exported_at: new Date().toISOString(),
    kind: "chronogit_llm_log_backup",
    entries,
  }, null, 2);

  const blob = new Blob([body], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
