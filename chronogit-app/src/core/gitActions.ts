import { invoke } from "@tauri-apps/api/core";

import type {
  CommitPreflight,
  CommitResult,
  GitRemoteStatus,
  GitStatusResponse,
  RemoteOperationPreview,
  RemotePullResult,
  RemotePushResult,
} from "./chronogitRuntimeTypes";

export async function executeFileAction(
  repoPath: string,
  action:
    | "git_stage"
    | "git_unstage"
    | "git_restore"
    | "git_remove_untracked"
    | "git_ignore_path",
  path: string,
): Promise<string> {
  return invoke<string>(action, {
    repoPath,
    path,
  });
}

export async function openSnapshotPreflight(
  repoPath: string,
): Promise<CommitPreflight> {
  return invoke<CommitPreflight>(
    "git_commit_preflight",
    { repoPath },
  );
}

export async function confirmSnapshot(
  repoPath: string,
  message: string,
): Promise<CommitResult> {
  return invoke<CommitResult>(
    "git_commit",
    {
      repoPath,
      message,
    },
  );
}

export async function fetchRemoteKnowledge(
  repoPath: string,
): Promise<string> {
  return invoke<string>(
    "git_fetch_remote",
    { repoPath },
  );
}

export async function loadRemotePreview(
  repoPath: string,
  kind: "push" | "pull",
): Promise<RemoteOperationPreview> {
  const command =
    kind === "push"
      ? "git_push_preview"
      : "git_pull_preview";

  return invoke<RemoteOperationPreview>(
    command,
    { repoPath },
  );
}

export async function executePush(
  repoPath: string,
  overrideToken: string,
): Promise<RemotePushResult> {
  return invoke<RemotePushResult>(
    "git_push_execute",
    {
      repoPath,
      overrideToken,
    },
  );
}

export async function executePullRebase(
  repoPath: string,
  overrideToken: string,
): Promise<RemotePullResult> {
  return invoke<RemotePullResult>(
    "git_pull_rebase_execute",
    {
      repoPath,
      overrideToken,
    },
  );
}

export async function abortRebase(
  repoPath: string,
): Promise<string> {
  return invoke<string>(
    "git_rebase_abort",
    { repoPath },
  );
}

export async function refreshGitState(
  repoPath: string,
): Promise<{
  statusResult: GitStatusResponse;
  remoteResult: GitRemoteStatus;
}> {
  const [
    statusResult,
    remoteResult,
  ] = await Promise.all([
    invoke<GitStatusResponse>(
      "git_status",
      { repoPath },
    ),
    invoke<GitRemoteStatus>(
      "git_remote_status",
      { repoPath },
    ),
  ]);

  return {
    statusResult,
    remoteResult,
  };
}
