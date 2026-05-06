import { useEffect, useRef, useState } from "react";
import type { PanelType } from "../core/chronogitWorkspaceTypes";
import { PANEL_REGISTRY } from "../panels/panelRegistry";

type Props = {
  value: PanelType;
  onChange: (type: PanelType) => void;
  beginnerMode: boolean;
};

export function PanelDropdown({
  value,
  onChange,
  beginnerMode,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selected = PANEL_REGISTRY.find((panel) => panel.type === value) || PANEL_REGISTRY[0];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="cg-panel-dropdown" ref={rootRef}>
      <button type="button" className="cg-panel-dropdown__button" onClick={() => setOpen((current) => !current)}>
        <span>{selected.title}</span>
        <b>{open ? "▲" : "▼"}</b>
      </button>

      {open ? (
        <div className="cg-panel-dropdown__menu">
          <div className="cg-panel-dropdown__list">
            {PANEL_REGISTRY.map((panel) => (
              <button
                type="button"
                key={panel.type}
                className={panel.type === value ? "cg-panel-dropdown__item cg-panel-dropdown__item--active" : "cg-panel-dropdown__item"}
                title={beginnerMode ? panel.description : panel.type}
                onClick={() => {
                  onChange(panel.type);
                  setOpen(false);
                }}
              >
                <strong>{panel.title}</strong>
                <span>{beginnerMode ? panel.description : panel.type}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
