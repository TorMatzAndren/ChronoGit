import type {
  ConfirmAction,
  ExplainContext,
  RemoteOperationPreview,
} from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  remoteBusy: string;
  remotePreview: RemoteOperationPreview | null;
  fetchRemoteKnowledge: () => Promise<void>;
  loadRemotePreview: (kind: "push" | "pull") => Promise<void>;
  abortRebase: () => Promise<void>;
  isUploadPreviewArmed: (preview: RemoteOperationPreview) => boolean;
  setConfirmAction: (action: ConfirmAction | null) => void;
  setConfirmText: (text: string) => void;
  setArmedRemoteUploadKey: (key: string) => void;
  setLastAction: (text: string) => void;
  setMessage: (text: string) => void;
  executePush: (preview: RemoteOperationPreview) => Promise<void>;
  executePullRebase: (preview: RemoteOperationPreview) => Promise<void>;
  explainUiContext: (context: ExplainContext) => Promise<void>;
  uiExplainBusy: boolean;
  llmModel: string;
};

function ui(beginnerMode: boolean, beginner: string, pro: string) {
  return beginnerMode ? beginner : pro;
}

function mergeClassificationCondition(preview: RemoteOperationPreview) {
  if (preview.merge_safety.working_changes > 0) return "Working tree not clean";
  return "No extra condition flags.";
}

function remoteSafetyGateTitle(preview: RemoteOperationPreview) {
  if (preview.operation === "download_updates_preview") {
    if (preview.merge_safety.risk_level === "HIGH") return "Download blocked by default";
    if (preview.merge_safety.risk_level === "MEDIUM") return "Download needs review first";
    return "Download appears low-risk";
  }
  if (preview.behind > 0) return "Upload does not resolve divergence";
  return "Upload appears straightforward";
}

function remoteSafetyGateText(preview: RemoteOperationPreview) {
  if (preview.operation === "download_updates_preview") {
    if (preview.merge_safety.risk_level === "HIGH") return "Same-path overlap and dirty working state can cause conflict.";
    if (preview.merge_safety.risk_level === "MEDIUM") return "Review first. Clean or snapshot working changes if possible.";
    return "No same-path overlap or dirty working state was detected.";
  }
  if (preview.behind > 0) return "Upload can publish local commits, but remote-only commits still exist.";
  return "Upload would publish local snapshots. Working files should not change.";
}

function guardedRemoteActionTitle(preview: RemoteOperationPreview) {
  const action = preview.operation === "download_updates_preview" ? "Download updates" : "Upload snapshots";
  if (preview.merge_safety.risk_level === "HIGH") return `${action}: high-risk override required`;
  if (preview.merge_safety.risk_level === "MEDIUM") return `${action}: confirmation required`;
  return `${action}: low-risk confirmation`;
}

function guardedRemoteActionBody(preview: RemoteOperationPreview) {
  const action = preview.operation === "download_updates_preview" ? "download/merge remote updates" : "upload local snapshots";
  return [
    `Requested action: ${action}`,
    "",
    `Risk: ${preview.merge_safety.risk_level}`,
    `Classification: ${preview.merge_safety.classification}`,
    `Condition: ${mergeClassificationCondition(preview)}`,
    `Ahead / behind: +${preview.ahead} / -${preview.behind}`,
    "",
    "Safety summary:",
    preview.merge_safety.summary,
    "",
    "Warning:",
    preview.merge_safety.warning,
  ].join("\n");
}

function guardedRemoteActionLabel(preview: RemoteOperationPreview) {
  if (preview.merge_safety.risk_level === "HIGH") return "I understand: override high-risk gate";
  if (preview.merge_safety.risk_level === "MEDIUM") return "Confirm medium-risk intention";
  return "Confirm low-risk intention";
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

export function RemoteActionsPanel({
  beginnerMode,
  remoteBusy,
  remotePreview,
  fetchRemoteKnowledge,
  loadRemotePreview,
  abortRebase,
  isUploadPreviewArmed,
  setConfirmAction,
  setConfirmText,
  setArmedRemoteUploadKey,
  setLastAction,
  setMessage,
  executePush,
  executePullRebase,
  explainUiContext,
  uiExplainBusy,
  llmModel,
}: Props) {
  return (
    <div className="cg-panel-content remote-actions-panel">
      <div className="remote-actions-panel__buttons">
        <button disabled={remoteBusy !== ""} onClick={fetchRemoteKnowledge}>{ui(beginnerMode, "Fetch remote knowledge", "git fetch")}</button>
        <button disabled={remoteBusy !== ""} onClick={() => loadRemotePreview("push")}>{ui(beginnerMode, "Upload snapshots preview", "git push --dry-run")}</button>
        <button disabled={remoteBusy !== ""} onClick={() => loadRemotePreview("pull")}>{ui(beginnerMode, "Download updates preview", "git pull preview")}</button>
        <button className="danger-button" disabled={remoteBusy !== ""} onClick={abortRebase}>{ui(beginnerMode, "Abort rebase", "git rebase --abort")}</button>
      </div>

      {remotePreview ? (
        <div className="remote-preview-box">
          <div className="remote-preview-box__truth">
            <div><strong>Operation</strong><span>{remotePreview.operation}</span></div>
            <div><strong>Branch</strong><span>{remotePreview.branch}</span></div>
            <div><strong>Upstream</strong><span>{remotePreview.upstream || "none"}</span></div>
            <div><strong>Ahead / behind</strong><span>+{remotePreview.ahead} / -{remotePreview.behind}</span></div>
          </div>

          <div className="remote-preview-box__message"><strong>Consequence</strong><span>{remotePreview.consequence}</span></div>
          <div className="remote-preview-box__warning"><strong>Warning</strong><span>{remotePreview.warning}</span></div>

          <div className="remote-merge-safety">
            <strong>{remotePreview.merge_safety.classification}</strong>
            <p>{remotePreview.merge_safety.summary}</p>
            <p>{remotePreview.merge_safety.warning}</p>
            <div className={`merge-risk merge-risk--${remotePreview.merge_safety.risk_level.toLowerCase()}`}>RISK: {remotePreview.merge_safety.risk_level}</div>
          </div>

          <div className={`remote-safety-gate remote-safety-gate--${remotePreview.merge_safety.risk_level.toLowerCase()}`}>
            <strong>{remoteSafetyGateTitle(remotePreview)}</strong>
            <span>{remoteSafetyGateText(remotePreview)}</span>

            {remotePreview.operation === "upload_snapshots_preview" ? (
              <em>{isUploadPreviewArmed(remotePreview) ? "Preview acknowledged. Execute push is available." : "Acknowledge preview first. No push happens yet."}</em>
            ) : null}

            <button disabled={uiExplainBusy || !llmModel} onClick={() => explainUiContext({
              kind: "remote",
              title: "Explain remote preview",
              plainText: `${remotePreview.consequence}\n${remotePreview.warning}`,
              rawTruth: JSON.stringify(remotePreview, null, 2),
            })}>{ui(beginnerMode, "Ask LLM", "explain_context")}</button>

            <button
              className={remotePreview.merge_safety.risk_level === "HIGH" ? "danger-button" : ""}
              onClick={() => {
                const preview = remotePreview;
                const uploadArmed = isUploadPreviewArmed(preview);

                setConfirmAction({
                  title: preview.operation === "upload_snapshots_preview" && uploadArmed ? "Execute push: final confirmation" : guardedRemoteActionTitle(preview),
                  body: preview.operation === "upload_snapshots_preview" && uploadArmed
                    ? "This will upload local snapshots to the configured remote.\n\nChronoGit will not force push."
                    : guardedRemoteActionBody(preview),
                  confirmLabel: preview.operation === "upload_snapshots_preview" && uploadArmed
                    ? ui(beginnerMode, "Execute upload", "git push")
                    : preview.operation === "upload_snapshots_preview"
                      ? ui(beginnerMode, "Acknowledge preview only", "ack preview")
                      : guardedRemoteActionLabel(preview),
                  danger: preview.merge_safety.risk_level === "HIGH",
                  requiredText: preview.merge_safety.risk_level === "HIGH" ? "override" : undefined,
                  requiredTextLabel: preview.merge_safety.risk_level === "HIGH" ? "Type override to intentionally continue despite HIGH risk." : undefined,
                  action: async () => {
                    if (preview.operation === "download_updates_preview") {
                      await executePullRebase(preview);
                      return;
                    }

                    if (!uploadArmed) {
                      setArmedRemoteUploadKey(remotePreviewKey(preview));
                      setLastAction("Upload preview acknowledged. No push executed.");
                      setMessage("Upload preview acknowledged. Execute push is now available for this exact preview.");
                      return;
                    }

                    await executePush(preview);
                  },
                });

                setConfirmText("");
              }}
            >
              {remotePreview.operation === "upload_snapshots_preview" && isUploadPreviewArmed(remotePreview)
                ? ui(beginnerMode, "Execute upload", "git push")
                : remotePreview.operation === "upload_snapshots_preview"
                  ? ui(beginnerMode, "Acknowledge preview only", "ack preview")
                  : ui(beginnerMode, "Confirm download intention", "git pull --rebase --autostash")}
            </button>
          </div>

          <div className="remote-preview-columns">
            <div><h3>Snapshots ({remotePreview.commit_count})</h3>{remotePreview.commits.map((commit) => <code key={commit}>{commit}</code>)}</div>
            <div><h3>Files ({remotePreview.changed_files.length})</h3>{remotePreview.changed_files.map((file) => <code key={`${file.status}-${file.path}`}>{file.status} {file.path}</code>)}</div>
          </div>
        </div>
      ) : <p>No remote preview loaded.</p>}
    </div>
  );
}
