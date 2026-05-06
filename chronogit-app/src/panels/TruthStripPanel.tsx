type GitRemoteStatus = {
  repo_path: string;
  branch: string;
  upstream: string | null;
  remote: string | null;
  remote_url: string | null;
  ahead: number;
  behind: number;
  has_remote: boolean;
  is_diverged: boolean;
  is_clean: boolean;
};

type Props = {
  workingCount: number;
  stagedCount: number;
  remoteStatus: GitRemoteStatus | null;
  remoteStateClass: (remote: GitRemoteStatus | null) => string;
  remoteStateLabel: (remote: GitRemoteStatus | null) => string;
  remoteTruthText: (remote: GitRemoteStatus | null) => string;
};

export function TruthStripPanel({
  workingCount,
  stagedCount,
  remoteStatus,
  remoteStateClass,
  remoteStateLabel,
  remoteTruthText,
}: Props) {
  return (
    <section className={`truth-strip truth-strip--${remoteStateClass(remoteStatus)}`}>
      <div title="Working-folder changes are files changed on disk but not prepared for the next commit."><strong>Working</strong><span>{workingCount}</span></div>
      <div title="Prepared changes are staged files that will be included if you commit now."><strong>Prepared</strong><span>{stagedCount}</span></div>
      <div title="Remote shows whether your local branch is synced with its remote tracking branch."><strong>Remote</strong><span>{remoteTruthText(remoteStatus)}</span></div>
      <div title="State summarizes the local/remote relationship."><strong>State</strong><span>{remoteStateLabel(remoteStatus)}</span></div>
    </section>
  );
}
