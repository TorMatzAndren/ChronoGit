type Props = {
  workingCount: number;
  stagedCount: number;
};

export function FlowStripPanel({ workingCount, stagedCount }: Props) {
  return (
    <section className="flow-strip flow-strip--compact">
      <div className="flow-step">
        <strong>Working files</strong>
        <span>{workingCount} not prepared</span>
      </div>
      <div className="flow-arrow">→</div>
      <div className="flow-step">
        <strong>Prepared changes</strong>
        <span>{stagedCount} ready for snapshot</span>
      </div>
      <div className="flow-arrow">→</div>
      <div className="flow-step flow-step--locked">
        <strong>Snapshot</strong>
        <span>{stagedCount ? "Review preflight next" : "Prepare files first"}</span>
      </div>
    </section>
  );
}
