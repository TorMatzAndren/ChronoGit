import { invoke } from "@tauri-apps/api/core";

import type {
  CommitPreflight,
  CommitResult,
  BranchMergePreview,
  BranchMergeResult,
  BranchRelationshipPreview,
  CommitComparison,
  ExplainDiffResult,
  GitRemoteStatus,
  GitStatusResponse,
  RemoteOperationPreview,
  RemotePullResult,
  RemotePushResult,
} from "./chronogitRuntimeTypes";


export async function inspectBranchRelationship(
  repoPath: string,
  leftBranch: string,
  rightBranch: string,
): Promise<BranchRelationshipPreview> {
  return invoke<BranchRelationshipPreview>(
    "git_branch_relationship_preview",
    {
      repoPath,
      leftBranch,
      rightBranch,
    },
  );
}


export async function previewBranchMerge(
  repoPath: string,
  targetBranch: string,
): Promise<BranchMergePreview> {
  return invoke<BranchMergePreview>(
    "git_merge_branch_preview",
    {
      repoPath,
      targetBranch,
    },
  );
}

export async function executeBranchMerge(
  repoPath: string,
  targetBranch: string,
  confirmation: string,
): Promise<BranchMergeResult> {
  return invoke<BranchMergeResult>(
    "git_merge_branch_execute",
    {
      repoPath,
      targetBranch,
      confirmation,
    },
  );
}

export async function executeFileAction(
  repoPath: string,
  action:
    | "git_stage"
    | "git_unstage"
    | "git_unstage_prefix"
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


export async function compareCommits(
  repoPath: string,
  leftCommit: string,
  rightCommit: string,
): Promise<CommitComparison> {
  return invoke<CommitComparison>(
    "git_compare_commits",
    {
      repoPath,
      leftCommit,
      rightCommit,
    },
  );
}

export async function explainComparisonWithOllama(
  model: string,
  comparison: CommitComparison,
): Promise<ExplainDiffResult> {
  return invoke<ExplainDiffResult>(
    "explain_comparison_with_ollama",
    {
      model,
      leftLabel: comparison.left_label,
      rightLabel: comparison.right_label,
      fileCount: comparison.changed_files.length,
      insertions: comparison.insertions,
      deletions: comparison.deletions,
      changedFilesText: comparison.changed_files
        .map((file) => `${file.status}\t${file.path}`)
        .join("\n"),
      diff: comparison.diff,
    },
  );
}

export async function explainMergeRiskWithOllama(
  model: string,
  args: {
    currentBranch: string;
    incomingBranch: string;
    mode: string;
    riskLevel: string;
    sharedFilesText: string;
    changedFilesText: string;
    diff: string;
  },
): Promise<ExplainDiffResult> {
  return invoke<ExplainDiffResult>(
    "explain_merge_risk_with_ollama",
    {
      model,
      currentBranch: args.currentBranch,
      incomingBranch: args.incomingBranch,
      mode: args.mode,
      riskLevel: args.riskLevel,
      sharedFilesText: args.sharedFilesText,
      changedFilesText: args.changedFilesText,
      diff: args.diff,
    },
  );
}

