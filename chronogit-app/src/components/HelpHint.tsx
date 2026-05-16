import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
  align?: "left" | "right";
};

export function HelpHint({
  title,
  children,
  compact = false,
  align = "left",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div
      className={
        [
          "cg-help-hint",
          compact ? "cg-help-hint--compact" : "",
          align === "right" ? "cg-help-hint--right" : "cg-help-hint--left",
        ].filter(Boolean).join(" ")
      }
      ref={rootRef}
    >
      <button
        type="button"
        className="cg-help-hint__button"
        onClick={() => setOpen((current) => !current)}
        title={title}
      >
        ?
      </button>

      {open ? (
        <div className="cg-help-hint__popup">
          <strong>{title}</strong>
          <div>{children}</div>
        </div>
      ) : null}
    </div>
  );
}
