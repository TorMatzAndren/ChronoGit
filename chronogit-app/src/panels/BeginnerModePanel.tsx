type Props = {
  beginnerMode: boolean;
  onToggle: () => void;
};

export function BeginnerModePanel({ beginnerMode, onToggle }: Props) {
  return (
    <div className="beginner-main-card">
      <div className="beginner-main-card__title">Mode</div>
      <button
        className={`beginner-toggle ${beginnerMode ? "beginner-toggle--on" : "beginner-toggle--off"}`}
        onClick={onToggle}
      >
        Beginner mode: {beginnerMode ? "ON" : "OFF"}
      </button>
      <div className="beginner-main-card__note">
        {beginnerMode
          ? "Shows teaching hints, hover help, and plain-language Git meaning."
          : "Compact expert view. Raw Git truth stays visible."}
      </div>
    </div>
  );
}
