type Props = {
  workingCount: number;
  stagedCount: number;
  totalChanges: number;
};

export function SummaryGridPanel({ workingCount, stagedCount, totalChanges }: Props) {
  return (
    <section className="summary-grid">
      <div className="summary-card">
        <div className="summary-card__number">{workingCount}</div>
        <div>working changes</div>
      </div>
      <div className="summary-card">
        <div className="summary-card__number">{stagedCount}</div>
        <div>prepared changes</div>
      </div>
      <div className="summary-card">
        <div className="summary-card__number">{totalChanges}</div>
        <div>total visible changes</div>
      </div>
    </section>
  );
}
