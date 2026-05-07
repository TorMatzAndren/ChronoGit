import { invoke } from "@tauri-apps/api/core";
import type { LlmLogEntry, SystemLogEntry } from "./chronogitRuntimeTypes";

const LLM_LOG_STORAGE_KEY = "chronogit_llm_log_v1";
const SYSTEM_LOG_STORAGE_KEY = "chronogit_system_log_v1";

function backupFilename(kind: "llm-log" | "system-log") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `chronogit-${kind}-${timestamp}.json`;
}

async function saveBackupFile(filename: string, body: string) {
  return invoke<string>("save_log_backup", {
    filename,
    body,
  });
}

export async function openLogBackupFolder() {
  return invoke<string>("open_log_backup_folder");
}

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

export async function backupLlmLog(entries: LlmLogEntry[]) {
  return saveBackupFile(
    backupFilename("llm-log"),
    JSON.stringify({
      exported_at: new Date().toISOString(),
      kind: "chronogit_llm_log_backup",
      entries,
    }, null, 2),
  );
}

export function loadSystemLog(): SystemLogEntry[] {
  try {
    const raw = localStorage.getItem(SYSTEM_LOG_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry) =>
      entry &&
      typeof entry.id === "string" &&
      typeof entry.date === "string" &&
      typeof entry.time === "string" &&
      typeof entry.level === "string" &&
      typeof entry.message === "string"
    ) as SystemLogEntry[];
  } catch {
    return [];
  }
}

export function saveSystemLog(entries: SystemLogEntry[]) {
  localStorage.setItem(SYSTEM_LOG_STORAGE_KEY, JSON.stringify(entries));
}

export async function backupSystemLog(entries: SystemLogEntry[]) {
  return saveBackupFile(
    backupFilename("system-log"),
    JSON.stringify({
      exported_at: new Date().toISOString(),
      kind: "chronogit_system_log_backup",
      entries,
    }, null, 2),
  );
}

export async function backupPatchFile(filenameStem: string, diff: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeStem = filenameStem
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "chronogit-diff";

  return saveBackupFile(
    `${safeStem}-${timestamp}.patch`,
    diff,
  );
}

