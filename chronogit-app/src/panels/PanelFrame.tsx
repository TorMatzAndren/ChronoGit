import type { ReactNode } from "react";
import "./PanelFrame.css";

type Props = {
  title: string;
  children: ReactNode;
};

export function PanelFrame({ title, children }: Props) {
  return (
    <section className="chronogit-panel-frame">
      <header className="chronogit-panel-frame__header">
        <h2>{title}</h2>
      </header>
      <div className="chronogit-panel-frame__body">{children}</div>
    </section>
  );
}
